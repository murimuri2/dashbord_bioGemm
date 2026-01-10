/**
 * ARQUIVO: js/modules/TaiMath.js
 * Responsabilidade: Lógica matemática pura e parsing de sequências.
 * Sem dependências de DOM.
 */
const TaiMath = {
    // Tabela de Códons padrão (Fallback caso CODON_TABLE global falhe)
    get codonTable() {
        if (typeof CODON_TABLE !== 'undefined') return CODON_TABLE;
        return null; // Deve ser tratado pelo chamador
    },

    parseFasta(txt) {
        if (!txt) return [];
        const genes = [];
        let current = { name: "", seq: "" };

        txt.split('\n').forEach(line => {
            line = line.trim();
            if (!line) return;
            if (line.startsWith('>')) {
                if (current.name) genes.push(current);
                current = { name: line.substring(1).split(' ')[0], seq: "" };
            } else {
                current.seq += line.toUpperCase().replace(/[^ATCGN]/g, '');
            }
        });
        if (current.name) genes.push(current);
        return genes.filter(x => x.seq.length % 3 === 0 && x.seq.length > 0);
    },

    calculateWeights(trnaCounts) {
        const table = this.codonTable;
        if (!table) throw new Error("Tabela de Códons não definida.");

        const W = {};
        // Inicializa pesos básicos
        for (let c in table) {
            W[c] = ['STOP', 'Met', 'Trp'].includes(table[c]) ? 1 : 0;
        }

        const mapBase = { 'A': 'T', 'T': 'A', 'C': 'G', 'G': 'C' };

        Object.keys(trnaCounts).forEach(anticodon => {
            const copyCount = trnaCounts[anticodon];
            if (copyCount <= 0) return;

            const base1 = anticodon[0];
            const c2 = mapBase[anticodon[1]];
            const c1 = mapBase[anticodon[2]];
            
            let recognizedBases = [];
            // Regras de pareamento Wobble simplificadas
            if (base1 === 'G') recognizedBases = ['C', 'T'];
            else if (base1 === 'C') recognizedBases = ['G'];
            else if (base1 === 'A') recognizedBases = ['T'];
            else if (base1 === 'T') recognizedBases = ['A', 'G'];
            else if (base1 === 'I') recognizedBases = ['A', 'C', 'T'];
            else if (mapBase[base1]) recognizedBases = [mapBase[base1]];

            recognizedBases.forEach(b3 => {
                const codon = c1 + c2 + b3;
                if (W[codon] !== undefined) W[codon] += copyCount;
            });
        });

        // Normalização
        const maxW = {};
        for (let c in W) {
            const aa = table[c];
            if (!maxW[aa] || W[c] > maxW[aa]) maxW[aa] = W[c];
        }

        const norm = {};
        for (let c in W) {
            const isSingle = ['STOP', 'Met', 'Trp'].includes(table[c]);
            const max = maxW[table[c]];
            norm[c] = isSingle ? 1 : (max > 0 ? W[c] / max : 0.0001);
            if (norm[c] === 0) norm[c] = 0.0001;
        }
        return norm;
    },

    calculateGeneTAI(seq, weights) {
        if (seq.length % 3 !== 0 || seq.length < 15) return null;
        
        // Remove stop codon se presente
        let s = seq;
        if (['TAA', 'TAG', 'TGA'].includes(s.slice(-3))) s = s.slice(0, -3);

        let logSum = 0;
        let n = 0;

        for (let i = 0; i < s.length; i += 3) {
            const codon = s.substring(i, i + 3);
            if (weights[codon] !== undefined) {
                logSum += Math.log(weights[codon]);
                n++;
            }
        }
        return n === 0 ? 0 : Math.exp(logSum / n);
    }
};

/**
 * ARQUIVO: js/modules/ComparisonUI.js
 * Responsabilidade: Manipulação do DOM, injeção de HTML e Estilização.
 */
