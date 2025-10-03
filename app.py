from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from typing import Dict, List, Any, Optional

# Inicializa a aplicação Flask
app = Flask(__name__)

# Configurações
app.config['DEBUG'] = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
app.config['JSON_SORT_KEYS'] = False  # Mantém ordem dos campos no JSON

# Permite CORS apenas para origens específicas em produção
CORS(app)

# Configurações da API NCBI
NCBI_API_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"
NCBI_RATE_LIMIT_DELAY = 0.34  # Segundos entre requisições (máx 3/s)

# Configurações de segurança - use variáveis de ambiente
API_KEY = os.environ.get('NCBI_API_KEY', 'c26b781179baae5221641c72f01ff6f8dd08')
TOOL_EMAIL = os.environ.get('NCBI_EMAIL', 'gabrielmuu7@gmail.com')
TOOL_NAME = "Genome-Analyzer-Dashboard"

# Cliente HTTP com configurações de timeout e retry
class NCBIClient:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': f'{TOOL_NAME} ({TOOL_EMAIL})'
        })
    
    def make_request(self, endpoint: str, params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Faz requisição para API NCBI com tratamento de erros"""
        try:
            url = f"{NCBI_API_BASE_URL}{endpoint}"
            response = self.session.get(
                url, 
                params=params,
                timeout=30  # 30 segundos de timeout
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.Timeout:
            app.logger.error(f"Timeout na requisição para {endpoint}")
            return None
        except requests.exceptions.RequestException as e:
            app.logger.error(f"Erro na requisição para {endpoint}: {e}")
            return None

# Instância do cliente
ncci_client = NCBIClient()

def format_ncbi_params(additional_params: Dict[str, Any] = None) -> Dict[str, Any]:
    """Retorna parâmetros padrão para API NCBI"""
    params = {
        "tool": TOOL_NAME,
        "email": TOOL_EMAIL,
        "api_key": API_KEY,
        "retmode": "json"
    }
    if additional_params:
        params.update(additional_params)
    return params

# Em app.py

@app.route('/api/search', methods=['GET'])
# Em app.py

@app.route('/api/search', methods=['GET'])
def search_genome():
    search_term = request.args.get('term')
    if not search_term:
        return jsonify({"error": "O parâmetro 'term' é obrigatório"}), 400

    try:
        esearch_params = {
            "db": "assembly",
            "term": search_term,
            "retmode": "json",
            "tool": "my-dashboard",
            "email": TOOL_EMAIL,
            "api_key": API_KEY,
        }
        
        search_response = requests.get(f"{NCBI_API_BASE_URL}esearch.fcgi", params=esearch_params)
        search_response.raise_for_status()
        search_data = search_response.json()
        
        id_list = search_data.get("esearchresult", {}).get("idlist")
        
        if not id_list:
            return jsonify([])

        ids_str = ",".join(id_list)
        esummary_params = {
            "db": "assembly",
            "id": ids_str,
            "retmode": "json",
            "tool": "my-dashboard",
            "email": TOOL_EMAIL,
            "api_key": API_KEY,
        }
        
        summary_response = requests.get(f"{NCBI_API_BASE_URL}esummary.fcgi", params=esummary_params)
        summary_response.raise_for_status()
        summary_data = summary_response.json()

        results = []
        raw_results = summary_data.get("result", {})
        
        for uid in raw_results.get("uids", []):
            genome_info = raw_results[uid]
            
            # --- INÍCIO DA CORREÇÃO ---
            # As etiquetas aqui foram atualizadas para corresponder ao formato do 'assembly'
            results.append({
                "id": uid,
                "organism": genome_info.get("organism", "N/A"),
                "title": genome_info.get("assemblyname", "N/A"),
                "accession": genome_info.get("assemblyaccession", "N/A"),
                "create_date": genome_info.get("submissiondate", "N/A")
            })
            # --- FIM DA CORREÇÃO ---

        return jsonify(results)

    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Erro ao contatar a API do NCBI: {e}"}), 500
    except Exception as e:
        return jsonify({"error": f"Um erro inesperado ocorreu: {e}"}), 500
@app.route('/api/analyze-genome', methods=['POST'])
def analyze_genome():
    """
    Endpoint para analisar um genoma do NCBI
    
    Body (JSON):
    {
        "id": "ID do genoma",
        "accession": "número de acesso", 
        "organism": "nome do organismo"
    }
    
    Retorna análise simulada do genoma
    """
    # Valida conteúdo JSON
    if not request.is_json:
        return jsonify({"error": "Content-Type deve ser application/json"}), 415
    
    data = request.get_json()
    if not data:
        return jsonify({"error": "Body deve conter JSON válido"}), 400
    
    # Valida campos obrigatórios
    required_fields = ['id', 'accession', 'organism']
    missing_fields = [field for field in required_fields if not data.get(field)]
    
    if missing_fields:
        return jsonify({
            "error": f"Campos obrigatórios faltando: {', '.join(missing_fields)}"
        }), 400

    try:
        genome_id = data['id']
        accession = data['accession']
        organism = data['organism']
        
        # Gera análise simulada baseada no accession (determinística)
        hash_value = hash(accession) % 10000  # Para valores consistentes
        
        analysis_result = {
            'id': genome_id,
            'name': organism,
            'accession': accession,
            'size': 2_000_000 + (hash_value * 100),  # Entre 2-3 milhões
            'gcContent': round(40 + (hash_value % 200) / 10, 2),  # Entre 40-60%
            'genes': 5_000 + (hash_value % 3_000),  # Entre 5.000-8.000
            'contigs': 1 + (hash_value % 100),  # Entre 1-100
            'n50': 50_000 + (hash_value * 10),  # Valor N50 simulado
            'coverage': 50 + (hash_value % 50),  # Entre 50-100x
            'status': 'completed',
            'analysis_type': 'simulated_analysis'
        }
        
        return jsonify(analysis_result)
        
    except Exception as e:
        app.logger.error(f"Erro na análise do genoma: {e}")
        return jsonify({"error": "Erro interno durante análise"}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint de saúde da API"""
    return jsonify({
        "status": "online",
        "service": "NCBI Genome Search API",
        "version": "1.0.0"
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint não encontrado"}), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({"error": "Método não permitido"}), 405

@app.errorhandler(500)
def internal_server_error(error):
    return jsonify({"error": "Erro interno do servidor"}), 500

if __name__ == '__main__':
    # Em produção, use um servidor WSGI como Gunicorn
    port = int(os.environ.get('PORT', 5000))
    app.run(
        host='0.0.0.0', 
        port=port, 
        debug=app.config['DEBUG']
    )