
// Gerenciamento de filtros
const FilterManager = {
    currentFilters: {
        species: ['all'],
        lifestyle: 'all',
        origin: 'all',
        minGenes: 9000
    },
    
    init() {
        this.setupEventListeners();
        this.updateOriginFilterOptions();
    },
    
    setupEventListeners() {
        document.getElementById('apply-filters').addEventListener('click', () => this.applyFilters());
        document.getElementById('reset-filters').addEventListener('click', () => this.resetFilters());
        
        // Event listeners para filtros automáticos
        document.getElementById('lifestyle-filter').addEventListener('change', (e) => {
            this.currentFilters.lifestyle = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('origin-filter').addEventListener('change', (e) => {
            this.currentFilters.origin = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('gene-filter').addEventListener('input', (e) => {
            this.currentFilters.minGenes = parseInt(e.target.value);
            document.getElementById('gene-value').textContent = e.target.value;
            this.applyFilters();
        });
        
        // Configurar select múltiplo de espécies
        this.setupSpeciesFilter();
    },
    
    setupSpeciesFilter() {
        const speciesFilter = document.getElementById('species-filter');
        speciesFilter.addEventListener('change', (e) => {
            const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
            this.currentFilters.species = selected;
            this.applyFilters();
        });
    },
    
    updateOriginFilterOptions() {
        const originFilter = document.getElementById('origin-filter');
        
        // Coletar todas as origens únicas de todas as espécies
        const allOrigins = new Set();
        
        Object.values(speciesData).forEach(species => {
            if (species.origins && Array.isArray(species.origins)) {
                species.origins.forEach(origin => {
                    if (origin !== 'Uploaded') {
                        allOrigins.add(origin);
                    }
                });
            }
        });
        
        // Ordenar as origens
        const sortedOrigins = Array.from(allOrigins).sort();
        
        // Manter as opções existentes (all, Uploaded) e adicionar as origens
        const existingOptions = Array.from(originFilter.options).map(opt => opt.value);
        
        // Adicionar origens que ainda não existem
        sortedOrigins.forEach(origin => {
            if (!existingOptions.includes(origin)) {
                const option = document.createElement('option');
                option.value = origin;
                option.textContent = origin;
                originFilter.appendChild(option);
            }
        });
    },
    
    applyFilters() {
        const filteredData = this.filterData();
        ChartManager.updateChartsWithFilteredData(filteredData);
        SummaryManager.updateSummaryCards(filteredData);
        EditableTableManager.updateComparisonTable();
    },
    
    filterData() {
        const filtered = {};
        
        Object.keys(speciesData).forEach(species => {
            const data = speciesData[species];
            
            // Filtro de espécies
            if (!this.currentFilters.species.includes('all') && 
                !this.currentFilters.species.includes(species)) {
                return;
            }
            
            // Filtro de estilo de vida
            if (this.currentFilters.lifestyle !== 'all' && 
                !data.lifestyles.includes(this.currentFilters.lifestyle)) {
                return;
            }
            
            // Filtro de origem - corrigido para trabalhar com arrays
            if (this.currentFilters.origin !== 'all') {
                if (this.currentFilters.origin === 'Uploaded') {
                    // Filtro para genomas carregados
                    if (data.type !== 'uploaded') {
                        return;
                    }
                } else if (this.currentFilters.origin === 'Outros') {
                    // Filtro para outros países (não Brasil, China, Tailândia)
                    const mainCountries = ['Brasil', 'China', 'Tailândia'];
                    const hasMainCountry = data.origins.some(origin => 
                        mainCountries.includes(origin)
                    );
                    if (hasMainCountry) {
                        return;
                    }
                } else {
                    // Filtro para país específico
                    if (!data.origins.includes(this.currentFilters.origin)) {
                        return;
                    }
                }
            }
            
            // Filtro de genes mínimos
            const avgGenes = data.genes[0];
            if (avgGenes < this.currentFilters.minGenes) {
                return;
            }
            
            filtered[species] = data;
        });
        
        return filtered;
    },
    
    resetFilters() {
        document.getElementById('species-filter').selectedIndex = 0;
        document.getElementById('lifestyle-filter').value = 'all';
        document.getElementById('origin-filter').value = 'all';
        document.getElementById('gene-filter').value = 9000;
        document.getElementById('gene-value').textContent = '9000';
        
        this.currentFilters = {
            species: ['all'],
            lifestyle: 'all',
            origin: 'all',
            minGenes: 9000
        };
        
        this.applyFilters();
    }
};