const ComparisonUI = {
    // Elementos DOM cacheados (lazy load)
    els: {},

    injectDashboardControl() {
        const uploadCard = document.querySelector('.upload-card');
        if (!uploadCard || document.getElementById('btn-compare-all')) return;

        const html = `
            <hr class="ui-separator">
            <h3 class="ui-title"><i class="fas fa-layer-group"></i> Matriz Comparativa & Análise tAI</h3>
            <p class="ui-desc">
                Processa todos os genomas listados: gera a matriz de tRNAs e calcula a eficiência (tAI) média.<br>
                <small class="text-muted">ℹ️ Utiliza os dados já carregados no sistema.</small>
            </p>
            <div id="multi-status" class="ui-status box-hidden"></div>
            <button id="btn-compare-all" class="ui-btn-primary">
                <i class="fas fa-calculator"></i> Calcular e Gerar Matriz
            </button>
        `;
        
        // Dica: Mova esses estilos para um arquivo CSS real usando as classes acima
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = html;
        while (tempContainer.firstChild) {
            uploadCard.appendChild(tempContainer.firstChild);
        }
        
        // Adiciona estilos inline apenas para manter compatibilidade com o código original
        this._applyStyles(); 
    },

    _applyStyles() {
        // Helper para injetar CSS dinâmico se não houver arquivo .css
        const style = document.createElement('style');
        style.textContent = `
            .ui-separator { margin: 30px 0; border: 0; border-top: 2px solid #e2e8f0; }
            .ui-title { margin-top: 10px; color: #8e44ad; font-size: 1.3rem; display: flex; align-items: center; gap: 10px; }
            .ui-desc { margin: 12px 0; line-height: 1.6; }
            .ui-status { margin-top: 12px; font-weight: 500; padding: 10px; border-radius: 6px; text-align: center; }
            .box-hidden { display: none; }
            .ui-btn-primary { background: linear-gradient(135deg, #8e44ad, #9b59b6); width: 100%; margin-top: 10px; font-size: 1rem; padding: 14px; color: white; border: none; cursor: pointer; border-radius: 8px; }
            .ui-btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
            .highlight { background-color: #fff3cd !important; transition: background 0.3s; }
        `;
        document.head.appendChild(style);
    },

    updateStatus(message, type = 'loading') {
        const el = document.getElementById('multi-status');
        if (!el) return;
        
        el.style.display = 'block';
        el.innerHTML = message;
        
        const types = {
            loading: { bg: '#e8f5e9', color: '#2d3436' },
            success: { bg: '#d4edda', color: '#155724' },
            error:   { bg: '#f8d7da', color: '#721c24' }
        };
        const style = types[type] || types.loading;
        el.style.background = style.bg;
        el.style.color = style.color;
    },

    renderStatsTable(stats) {
        const container = document.querySelector('.loaded-genomes-display');
        const oldTable = document.getElementById('tai-stats-table');
        if (oldTable) oldTable.remove();
        if (stats.length === 0) return;

        const table = document.createElement('table');
        table.id = 'tai-stats-table';
        table.className = 'ui-table-stats'; // Usar CSS para estilizar isso
        table.style.cssText = 'width: 100%; border-collapse: collapse; margin-top: 20px; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.05);';

        const rows = stats.map(s => `
            <tr style="border-bottom:1px solid #eee;">
                <td style="padding:10px;">${s.species}</td>
                <td style="text-align:center;font-weight:bold;">${s.meanTai || '-'}</td>
                <td style="text-align:center;">${s.totalGenes || '-'}</td>
            </tr>
        `).join('');

        table.innerHTML = `
            <thead style="background:#34495e;color:white;">
                <tr><th style="padding:10px;">Espécie</th><th style="text-align:center;">Média tAI</th><th style="text-align:center;">Genes</th></tr>
            </thead>
            <tbody>${rows}</tbody>
        `;

        const lastBtn = document.querySelector('.dynamic-matrix-btn');
        container.insertBefore(table, lastBtn || null);
        if (!lastBtn) container.appendChild(table);
    },

    renderDownloadButton(callback) {
        document.querySelectorAll('.dynamic-matrix-btn').forEach(b => b.remove());
        const container = document.querySelector('.loaded-genomes-display');
        
        const btn = document.createElement('button');
        btn.className = 'dynamic-matrix-btn';
        btn.innerHTML = '<i class="fas fa-file-csv"></i> Baixar Relatório Completo (.csv)';
        btn.style.cssText = 'margin-top: 15px; width: 100%; background: #27ae60; padding: 12px; color: white; border: none; border-radius: 4px; cursor: pointer;';
        btn.onclick = callback;
        
        container.appendChild(btn);
    },

    updateDashboardCards(avgTai, totalGenes) {
        // Lógica de fallback para encontrar os elementos
        const elMean = document.getElementById('tai-mean-value') || 
                       document.querySelector('.tai-value-display h2');
        const elGenes = document.getElementById('tai-total-genes') || 
                        document.querySelector('.genes-count-display h2');
        
        // Fallback genérico para elementos contendo "-"
        const dashes = Array.from(document.querySelectorAll('h2')).filter(el => el.textContent.trim() === '-');

        const targetMean = elMean || dashes[0];
        const targetGenes = elGenes || dashes[1];

        if (targetMean) targetMean.textContent = avgTai.toFixed(4);
        if (targetGenes) targetGenes.textContent = totalGenes.toLocaleString();
    },

    // Funcionalidade de Destaque da Tabela (do primeiro snippet)
    highlightTableColumns(species1, species2) {
        const table = document.getElementById('comparison-table');
        if (!table) return;

        const headers = table.querySelectorAll('th');
        const rows = table.querySelectorAll('tbody tr');
        
        // Limpar
        const clear = (els) => els.forEach(el => el.classList.remove('highlight'));
        clear(headers);
        rows.forEach(r => clear(r.querySelectorAll('td')));

        // Aplicar Highlight
        headers.forEach((header, index) => {
            if (header.textContent.includes(species1) || header.textContent.includes(species2)) {
                header.classList.add('highlight');
                rows.forEach(row => {
                    if (row.children[index]) row.children[index].classList.add('highlight');
                });
            }
        });
    }
};

