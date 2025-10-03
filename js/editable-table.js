// editable-table.js
const EditableTableManager = {
    init() {
        this.setupEventListeners();
    },
    
    setupEventListeners() {
        // Event listener para atualizações de dados
        window.addEventListener('dataUpdated', (e) => {
            this.updateComparisonTable();
            ChartManager.updateChartsWithFilteredData(speciesData);
        });
    },
    
    updateComparisonTable() {
        const table = document.getElementById('comparison-table');
        if (!table) return;
        
        const tbody = table.querySelector('tbody');
        const allSpecies = Object.keys(speciesData);
        
        // Atualizar cabeçalho
        this.updateTableHeader(table, allSpecies);
        
        // Atualizar linhas de dados
        this.updateTableRows(tbody, allSpecies);
    },
    
    updateTableHeader(table, speciesList) {
        const thead = table.querySelector('thead tr');
        // Manter a primeira coluna (Característica)
        const firstCell = thead.cells[0];
        thead.innerHTML = '';
        thead.appendChild(firstCell);
        
        // Adicionar colunas para cada espécie
        speciesList.forEach(species => {
            const th = document.createElement('th');
            const isUploaded = speciesData[species].type === 'uploaded';
            
            th.innerHTML = this.formatSpeciesHeader(species, speciesData[species], isUploaded);
            thead.appendChild(th);
        });
    },
    
    formatSpeciesHeader(species, data, isUploaded) {
        if (isUploaded) {
            return `${species}<br>
                    <span class="citation uploaded-citation">
                    Carregado<br>
                    <span class="citation-tooltip">Genoma carregado pelo usuário</span>
                    </span>
                    <button class="edit-species-btn" data-species="${species}">✏️</button>`;
        }
        
        // Headers originais para espécies padrão
        const citations = {
            'P. capitalensis': 'CBS 128856<span class="citation-tooltip">Isolado no Brasil<br>Patógeno de citrus</span>',
            'P. citriasiana': 'CBS 120486<span class="citation-tooltip">Isolado na Tailândia<br>Patógeno de citrus</span>',
            'P. citribraziliensis': 'CBS 100098<span class="citation-tooltip">Isolado no Brasil<br>Endófito de citrus</span>',
            'P. citricarpa': 'CBS 127454<span class="citation-tooltip">Isolado na Austrália<br>Patógeno de citrus</span>',
            'P. citrichinaensis': 'CBS 130529<span class="citation-tooltip">Isolado na China<br>Patógeno de citrus</span>',
            'P. paracitricarpa': 'CBS 141357<span class="citation-tooltip">Isolado na Grécia<br>Patógeno de citrus</span>'
        };
        
        return `${species}<br><span class="citation">${citations[species] || 'Dados padrão'}</span>`;
    },
    
    updateTableRows(tbody, speciesList) {
        const rowDefinitions = [
            { key: 'genes', label: 'Genes Previstos', formatter: v => v.toLocaleString() },
            { key: 'secretedProteins', label: 'Proteínas Secretadas', formatter: v => v.toLocaleString() },
            { key: 'effectors', label: 'Efetores', formatter: v => v.toLocaleString() },
            { key: 'bgcs', label: 'BGCs', formatter: v => v.toLocaleString() },
            { key: 'cazymes', label: 'CAZymes', formatter: v => v.toLocaleString() },
            { key: 'lipases', label: 'Lipases', formatter: v => v.toLocaleString() },
            { key: 'proteases', label: 'Proteases', formatter: v => v.toLocaleString() },
            { key: 'genomeSize', label: 'Tamanho do Genoma (Mb)', formatter: v => v.toFixed(2) },
            { key: 'contigs', label: 'Nº de Contigs', formatter: v => v.toLocaleString() },
            { key: 'gcContent', label: 'Conteúdo GC (%)', formatter: v => v.toFixed(2) + '%' },
            { key: 'repetitiveContent', label: 'Conteúdo Repetitivo (%)', formatter: v => v.toFixed(2) + '%' },
            { key: 'ripAffected', label: '% de TEs Afetados por RIP', formatter: v => v.toFixed(2) + '%' }
        ];
        
        tbody.innerHTML = '';
        
        rowDefinitions.forEach(rowDef => {
            const row = document.createElement('tr');
            const labelCell = document.createElement('td');
            labelCell.innerHTML = `<strong>${rowDef.label}</strong>`;
            row.appendChild(labelCell);
            
            speciesList.forEach(species => {
                const dataCell = document.createElement('td');
                const value = speciesData[species][rowDef.key][0];
                const isUploaded = speciesData[species].type === 'uploaded';
                
                if (isUploaded) {
                    dataCell.className = 'editable-cell';
                    dataCell.innerHTML = `
                        <span class="cell-value">${rowDef.formatter(value)}</span>
                        <button class="edit-cell-btn" 
                                data-species="${species}" 
                                data-key="${rowDef.key}"
                                data-value="${value}">✏️</button>
                    `;
                } else {
                    dataCell.textContent = rowDef.formatter(value);
                }
                
                row.appendChild(dataCell);
            });
            
            tbody.appendChild(row);
        });
        
        this.setupEditListeners();
    },
    
    setupEditListeners() {
        // Botões de edição de célula
        document.querySelectorAll('.edit-cell-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const species = btn.dataset.species;
                const key = btn.dataset.key;
                const currentValue = parseFloat(btn.dataset.value);
                this.showEditModal(species, key, currentValue);
            });
        });
        
        // Botões de edição de espécie
        document.querySelectorAll('.edit-species-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const species = btn.dataset.species;
                this.showSpeciesEditModal(species);
            });
        });
    },
    
    showEditModal(species, key, currentValue) {
        const modal = this.createModal(`
            <h3>Editar Valor</h3>
            <p><strong>Espécie:</strong> ${species}</p>
            <p><strong>Característica:</strong> ${this.getCharacteristicName(key)}</p>
            <div class="input-group">
                <label>Novo valor:</label>
                <input type="number" id="edit-value" value="${currentValue}" step="0.01" min="0">
            </div>
            <div class="modal-buttons">
                <button class="btn-save">Salvar</button>
                <button class="btn-cancel">Cancelar</button>
            </div>
        `);
        
        modal.querySelector('.btn-save').addEventListener('click', () => {
            const newValue = parseFloat(modal.querySelector('#edit-value').value);
            this.updateCellValue(species, key, newValue);
            this.closeModal(modal);
        });
        
        modal.querySelector('.btn-cancel').addEventListener('click', () => {
            this.closeModal(modal);
        });
    },
    
    showSpeciesEditModal(species) {
        const data = speciesData[species];
        const modal = this.createModal(`
            <h3>Editar Espécie: ${species}</h3>
            <div class="species-edit-form">
                ${this.generateEditFormFields(data)}
            </div>
            <div class="modal-buttons">
                <button class="btn-save">Salvar Todas as Alterações</button>
                <button class="btn-cancel">Cancelar</button>
            </div>
        `);
        
        modal.querySelector('.btn-save').addEventListener('click', () => {
            this.saveSpeciesEdits(species, modal);
            this.closeModal(modal);
        });
        
        modal.querySelector('.btn-cancel').addEventListener('click', () => {
            this.closeModal(modal);
        });
    },
    
    generateEditFormFields(data) {
        const fields = [
            { key: 'genes', label: 'Genes Previstos', type: 'number' },
            { key: 'secretedProteins', label: 'Proteínas Secretadas', type: 'number' },
            { key: 'effectors', label: 'Efetores', type: 'number' },
            { key: 'bgcs', label: 'BGCs', type: 'number' },
            { key: 'cazymes', label: 'CAZymes', type: 'number' },
            { key: 'lipases', label: 'Lipases', type: 'number' },
            { key: 'proteases', label: 'Proteases', type: 'number' },
            { key: 'genomeSize', label: 'Tamanho do Genoma (Mb)', type: 'number', step: '0.01' },
            { key: 'contigs', label: 'Nº de Contigs', type: 'number' },
            { key: 'gcContent', label: 'Conteúdo GC (%)', type: 'number', step: '0.01' },
            { key: 'repetitiveContent', label: 'Conteúdo Repetitivo (%)', type: 'number', step: '0.01' },
            { key: 'ripAffected', label: '% de TEs Afetados por RIP', type: 'number', step: '0.01' }
        ];
        
        return fields.map(field => {
            const value = data[field.key][0];
            const step = field.step || '1';
            return `
                <div class="input-group">
                    <label>${field.label}:</label>
                    <input type="${field.type}" 
                           data-key="${field.key}"
                           value="${value}" 
                           step="${step}"
                           min="0">
                </div>
            `;
        }).join('');
    },
    
    saveSpeciesEdits(species, modal) {
        const inputs = modal.querySelectorAll('input[data-key]');
        const updates = {};
        
        inputs.forEach(input => {
            const key = input.dataset.key;
            const value = parseFloat(input.value);
            updates[key] = [value];
        });
        
        updateGenomeData(species, updates);
    },
    
    updateCellValue(species, key, newValue) {
        const updates = { [key]: [newValue] };
        updateGenomeData(species, updates);
    },
    
    getCharacteristicName(key) {
        const names = {
            'genes': 'Genes Previstos',
            'secretedProteins': 'Proteínas Secretadas',
            'effectors': 'Efetores',
            'bgcs': 'BGCs',
            'cazymes': 'CAZymes',
            'lipases': 'Lipases',
            'proteases': 'Proteases',
            'genomeSize': 'Tamanho do Genoma',
            'contigs': 'Número de Contigs',
            'gcContent': 'Conteúdo GC',
            'repetitiveContent': 'Conteúdo Repetitivo',
            'ripAffected': '% de TEs Afetados por RIP'
        };
        return names[key] || key;
    },
    
    createModal(content) {
        const modal = document.createElement('div');
        modal.className = 'edit-modal';
        modal.innerHTML = `
            <div class="modal-content">
                ${content}
            </div>
        `;
        
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        modal.querySelector('.modal-content').style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 12px;
            max-width: 500px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
        `;
        
        document.body.appendChild(modal);
        return modal;
    },
    
    closeModal(modal) {
        document.body.removeChild(modal);
    }
};