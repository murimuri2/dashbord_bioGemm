from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
import gzip
import io
import re
from typing import Dict, List, Any, Optional

# Inicializa a aplicação Flask
app = Flask(__name__)

# Configurações
app.config['DEBUG'] = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
app.config['JSON_SORT_KEYS'] = False

# Permite CORS
CORS(app)

# Configurações NCBI
NCBI_API_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"
API_KEY = os.environ.get('NCBI_API_KEY', 'c26b781179baae5221641c72f01ff6f8dd08')
TOOL_EMAIL = os.environ.get('NCBI_EMAIL', 'gabrielmuu7@gmail.com')
TOOL_NAME = "Genome-Analyzer-Dashboard"

# --- ROTA 1: BUSCAR GENOMAS ---
@app.route('/api/search', methods=['GET'])
def search_genome():
    search_term = request.args.get('term')
    if not search_term:
        return jsonify({"error": "Termo de busca obrigatório"}), 400

    try:
        # 1. Busca IDs
        params = {
            "db": "assembly",
            "term": search_term,
            "retmode": "json",
            "tool": TOOL_NAME, 
            "email": TOOL_EMAIL, 
            "api_key": API_KEY
        }
        resp = requests.get(f"{NCBI_API_BASE_URL}esearch.fcgi", params=params)
        resp.raise_for_status()
        id_list = resp.json().get("esearchresult", {}).get("idlist", [])

        if not id_list:
            return jsonify([])

        # 2. Pega Detalhes
        summary_params = {
            "db": "assembly",
            "id": ",".join(id_list),
            "retmode": "json",
            "tool": TOOL_NAME, "email": TOOL_EMAIL, "api_key": API_KEY
        }
        summary_resp = requests.get(f"{NCBI_API_BASE_URL}esummary.fcgi", params=summary_params)
        summary_resp.raise_for_status()
        raw_results = summary_resp.json().get("result", {})

        results = []
        for uid in raw_results.get("uids", []):
            item = raw_results[uid]
            # Prioriza RefSeq (GCF) na visualização
            accession = item.get("assemblyaccession", "N/A")
            is_refseq = accession.startswith("GCF")
            
            results.append({
                "id": uid,
                "organism": item.get("organism", "N/A"),
                "title": item.get("assemblyname", "N/A") + (" (RefSeq)" if is_refseq else " (GenBank)"),
                "accession": accession,
                "create_date": item.get("submissiondate", "N/A"),
                "is_refseq": is_refseq # Flag para o frontend saber qual é melhor
            })
            
        # Ordena para mostrar RefSeq (GCF) primeiro
        results.sort(key=lambda x: x['is_refseq'], reverse=True)
        
        return jsonify(results)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- ROTA 2: SIMULAÇÃO DE ESTATÍSTICAS ---
@app.route('/api/analyze-genome', methods=['POST'])
def analyze_genome():
    data = request.get_json()
    return jsonify({
        'id': data.get('id'),
        'name': data.get('organism'),
        'accession': data.get('accession'),
        'size': 30_000_000,
        'gcContent': 50.5,
        'genes': 9000,
        'contigs': 50,
        'type': 'ncbi',
        'status': 'completed'
    })

# --- ROTA 3: BAIXAR CDS REAIS (Sequência) ---
@app.route('/api/fetch-sequence', methods=['GET'])
def fetch_sequence():
    accession = request.args.get('accession')
    if not accession: return jsonify({"error": "Accession obrigatório"}), 400

    try:
        # Descobre FTP
        esearch_params = {"db": "assembly", "term": accession, "retmode": "json", "api_key": API_KEY}
        search_resp = requests.get(f"{NCBI_API_BASE_URL}esearch.fcgi", params=esearch_params)
        uids = search_resp.json().get("esearchresult", {}).get("idlist", [])
        
        if not uids: return jsonify({"error": "Genoma não encontrado"}), 404

        summary_params = {"db": "assembly", "id": uids[0], "retmode": "json", "api_key": API_KEY}
        sum_resp = requests.get(f"{NCBI_API_BASE_URL}esummary.fcgi", params=summary_params)
        data = sum_resp.json()['result'][uids[0]]
        
        ftp_path = data.get('ftppath_refseq') or data.get('ftppath_genbank')
        if not ftp_path: return jsonify({"error": "FTP não disponível"}), 404

        # Baixa CDS (_cds_from_genomic.fna.gz)
        file_name = ftp_path.split('/')[-1]
        cds_url = f"{ftp_path}/{file_name}_cds_from_genomic.fna.gz".replace("ftp://", "https://")
        
        resp = requests.get(cds_url)
        if resp.status_code == 404:
            return jsonify({"error": "Arquivo de genes (CDS) não encontrado para este genoma. Tente um genoma RefSeq (GCF)."}), 404
            
        with gzip.open(io.BytesIO(resp.content), 'rt') as f:
            fasta_content = f.read()

        return jsonify({"fasta": fasta_content})

    except Exception as e:
        return jsonify({"error": f"Erro: {str(e)}"}), 500