/**
 * ARQUIVO: js/modules/ComparisonManager.js
 * Responsabilidade: Controlador Principal. Orquestra UI e Dados.
 */
const ComparisonManager = {
    init() {
        // Injeta a UI na inicialização
        ComparisonUI.injectDashboardControl();
        this.bindEvents();
    },

    bindEvents() {
        // Botão principal de cálculo em massa
        const btnAll = document.getElementById('btn-compare-all');
        if (btnAll) btnAll.addEventListener('click', () => this.runMultiSpeciesAnalysis());

        // Botões de comparação manual (se existirem na página)
        const btnCompare = document.getElementById('compare-button');
        if (btnCompare) btnCompare.addEventListener('click', () => this.handleManualComparison());

        const btnReset = document.getElementById('compare-reset');
        if (btnReset) btnReset.addEventListener('click', () => ComparisonUI.highlightTableColumns(null, null)); // Limpa passando null
    },

    // ==========================================================
    // LÓGICA DE COMPARAÇÃO MANUAL (Snippet 1 refatorado)
    // ==========================================================
    handleManualComparison() {
        const s1 = document.getElementById('compare-1')?.value;
        const s2 = document.getElementById('compare-2')?.value;

        if (!s1 || !s2 || s1 === s2) {
            alert('Por favor, selecione espécies diferentes para comparação.');
            return;
        }

        ComparisonUI.highlightTableColumns(s1, s2);
        console.log(`Comparando ${s1} com ${s2} - Gráfico detalhado pendente.`);
        // Aqui chamaria this.renderDetailedChart(s1, s2);
    },

    // ==========================================================
    // LÓGICA DE ANÁLISE EM MASSA (Snippet 2 refatorado)
    // ==========================================================
    async runMultiSpeciesAnalysis() {
        const btn = document.getElementById('btn-compare-all');
        
        // 1. Validação
        const genomeKeys = Object.keys(speciesData).filter(k => 
            ['ncbi', 'uploaded'].includes(speciesData[k].type)
        );

        if (genomeKeys.length === 0) {
            alert("❌ Nenhum genoma carregado para análise!");
            return;
        }

        // 2. Setup UI
        if (btn) btn.disabled = true;
        ComparisonUI.updateStatus('<i class="fas fa-spinner fa-spin"></i> Processando matemática dos genomas...', 'loading');

        const comparisonData = [];
        const taiStats = [];
        const allAnticodons = new Set();

        try {
            for (const speciesName of genomeKeys) {
                const spec = speciesData[speciesName];
                
                // Passo A: Garantir tRNAs
                let trnaCounts = await this._ensureTrnaCounts(spec);
                if (!trnaCounts) {
                    taiStats.push({ species: speciesName, error: "Sem tRNAs" });
                    continue;
                }

                // Dados para gráfico de bolhas
                comparisonData.push({ 
                    species: speciesName, 
                    counts: trnaCounts, 
                    color: Utils.generateColor ? Utils.generateColor(speciesName) : '#3498db'
                });
                Object.keys(trnaCounts).forEach(k => allAnticodons.add(k));

                // Passo B: Garantir FASTA e Calcular tAI
                const fasta = await this._ensureFastaContent(spec);
                
                if (fasta) {
                    const stats = this._computeSpeciesTai(fasta, trnaCounts);
                    taiStats.push({ species: speciesName, ...stats });
                } else {
                    taiStats.push({ species: speciesName, error: "Sem sequência" });
                }
            }

            // 3. Renderização Final
            this._finalizeAnalysis(comparisonData, taiStats, allAnticodons);

        } catch (error) {
            console.error(error);
            ComparisonUI.updateStatus(`❌ Erro: ${error.message}`, 'error');
        } finally {
            if (btn) btn.disabled = false;
        }
    },

    // Helpers de Dados (Async)
    async _ensureTrnaCounts(spec) {
        let counts = spec.trnaCounts || {};
        if (Object.keys(counts).length === 0 && spec.type === 'ncbi' && spec.accession) {
            try {
                const res = await fetch(`http://localhost:5000/api/fetch-trna?accession=${spec.accession}`);
                const data = await res.json();
                if (!data.error && data.counts) {
                    data.counts.forEach(c => counts[c.Anticodon] = c.Copias);
                    spec.trnaCounts = counts; // Cache
                }
            } catch (e) { console.warn(`Erro fetch tRNA`, e); }
        }
        return Object.keys(counts).length > 0 ? counts : null;
    },

    async _ensureFastaContent(spec) {
        if (spec.sequenceContent) return spec.sequenceContent;
        if (spec.type === 'ncbi' && spec.accession) {
            ComparisonUI.updateStatus(`<i class="fas fa-download"></i> Baixando sequência: ${spec.name}...`, 'loading');
            try {
                const res = await fetch(`http://localhost:5000/api/fetch-sequence?accession=${spec.accession}`);
                const data = await res.json();
                if (!data.error && data.fasta) {
                    spec.sequenceContent = data.fasta; // Cache
                    return data.fasta;
                }
            } catch (e) { console.warn(`Erro fetch FASTA`, e); }
        }
        return null;
    },

    // Helper de Cálculo (Sincrono)
    _computeSpeciesTai(fasta, trnaCounts) {
        const genes = TaiMath.parseFasta(fasta);
        if (genes.length === 0) return { meanTai: 0, totalGenes: 0, error: "FASTA vazio ou inválido" };

        const weights = TaiMath.calculateWeights(trnaCounts);
        let totalTai = 0;
        let validGenes = 0;

        genes.forEach(g => {
            const val = TaiMath.calculateGeneTAI(g.seq, weights);
            if (val !== null) {
                totalTai += val;
                validGenes++;
            }
        });

        return {
            meanTai: validGenes > 0 ? parseFloat((totalTai / validGenes).toFixed(4)) : 0,
            totalGenes: validGenes
        };
    },

    _finalizeAnalysis(comparisonData, taiStats, allAnticodonsSet) {
        const canonicalAnticodons = Array.from(allAnticodonsSet).sort();
        const validStats = taiStats.filter(s => !s.error);

        // Renderizar Gráficos Externos (assume função global existente)
        if (typeof renderMultiSpeciesChartGrouped === 'function' && comparisonData.length > 0) {
            renderMultiSpeciesChartGrouped(comparisonData, canonicalAnticodons, comparisonData.map(d => d.species));
        }

        // UI Updates
        ComparisonUI.renderStatsTable(taiStats);
        
        // Dashboard Cards
        if (validStats.length > 0) {
            const avgGlobal = validStats.reduce((acc, curr) => acc + curr.meanTai, 0) / validStats.length;
            const totalGenes = validStats.reduce((acc, curr) => acc + curr.totalGenes, 0);
            ComparisonUI.updateDashboardCards(avgGlobal, totalGenes);
        }

        // Botão Download
        ComparisonUI.renderDownloadButton(() => this._generateCSV(comparisonData, taiStats, canonicalAnticodons));

        ComparisonUI.updateStatus(`<i class="fas fa-check-circle"></i> Sucesso! ${taiStats.length} genomas analisados.`, 'success');
    },

    _generateCSV(data, stats, headers) {
        let csv = "Especie,Media_tAI,Total_Genes," + headers.join(",") + "\n";
        const statsMap = {};
        stats.forEach(s => statsMap[s.species] = s);

        data.forEach(item => {
            const s = statsMap[item.species] || { meanTai: 0, totalGenes: 0 };
            const row = headers.map(ac => item.counts[ac] || 0);
            csv += `"${item.species}",${s.meanTai},${s.totalGenes},${row.join(",")}\n`;
        });

        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = 'Analise_Comparativa_tAI.csv';
        a.click();
    }
};

// Inicializador Global
document.addEventListener('DOMContentLoaded', () => {
    ComparisonManager.init();
});