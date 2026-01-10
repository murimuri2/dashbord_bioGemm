/**
 * ARQUIVO: js/tai-analysis.js
 * Responsabilidade: Controlador principal, Event Listeners e lógica matemática do tAI.
 * VERSÃO CORRIGIDA - Sem duplicações e com todas as dependências resolvidas
 */

document.addEventListener('DOMContentLoaded', () => {
    // Referências do DOM
    const btnCalc = document.getElementById('btn-calculate-tai');
    const statusDiv = document.getElementById('tai-status');
    const genomeSelect = document.getElementById('tai-genome-select');
    const fileInputContainer = document.getElementById('tai-file-input-container');
    const btnAutoTrna = document.getElementById('btn-auto-trna');
    const btnExportTrna = document.getElementById('btn-export-trna-csv');
    const trnaStatusMsg = document.getElementById('trna-status-msg');
    
    // Variável para cache de dados de tRNA da análise individual
    let currentSpeciesTrnaData = null;

    // Inicializa UI de Comparação (Função do comparison.js se existir)
    if (typeof injectComparisonUI === 'function') {
        injectComparisonUI();
    }

    // Garantir que speciesData existe
    if (typeof speciesData === 'undefined') {
        window.speciesData = {};
        console.warn('speciesData não estava definido. Inicializado como objeto vazio.');
    }

    // --- EVENT LISTENERS ---

    // 1. Atualizar lista de genomas ao mudar de aba
    const taiTab = document.querySelector('.tab[data-tab="tai-analysis"]');
    if (taiTab) {
        taiTab.addEventListener('click', () => {
            updateGenomeList();
            if (typeof updateMultiSpeciesIndicator === 'function') {
                updateMultiSpeciesIndicator();
            }
        });
    }

    // 2. Controle do Dropdown de Genomas (Upload vs Seleção)
    if (genomeSelect) {
        genomeSelect.addEventListener('change', (e) => {
            if (e.target.value === 'upload_new') {
                fileInputContainer.style.display = 'block';
                if(btnAutoTrna) btnAutoTrna.disabled = true;
            } else {
                fileInputContainer.style.display = 'none';
                if(btnAutoTrna) {
                    const isNcbi = speciesData[e.target.value]?.type === 'ncbi';
                    btnAutoTrna.disabled = !isNcbi;
                }
            }
        });
    }

    // 3. Botão Auto Import tRNA (Busca do Backend)
    if (btnAutoTrna) {
        btnAutoTrna.addEventListener('click', async () => {
            const selectedValue = genomeSelect.value;
            if (!selectedValue || !speciesData[selectedValue]) {
                return alert('Selecione um genoma válido');
            }
            
            const accession = speciesData[selectedValue].accession;
            if (!accession) {
                return alert('Genoma sem accession NCBI.');
            }
            
            const originalText = btnAutoTrna.innerHTML;
            btnAutoTrna.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
            btnAutoTrna.disabled = true;

            try {
                const response = await fetch(`http://localhost:5000/api/fetch-trna?accession=${accession}`);
                const data = await response.json();
                if (data.error) throw new Error(data.error);

                const trnaCounts = {};
                data.counts.forEach(item => trnaCounts[item.Anticodon] = item.Copias);
                
                // Cache local
                speciesData[selectedValue].trnaCounts = trnaCounts;
                currentSpeciesTrnaData = trnaCounts;

                // Renderiza Gráfico Individual (Função do charts.js)
                if (typeof renderIndividualTrnaChart === 'function') {
                    renderIndividualTrnaChart(trnaCounts, selectedValue);
                }

                trnaStatusMsg.innerHTML = `✅ ${Object.keys(trnaCounts).length} tRNAs carregados!`;
                trnaStatusMsg.style.color = '#27ae60';
                
                if (typeof updateMultiSpeciesIndicator === 'function') {
                    updateMultiSpeciesIndicator();
                }
                
                // Habilita exportação de tRNAs brutos
                if (btnExportTrna) {
                    btnExportTrna.style.display = 'block';
                    btnExportTrna.onclick = () => exportTrnaToCSV(trnaCounts, selectedValue);
                }

            } catch (error) {
                trnaStatusMsg.innerHTML = `❌ Erro: ${error.message}`;
                trnaStatusMsg.style.color = '#e74c3c';
            } finally {
                btnAutoTrna.innerHTML = originalText;
                btnAutoTrna.disabled = false;
            }
        });
    }

    // 4. Botão Calcular tAI (PRINCIPAL)
    if (btnCalc) {
        btnCalc.addEventListener('click', async () => {
            const selectedValue = genomeSelect.value;
            const trnaFile = document.getElementById('tai-trna-file')?.files[0];

            if (!selectedValue) {
                return alert("Selecione um genoma para análise.");
            }

            statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analisando...';
            
            try {
                // A. Coleta do Conteúdo FASTA
                let fastaContent = "";
                
                if (selectedValue === 'upload_new') {
                    const fastaFile = document.getElementById('tai-fasta-file')?.files[0];
                    if (!fastaFile) {
                        throw new Error("Selecione um arquivo FASTA para o novo genoma.");
                    }
                    fastaContent = await readFileContent(fastaFile);
                } else if (speciesData[selectedValue].type === 'ncbi') {
                    // Tenta buscar sequence cacheada ou baixa do backend
                    if (speciesData[selectedValue].sequenceContent) {
                        fastaContent = speciesData[selectedValue].sequenceContent;
                    } else {
                        const resp = await fetch(`http://localhost:5000/api/fetch-sequence?accession=${speciesData[selectedValue].accession}`);
                        const d = await resp.json();
                        if (d.error) throw new Error(d.error);
                        fastaContent = d.fasta;
                        speciesData[selectedValue].sequenceContent = fastaContent;
                    }
                } else {
                    // Genomas uploaded já têm sequenceContent
                    fastaContent = speciesData[selectedValue].sequenceContent;
                }

                if (!fastaContent) {
                    throw new Error("Conteúdo da sequência não encontrado.");
                }

                // B. Coleta dos dados de tRNA
                let trnaCounts;
                if (trnaFile) {
                    trnaCounts = await parseTRNAFile(trnaFile);
                } else if (currentSpeciesTrnaData) {
                    trnaCounts = currentSpeciesTrnaData;
                } else if (speciesData[selectedValue]?.trnaCounts) {
                    trnaCounts = speciesData[selectedValue].trnaCounts;
                } else {
                    throw new Error("Nenhum dado de tRNA disponível. Importe via NCBI ou faça upload de arquivo .csv");
                }
                
                // C. Processamento Matemático
                const genes = parseFastaContent(fastaContent);
                const weights = calculateCodonWeights(trnaCounts);
                
                // Cálculo do tAI por gene
                const results = [];
                let totalTai = 0;
                
                genes.forEach(g => {
                    const tai = calculateGeneTAI(g.seq, weights);
                    if (tai !== null) { 
                        results.push({name: g.name, tai: tai}); 
                        totalTai += tai; 
                    }
                });

                if (results.length === 0) {
                    throw new Error("Nenhum gene válido encontrado. Verifique se o FASTA está correto.");
                }

                // D. Atualização da Interface
                const meanTaiElement = document.getElementById('tai-mean-value');
                const totalGenesElement = document.getElementById('tai-total-genes');
                
                if (meanTaiElement) {
                    meanTaiElement.innerText = (totalTai / results.length).toFixed(4);
                }
                if (totalGenesElement) {
                    totalGenesElement.innerText = results.length;
                }
                
                // Renderiza Gráfico de Distribuição
                if (typeof renderTaiDistributionChart === 'function') {
                    renderTaiDistributionChart(results);
                }

                // E. Geração da Matriz de Códons
                const codonMatrixData = generateCodonMatrix(genes);

                // F. Criação dos Botões de Download
                createDownloadButtons(results, codonMatrixData);

                statusDiv.innerHTML = `<span style="color: #27ae60;">✅ Análise concluída com sucesso!</span>`;

            } catch(e) {
                console.error('Erro na análise tAI:', e);
                statusDiv.innerHTML = `<span style="color: #e74c3c;">❌ Erro: ${e.message}</span>`;
            }
        });
    }

    // 5. Botões de Matriz Comparativa e Batch
    const btnForceMatrix = document.getElementById('btn-force-matrix'); 
    if (btnForceMatrix) {
        btnForceMatrix.addEventListener('click', () => {
            if (typeof runMultiSpeciesAnalysis === 'function') {
                runMultiSpeciesAnalysis();
            }
        });
    }

    const btnBatchTrna = document.getElementById('btn-batch-import-trna');
    if (btnBatchTrna) {
        btnBatchTrna.addEventListener('click', async () => {
            const targetSpecies = Object.keys(speciesData).filter(key => 
                speciesData[key].type === 'ncbi' && speciesData[key].accession
            );
            
            if (targetSpecies.length === 0) {
                return alert("Nenhum genoma NCBI disponível para processamento em lote.");
            }
            
            if(!confirm(`Deseja importar tRNAs para ${targetSpecies.length} genomas NCBI automaticamente?`)) {
                return;
            }

            btnBatchTrna.disabled = true;
            btnBatchTrna.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';

            let sucessos = 0;
            for (let name of targetSpecies) {
                if (!speciesData[name].trnaCounts) {
                    try {
                        const res = await fetch(`http://localhost:5000/api/fetch-trna?accession=${speciesData[name].accession}`);
                        const d = await res.json();
                        if (!d.error) {
                            const c = {};
                            d.counts.forEach(i => c[i.Anticodon] = i.Copias);
                            speciesData[name].trnaCounts = c;
                            sucessos++;
                        }
                    } catch(e) {
                        console.warn(`Falha ao importar para ${name}`, e);
                    }
                } else {
                    sucessos++;
                }
            }

            btnBatchTrna.disabled = false;
            btnBatchTrna.innerHTML = '<i class="fas fa-check"></i> Batch Concluído';
            setTimeout(() => { 
                btnBatchTrna.innerHTML = '<i class="fas fa-layer-group"></i> 1. Importar Todos (Batch)'; 
            }, 3000);
            
            alert(`Processamento concluído. ${sucessos} genomas prontos.`);
            
            if (sucessos > 0 && typeof runMultiSpeciesAnalysis === 'function') {
                setTimeout(() => runMultiSpeciesAnalysis(), 500);
            }
        });
    }

    // --- FUNÇÕES AUXILIARES ---

    /**
     * Lê conteúdo de um arquivo
     */
    function readFileContent(file) { 
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        }); 
    }

    /**
     * Parse de arquivo tRNA CSV
     */
    async function parseTRNAFile(file) {
        const content = await readFileContent(file);
        const map = {}; 
        content.split('\n').forEach(line => {
            const parts = line.split(/[,\t]/); 
            if (parts.length >= 2) {
                const anticodon = parts[0].trim().toUpperCase();
                const count = parseFloat(parts[1]);
                if (anticodon && !isNaN(count)) {
                    map[anticodon] = count;
                }
            }
        }); 
        return map; 
    }

    /**
     * Parse de conteúdo FASTA
     */
    function parseFastaContent(txt) { 
        const genes = []; 
        let current = {name: "", seq: ""}; 
        
        txt.split('\n').forEach(line => {
            line = line.trim();
            if (!line) return;
            
            if (line.startsWith('>')) {
                if (current.name) genes.push(current);
                current = {name: line.substring(1).split(' ')[0], seq: ""};
            } else {
                // Permite apenas A, T, C, G, N
                current.seq += line.toUpperCase().replace(/[^ATCGN]/g, ''); 
            }
        }); 
        
        if (current.name) genes.push(current); 
        
        // Filtra genes válidos (múltiplos de 3 e não vazios)
        return genes.filter(gene => gene.seq.length % 3 === 0 && gene.seq.length > 0);
    }

    /**
     * Calcula pesos dos códons baseados em tRNAs
     */
    function calculateCodonWeights(trnaCounts) {
        if (typeof CODON_TABLE === 'undefined') {
            throw new Error("CODON_TABLE não encontrada. Verifique se utils.js foi carregado.");
        }

        const W = {}; 
        
        // Inicializa pesos
        for(let codon in CODON_TABLE) {
            W[codon] = ['STOP','Met','Trp'].includes(CODON_TABLE[codon]) ? 1 : 0;
        }
        
        // Mapeia tRNAs para códons usando regras de Wobble
        const complementMap = {'A':'T','T':'A','C':'G','G':'C'};
        
        Object.keys(trnaCounts).forEach(anticodon => {
            const count = trnaCounts[anticodon]; 
            if (count <= 0) return;

            const b1 = anticodon[0]; 
            const c2 = complementMap[anticodon[1]];
            const c1 = complementMap[anticodon[2]];
            
            let recognizedBases = [];
            
            // Regras de Wobble
            if (b1 === 'G') recognizedBases = ['C', 'T'];
            else if (b1 === 'C') recognizedBases = ['G'];
            else if (b1 === 'A') recognizedBases = ['T'];
            else if (b1 === 'T') recognizedBases = ['A', 'G'];
            else if (b1 === 'I') recognizedBases = ['A', 'C', 'T'];
            else if (complementMap[b1]) recognizedBases = [complementMap[b1]];
            
            recognizedBases.forEach(b3 => {
                const codon = c1 + c2 + b3; 
                if (W[codon] !== undefined) {
                    W[codon] += count;
                }
            });
        });
        
        // Normalização por aminoácido
        const maxWperAA = {};
        for (let codon in W) {
            const aa = CODON_TABLE[codon];
            if (!maxWperAA[aa] || W[codon] > maxWperAA[aa]) {
                maxWperAA[aa] = W[codon];
            }
        }

        const normalized = {}; 
        for (let codon in W) {
            const aa = CODON_TABLE[codon];
            const maxVal = maxWperAA[aa];
            
            if (['STOP','Met','Trp'].includes(aa)) {
                normalized[codon] = 1;
            } else {
                normalized[codon] = (maxVal > 0) ? (W[codon] / maxVal) : 0.0001; 
                if (normalized[codon] === 0) normalized[codon] = 0.0001;
            }
        }
        
        return normalized;
    }

    /**
     * Calcula tAI de um gene (média geométrica)
     */
    function calculateGeneTAI(seq, weights) {
        if (seq.length % 3 !== 0 || seq.length < 15) return null;
        
        let sequence = seq;
        const lastCodon = sequence.slice(-3);
        if (['TAA','TAG','TGA'].includes(lastCodon)) {
            sequence = sequence.slice(0, -3);
        }
        
        let logSum = 0;
        let codonCount = 0;
        
        for (let i = 0; i < sequence.length; i += 3) {
            const codon = sequence.substring(i, i+3);
            if (weights[codon] !== undefined) {
                logSum += Math.log(weights[codon]);
                codonCount++;
            }
        }
        
        return codonCount === 0 ? 0 : Math.exp(logSum / codonCount);
    }
    
    /**
     * Gera matriz de contagem de códons
     */
    function generateCodonMatrix(genes) {
        if (typeof ORDERED_CODONS === 'undefined') {
            console.warn('ORDERED_CODONS não definido. Matriz pode estar incompleta.');
            return [];
        }

        return genes.map(gene => {
            const counts = {}; 
            ORDERED_CODONS.forEach(codon => counts[codon] = 0);
            
            const seq = gene.seq;
            for (let i = 0; i < seq.length - 2; i += 3) { 
                const codon = seq.substring(i, i+3); 
                if (counts[codon] !== undefined) {
                    counts[codon]++; 
                }
            }
            return { name: gene.name, counts: counts };
        });
    }

    /**
     * Cria botões de download
     */
    function createDownloadButtons(taiResults, matrixData) {
        const container = document.querySelector('.loaded-genomes-display') || 
                         document.getElementById('tai-file-input-container')?.parentNode;
        
        if (!container) return;
        
        // Remove botões antigos
        const oldBtnTai = document.getElementById('btn-download-tai');
        const oldBtnMatrix = document.getElementById('btn-download-codon-matrix');
        if(oldBtnTai) oldBtnTai.remove();
        if(oldBtnMatrix) oldBtnMatrix.remove();

        // Botão CSV Resultados tAI
        const btnTai = document.createElement('button');
        btnTai.id = 'btn-download-tai';
        btnTai.innerHTML = '<i class="fas fa-file-csv"></i> Baixar Resultados tAI (.csv)';
        btnTai.style.cssText = 'margin-top: 20px; width: 100%; background: linear-gradient(135deg, #27ae60, #229954); padding: 14px; color: white; border:none; border-radius:4px; cursor:pointer;';
        
        btnTai.onclick = () => {
            const csv = "Gene,tAI\n" + taiResults.map(r => `${r.name},${r.tai.toFixed(5)}`).join("\n");
            downloadCSV(csv, "analise_tai_resultados.csv");
        };

        // Botão CSV Matriz de Códons
        const btnMatrix = document.createElement('button');
        btnMatrix.id = 'btn-download-codon-matrix';
        btnMatrix.innerHTML = '<i class="fas fa-th"></i> Baixar Matriz de Códons (.csv)';
        btnMatrix.style.cssText = 'margin-top: 10px; width: 100%; background: linear-gradient(135deg, #8e44ad, #9b59b6); padding: 14px; color: white; border:none; border-radius:4px; cursor:pointer;';
        
        btnMatrix.onclick = () => {
            if (typeof ORDERED_CODONS === 'undefined') {
                alert("Erro: ORDERED_CODONS não definido em utils.js");
                return;
            }
            let csv = "Gene," + ORDERED_CODONS.join(",") + "\n";
            matrixData.forEach(row => {
                const counts = ORDERED_CODONS.map(c => row.counts[c] || 0);
                csv += `${row.name},${counts.join(",")}\n`;
            });
            downloadCSV(csv, "matriz_contagem_codons.csv");
        };

        container.appendChild(btnTai);
        container.appendChild(btnMatrix);
    }

    /**
     * Download de arquivo CSV
     */
    function downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Atualiza lista de genomas no dropdown
     */
    function updateGenomeList() {
        if (!genomeSelect) return;
        
        // Mantém as duas primeiras opções
        while (genomeSelect.options.length > 2) {
            genomeSelect.remove(2);
        }
        
        Object.keys(speciesData).forEach(species => {
            const data = speciesData[species];
            if (data.type === 'uploaded' || data.type === 'ncbi') {
                const option = document.createElement('option');
                option.value = species;
                
                const hasTrna = data.trnaCounts && Object.keys(data.trnaCounts).length > 0;
                let statusSymbol = hasTrna ? ' ✓tRNA' : '';
                
                option.textContent = `${species}${statusSymbol}`;
                if (hasTrna) option.style.color = '#27ae60';
                
                genomeSelect.appendChild(option);
            }
        });
    }
    
    /**
     * Exportar tRNA para CSV
     */
    function exportTrnaToCSV(counts, speciesName) {
        let csv = "Anticodon,Copias\n";
        Object.keys(counts).sort().forEach(ac => csv += `${ac},${counts[ac]}\n`);
        downloadCSV(csv, `tRNAs_${speciesName}.csv`);
    }

    // Inicialização
    updateGenomeList();
});