# --- ROTA 4: EXTRAÇÃO AUTOMÁTICA DE tRNAs ---
@app.route('/api/fetch-trna', methods=['GET'])
def fetch_trna_counts():
    accession = request.args.get('accession')
    if not accession: return jsonify({"error": "Accession obrigatório"}), 400

    try:
        # 1. Obter link FTP
        esearch_params = {"db": "assembly", "term": accession, "retmode": "json", "api_key": API_KEY}
        search_resp = requests.get(f"{NCBI_API_BASE_URL}esearch.fcgi", params=esearch_params)
        uids = search_resp.json().get("esearchresult", {}).get("idlist", [])
        
        if not uids: return jsonify({"error": "Genoma não encontrado"}), 404

        summary_params = {"db": "assembly", "id": uids[0], "retmode": "json", "api_key": API_KEY}
        sum_resp = requests.get(f"{NCBI_API_BASE_URL}esummary.fcgi", params=summary_params)
        data = sum_resp.json()['result'][uids[0]]
        
        ftp_path = data.get('ftppath_refseq') or data.get('ftppath_genbank')
        if not ftp_path: return jsonify({"error": "FTP não disponível"}), 404

        # 2. Construir URL para Feature Table
        file_name = ftp_path.split('/')[-1]
        ft_url = f"{ftp_path}/{file_name}_feature_table.txt.gz".replace("ftp://", "https://")
        
        print(f"Buscando tRNAs em: {ft_url}") # Log para debug
        
        resp = requests.get(ft_url)
        if resp.status_code == 404:
            # Mensagem de erro específica para o problema do GenBank
            msg = "A tabela de anotação não existe para este genoma."
            if accession.startswith("GCA"):
                msg += " Genomas GenBank (GCA) frequentemente não têm esse arquivo. Tente buscar um genoma RefSeq (GCF)."
            return jsonify({"error": msg}), 404

        # 3. Processar Arquivo
        trna_counts = {}
        with gzip.open(io.BytesIO(resp.content), 'rt') as f:
            for line in f:
                if line.startswith('#'): continue
                parts = line.strip().split('\t')
                
                # Verifica se é tRNA
                if len(parts) > 0 and parts[0] == 'tRNA':
                    anticodon = None
                    # Procura anticodon=XYZ na linha inteira (mais robusto)
                    match = re.search(r'anticodon=([A-Za-z]{3})', line)
                    if match:
                        anticodon = match.group(1).upper()
                    
                    if anticodon and len(anticodon) == 3:
                        trna_counts[anticodon] = trna_counts.get(anticodon, 0) + 1

        if not trna_counts:
            return jsonify({"error": "Nenhum tRNA encontrado na anotação deste genoma. Tente um arquivo GCF (RefSeq)."}), 404

        result_list = [{"Anticodon": k, "Copias": v} for k, v in trna_counts.items()]
        
        return jsonify({
            "counts": result_list,
            "message": f"Sucesso! {sum(trna_counts.values())} tRNAs identificados."
        })

    except Exception as e:
        print(f"Erro no servidor: {e}")
        return jsonify({"error": f"Erro interno: {str(e)}"}), 500

# --- Health Check ---
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "online"})

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint não encontrado"}), 404

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)