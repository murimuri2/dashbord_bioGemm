// Gerenciamento de upload de genomas
const UploadManager = {
    init() {
        this.setupEventListeners();
    },
    
    setupEventListeners() {
        document.getElementById('genomes-folder-upload').addEventListener('change', (e) => this.handleFolderSelect(e));
        document.getElementById('load-genomes').addEventListener('click', () => this.loadGenomes());
        document.getElementById('clear-genomes').addEventListener('click', () => this.clearGenomes());
    },
    
    handleFolderSelect(event) {
        const files = event.target.files;
        const status = document.getElementById('folder-status');
        
        if (files.length > 0) {
            status.innerHTML = `<i class="fas fa-check-circle"></i> ${files.length} arquivos selecionados`;
            status.style.color = '#27ae60';
        } else {
            status.innerHTML = '<i class="fas fa-info-circle"></i> Nenhuma pasta selecionada';
            status.style.color = '#7f8c8d';
        }
    },
    
    async loadGenomes() {
        const folderInput = document.getElementById('genomes-folder-upload');
        const files = folderInput.files;
        
        if (files.length === 0) {
            alert('Por favor, selecione uma pasta com arquivos FASTA.');
            return;
        }
        
        const progressContainer = this.createProgressContainer();
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.name.match(/\.(fasta|fa|fna|ffn)$/i)) { // Adicionei ffn para suportar genes
                await this.processFile(file, i, files.length, progressContainer);
            }
        }
        
        this.updateLoadedGenomesTable();
        
        // Se o FilterManager existir, atualiza os filtros
        if (typeof FilterManager !== 'undefined') {
            FilterManager.applyFilters();
        }
        
        // Remover container de progresso
        setTimeout(() => {
            if (progressContainer.parentNode) {
                progressContainer.parentNode.removeChild(progressContainer);
            }
        }, 2000);
    },
    
    createProgressContainer() {
        const container = document.createElement('div');
        container.className = 'analysis-progress';
        container.innerHTML = `
            <h4>📊 Analisando arquivos...</h4>
            <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
            </div>
            <div class="progress-text">0/${document.getElementById('genomes-folder-upload').files.length}</div>
        `;
        document.getElementById('folder-status').after(container);
        return container;
    },
    
    async processFile(file, index, total, progressContainer) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const content = e.target.result;
                
                if (Utils.isValidFasta(content)) {
                    const analysis = Utils.analyzeFasta(content, file.name);
                    
                    // --- ATUALIZAÇÃO IMPORTANTE ---
                    // Agora passamos o 'content' (o texto da sequência) para ser salvo
                    this.addUploadedGenome(analysis, content);
                }
                
                // Atualizar progresso
                const progress = ((index + 1) / total) * 100;
                if (progressContainer.querySelector('.progress-fill')) {
                    progressContainer.querySelector('.progress-fill').style.width = `${progress}%`;
                }
                if (progressContainer.querySelector('.progress-text')) {
                    progressContainer.querySelector('.progress-text').textContent = 
                        `${index + 1}/${total} - ${file.name}`;
                }
                
                resolve();
            };
            
            reader.readAsText(file);
        });
    },

    // Recebe o sequenceContent como segundo argumento
    addUploadedGenome(analysis, sequenceContent) {
        const speciesName = `Uploaded: ${analysis.name}`;
        
        uploadedGenomes[speciesName] = {
            ...analysis,
            genomeSize: [analysis.size / 1000000], // Converter para Mb
            gcContent: [parseFloat(analysis.gcContent)],
            genes: [analysis.genes],
            
            // Dados simulados para preencher os gráficos (já que o FASTA não tem tudo)
            secretedProteins: [Math.floor(analysis.genes * 0.08)],
            effectors: [Math.floor(analysis.genes * 0.02)],
            bgcs: [Math.floor(Math.random() * 5) + 20],
            cazymes: [Math.floor(analysis.genes * 0.03)],
            lipases: [Math.floor(analysis.genes * 0.015)],
            proteases: [Math.floor(analysis.genes * 0.03)],
            repetitiveContent: [Math.random() * 5],
            ripAffected: [Math.random() * 10 + 85],
            contigs: [analysis.contigs],
            strains: 1,
            origins: ['Uploaded'],
            lifestyle: { 'Patógeno': 1, 'Endófito': 0 },
            lifestyles: ['Patógeno'],
            type: 'uploaded',
            editable: true,
            
            // --- O DADO QUE A ABA tAI PRECISA ---
            // Salva a sequência crua na memória para ser usada na análise de tAI
            sequenceContent: sequenceContent 
        };
        
        // Adicionar aos dados principais
        speciesData[speciesName] = uploadedGenomes[speciesName];
        
        // Atualizar filtro de espécies
        this.updateSpeciesFilter();
        
        // Atualizar todas as visualizações
        this.updateAllVisualizations();
    },

    updateAllVisualizations() {
        // Atualizar gráficos se o ChartManager existir
        if (typeof ChartManager !== 'undefined') {
            ChartManager.updateChartsWithFilteredData(speciesData);
        }
        
        // Atualizar cartões de resumo
        if (typeof SummaryManager !== 'undefined') {
            SummaryManager.updateSummaryCards(speciesData);
        }
        
        // Atualizar tabela de comparação
        if (typeof EditableTableManager !== 'undefined') {
            EditableTableManager.updateComparisonTable();    
        }
        
        // Atualizar tabela de genomas carregados
        this.updateLoadedGenomesTable();
    },

    updateSpeciesFilter() {
        const speciesFilter = document.getElementById('species-filter');
        if (!speciesFilter) return;
        
        // Limpar apenas opções uploaded
        const optionsToRemove = [];
        for (let i = 0; i < speciesFilter.options.length; i++) {
            if (speciesFilter.options[i].value.startsWith('Uploaded:')) {
                optionsToRemove.push(i);
            }
        }
        
        // Remover em ordem reversa para evitar problemas de índice
        optionsToRemove.reverse().forEach(index => {
            speciesFilter.remove(index);
        });
        
        // Adicionar novas opções uploaded
        Object.keys(uploadedGenomes).forEach(species => {
            const option = document.createElement('option');
            option.value = species;
            option.textContent = species;
            option.style.fontStyle = 'italic';
            speciesFilter.appendChild(option);
        });
    },
    
    updateLoadedGenomesTable() {
        const container = document.getElementById('loaded-genomes-table');
        if (!container) return;
        
        if (Object.keys(uploadedGenomes).length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <p>Nenhum genoma carregado</p>
                    <small>Carregue uma pasta com arquivos FASTA para ver os dados aqui</small>
                </div>
            `;
            return;
        }
        
        const tableHTML = `
            <table class="loaded-genome-table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Tamanho (Mb)</th>
                        <th>GC (%)</th>
                        <th>Genes</th>
                        <th>Contigs</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(uploadedGenomes).map(([name, data]) => `
                        <tr>
                            <td>${name}</td>
                            <td>${(data.size / 1000000).toFixed(2)}</td>
                            <td>${parseFloat(data.gcContent).toFixed(2)}%</td>
                            <td>${Utils.formatNumber(data.genes)}</td>
                            <td>${data.contigs}</td>
                            <td>
                                <button class="edit-species-btn" data-species="${name}">
                                    ✏️ Editar
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = tableHTML;
        
        // Adicionar event listeners para os botões de edição
        container.querySelectorAll('.edit-species-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const species = btn.dataset.species;
                if (typeof EditableTableManager !== 'undefined') {
                    EditableTableManager.showSpeciesEditModal(species);
                }
            });
        });
    },

    clearGenomes() {
        // Remover genomas uploaded dos dados principais
        Object.keys(uploadedGenomes).forEach(species => {
            delete speciesData[species];
        });
        
        // Limpar objeto uploadedGenomes
        Object.keys(uploadedGenomes).forEach(key => {
            delete uploadedGenomes[key];
        });
        
        // Atualizar visualizações
        this.updateAllVisualizations();
        
        // Resetar filtro de espécies
        this.updateSpeciesFilter();
        
        // Limpar input de arquivo
        document.getElementById('genomes-folder-upload').value = '';
        const folderStatus = document.getElementById('folder-status');
        if (folderStatus) {
            folderStatus.innerHTML = '<i class="fas fa-info-circle"></i> Nenhuma pasta selecionada';
            folderStatus.style.color = '#7f8c8d';
        }
    }
};