function addTaiExportButtons() {
    const container = document.querySelector('.loaded-genomes-display') || 
                      document.getElementById('tai-status')?.parentNode;

    if (!container) return;

    // Botão para o Histograma tAI
    const btnTaiChart = document.createElement('button');
    btnTaiChart.innerHTML = '<i class="fas fa-image"></i> Baixar Gráfico de Distribuição (PNG)';
    btnTaiChart.className = 'export-btn'; // Use suas classes de estilo existentes
    btnTaiChart.style.cssText = 'margin-top: 10px; width: 100%; background: #34495e; color: white; padding: 10px; border-radius: 4px; cursor: pointer;';
    
    btnTaiChart.onclick = () => {
        // O ID do canvas está definido em charts.js como 'tai-distribution-chart'
        downloadChartImage('tai-distribution-chart', 'distribuicao_tai.png');
    };

    // Botão para a Matriz Multi-espécies (se estiver visível)
    const btnMatrixChart = document.createElement('button');
    btnMatrixChart.innerHTML = '<i class="fas fa-image"></i> Baixar Matriz de Bolhas (PNG)';
    btnMatrixChart.className = 'export-btn';
    btnMatrixChart.style.cssText = 'margin-top: 10px; width: 100%; background: #34495e; color: white; padding: 10px; border-radius: 4px; cursor: pointer;';
    
    btnMatrixChart.onclick = () => {
        downloadChartImage('multi-species-matrix-chart', 'matriz_tRNAs.png');
    };

    container.appendChild(btnTaiChart);
    container.appendChild(btnMatrixChart);
}