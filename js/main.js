// Arquivo principal que inicializa tudo
class Dashboard {
    constructor() {
        this.init();
    }
    
    init() {
        // Inicializar os módulos que não dependem de abas
        FilterManager.init();
        UploadManager.init();
        ComparisonManager.init();
        SummaryManager.init();
        EditableTableManager.init();
        NCBISearchManager.init();
        
        // Renderizar APENAS os gráficos da primeira aba (que já está visível)
        ChartManager.renderGenomicsCharts();
        // Marcar a primeira aba como já inicializada para não recarregar os gráficos
        document.getElementById('genomics-tab').dataset.initialized = 'true';

        // Configurar a lógica de troca de abas
        this.setupTabs();
        
        // Adicionar funcionalidades extras
        this.addExtraFeatures();
    }
    
    setupTabs() {
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // 1. Remove a classe 'active' de todas as abas e conteúdos
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                // 2. Adiciona a classe 'active' à aba clicada e ao seu conteúdo
                tab.classList.add('active');
                const tabContent = document.getElementById(`${tab.dataset.tab}-tab`);
                if (tabContent) {
                    tabContent.classList.add('active');
                }

                // 3. Lógica para renderizar os gráficos APENAS na primeira vez que a aba é aberta
                const tabId = tab.dataset.tab;
                const isInitialized = tabContent.dataset.initialized === 'true';

                if (!isInitialized) {
                    switch (tabId) {
                        case 'proteomics':
                            ChartManager.renderProteomicsCharts();
                            break;
                        case 'structure':
                            ChartManager.renderStructureCharts();
                            break;
                        // As outras abas não possuem gráficos para inicializar
                    }
                    // Marca a aba como inicializada para não renderizar novamente
                    tabContent.dataset.initialized = 'true';
                }
            });
        });
    }
    
    addExtraFeatures() {
        // Adicionar botão de exportação
        this.addExportButton();
        
        // Adicionar animações de entrada
        this.addChartAnimations();
        
        // Configurar tooltips (se necessário)
        this.setupTooltips();
    }
    
    addExportButton() {
        const tableContainer = document.querySelector('.comparison-table');
        if (tableContainer && !tableContainer.querySelector('.export-btn')) {
            const tableHeader = tableContainer.querySelector('h3');
            const exportBtn = document.createElement('button');
            exportBtn.className = 'export-btn';
            exportBtn.innerHTML = '<i class="fas fa-download"></i> Exportar CSV';
            exportBtn.style.cssText = `
                float: right;
                font-size: 0.8rem;
                padding: 8px 12px;
                background: linear-gradient(135deg, #27ae60, #229954);
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
            `;
            exportBtn.onclick = this.exportTableData;
            
            // Adiciona o botão dentro do h3 para alinhamento
            if (tableHeader) {
                 tableHeader.appendChild(exportBtn);
            }
        }
    }
    
    exportTableData() {
        const table = document.getElementById('comparison-table');
        let csv = [];
        
        // Headers
        const headers = Array.from(table.querySelectorAll('th')).map(th => 
            `"${th.textContent.replace(/"/g, '""').replace(/\s+/g, ' ').trim()}"`
        );
        csv.push(headers.join(','));
        
        // Rows
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const cells = Array.from(row.querySelectorAll('td')).map(td => 
                `"${td.textContent.replace(/"/g, '""').trim()}"`
            );
            csv.push(cells.join(','));
        });
        
        // Download
        const csvContent = csv.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'phyllosticta_comparison.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    addChartAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target); // Para a animação não repetir
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.chart-box, .card, .comparison-table').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
            observer.observe(el);
        });
    }
    
    setupTooltips() {
        // Implementar tooltips customizados se necessário
    }
}

// Gerenciador de resumo
const SummaryManager = {
    init() {
        // Verifica se os dados existem antes de tentar usá-los
        if (typeof speciesData !== 'undefined') {
            this.updateSummaryCards(speciesData);
        }
    },
    
    updateSummaryCards(data) {
        const totalSpecies = Object.keys(data).length;
        const totalStrains = Object.values(data).reduce((sum, species) => sum + (species.strains || 0), 0);
        
        if (totalStrains === 0) return; // Evita divisão por zero

        let totalWeightedGenes = 0;
        let totalWeightedProteins = 0;
        
        for (const species in data) {
            totalWeightedGenes += (data[species].genes ? data[species].genes[0] : 0) * (data[species].strains || 0);
            totalWeightedProteins += (data[species].secretedProteins ? data[species].secretedProteins[0] : 0) * (data[species].strains || 0);
        }
        
        const avgGenes = Math.round(totalWeightedGenes / totalStrains);
        const avgProteins = Math.round(totalWeightedProteins / totalStrains);

        document.getElementById('total-species').textContent = totalSpecies;
        document.getElementById('total-strains').textContent = totalStrains;
        document.getElementById('avg-genes').textContent = avgGenes.toLocaleString();
        document.getElementById('avg-proteins').textContent = avgProteins;
    }
};

// Inicializar dashboard quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    // Simula a existência dos outros managers se não estiverem definidos para evitar erros
    window.FilterManager = window.FilterManager || { init: () => {} };
    window.UploadManager = window.UploadManager || { init: () => {} };
    window.ComparisonManager = window.ComparisonManager || { init: () => {} };
    window.EditableTableManager = window.EditableTableManager || { init: () => {} };
    window.NCBISearchManager = window.NCBISearchManager || { init: () => {} };
    window.ChartManager = window.ChartManager || { renderGenomicsCharts: () => {}, renderProteomicsCharts: () => {}, renderStructureCharts: () => {} };

    new Dashboard();
});