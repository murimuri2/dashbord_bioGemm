// Gerenciamento de comparações
const ComparisonManager = {
    init() {
        this.setupEventListeners();
    },
    
    setupEventListeners() {
        document.getElementById('compare-button').addEventListener('click', () => this.updateComparison());
        document.getElementById('compare-reset').addEventListener('click', () => this.resetComparison());
    },
    
    updateComparison() {
        const species1 = document.getElementById('compare-1').value;
        const species2 = document.getElementById('compare-2').value;
        
        if (species1 === species2) {
            alert('Por favor, selecione espécies diferentes para comparação.');
            return;
        }
        
        this.highlightComparison(species1, species2);
        this.showComparisonChart(species1, species2);
    },
    
    highlightComparison(species1, species2) {
        const table = document.getElementById('comparison-table');
        const headers = table.querySelectorAll('th');
        const rows = table.querySelectorAll('tbody tr');
        
        // Remover destaque anterior
        headers.forEach(header => header.classList.remove('highlight'));
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach(cell => cell.classList.remove('highlight'));
        });
        
        // Destacar colunas comparadas
        for (let i = 0; i < headers.length; i++) {
            const headerText = headers[i].textContent;
            if (headerText.includes(species1) || headerText.includes(species2)) {
                headers[i].classList.add('highlight');
                
                // Destacar células correspondentes
                rows.forEach(row => {
                    if (row.children[i]) {
                        row.children[i].classList.add('highlight');
                    }
                });
            }
        }
    },
    
    showComparisonChart(species1, species2) {
        // Implementar gráfico de comparação detalhada
        console.log(`Comparando ${species1} com ${species2}`);
        // Aqui você pode adicionar um modal ou nova seção com gráfico comparativo
    },
    
    resetComparison() {
        const table = document.getElementById('comparison-table');
        const headers = table.querySelectorAll('th');
        const rows = table.querySelectorAll('tbody tr');
        
        headers.forEach(header => header.classList.remove('highlight'));
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach(cell => cell.classList.remove('highlight'));
        });
    }
};