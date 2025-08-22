// Dados simulados para demonstração
const speciesData = {
    'P. capitalensis': {
        lifestyle: { 'Patógeno': 1, 'Endófito': 6 },
        genomeSize: [32461131, 32606250, 32080394, 33036347, 32816367, 32875859, 32767725],
        gcContent: [54.58, 54.55, 54.58, 54.45, 54.41, 54.35, 54.54],
        secretedProteins: [808, 795, 798, 819, 820, 822, 813],
        effectors: [198, 206, 200, 205, 210, 206, 204],
        genes: [9977, 9953, 9926, 10091, 10090, 10037, 10025],
        strains: 7,
        origins: ['Brasil', 'Brasil', 'Rep. Dominicana', 'Indonésia', 'Tailândia', 'Nova Zelândia', 'Desconhecido'],
        lifestyles: ['Patógeno', 'Endófito', 'Endófito', 'Endófito', 'Endófito', 'Endófito', 'Endófito']
    },
    'P. citriasiana': {
        lifestyle: { 'Patógeno': 4, 'Endófito': 0 },
        genomeSize: [32696106, 33767235, 33270502, 34225214],
        gcContent: [51.56, 52.04, 52.34, 51.42],
        secretedProteins: [752, 781, 756, 759],
        effectors: [178, 187, 182, 182],
        genes: [9282, 9366, 9301, 9291],
        strains: 4,
        origins: ['Tailândia', 'China', 'Vietnã', 'China'],
        lifestyles: ['Patógeno', 'Patógeno', 'Patógeno', 'Patógeno']
    },
    'P. citribraziliensis': {
        lifestyle: { 'Patógeno': 0, 'Endófito': 3 },
        genomeSize: [31670975, 31354043, 31002620],
        gcContent: [54.17, 54.33, 54.34],
        secretedProteins: [796, 789, 805],
        effectors: [206, 206, 206],
        genes: [9574, 9570, 9941],
        strains: 3,
        origins: ['Brasil', 'Brasil', 'Brasil'],
        lifestyles: ['Endófito', 'Endófito', 'Endófito']
    },
    'P. citricarpa': {
        lifestyle: { 'Patógeno': 10, 'Endófito': 0 },
        genomeSize: [28952665, 30928160, 29845321, 30007393, 30430812, 30494376, 30431666, 30755040, 32267666],
        gcContent: [54.60, 53.56, 54.02, 54.03, 53.78, 53.77, 53.88, 53.66, 52.56],
        secretedProteins: [738, 767, 772, 769, 781, 761, 759, 772, 759],
        effectors: [179, 190, 191, 187, 191, 187, 193, 195, 187],
        genes: [9108, 9305, 9198, 9202, 9270, 9314, 9269, 9385, 9352],
        strains: 10,
        origins: ['Austrália', 'Brasil', 'China', 'Zimbábue', 'África do Sul', 'EUA', 'Portugal', 'Argentina', 'Malta'],
        lifestyles: ['Patógeno', 'Patógeno', 'Patógeno', 'Patógeno', 'Patógeno', 'Patógeno', 'Patógeno', 'Patógeno', 'Patógeno']
    },
    'P. citrichinaensis': {
        lifestyle: { 'Patógeno': 2, 'Endófito': 0 },
        genomeSize: [29162704, 29528840],
        gcContent: [55.07, 55.02],
        secretedProteins: [732, 783],
        effectors: [182, 191],
        genes: [9131, 9343],
        strains: 2,
        origins: ['China', 'China'],
        lifestyles: ['Patógeno', 'Patógeno']
    },
    'P. paracitricarpa': {
        lifestyle: { 'Patógeno': 2, 'Endófito': 0 },
        genomeSize: [29529839, 30827934],
        gcContent: [54.35, 53.64],
        secretedProteins: [727, 762],
        effectors: [178, 185],
        genes: [9083, 9352],
        strains: 2,
        origins: ['Grécia', 'Grécia'],
        lifestyles: ['Patógeno', 'Patógeno']
    }
};

// Variáveis para armazenar os gráficos
let lifestyleChart, genomeSizeChart, gcContentChart, secretedProteinsChart;

// Inicializar gráficos
document.addEventListener('DOMContentLoaded', function() {
    renderAllCharts();
    setupEventListeners();
    updateSummaryCards();
});

function setupEventListeners() {
    // Configurar eventos dos filtros
    document.getElementById('apply-filters').addEventListener('click', applyFilters);
    document.getElementById('reset-filters').addEventListener('click', resetFilters);
    document.getElementById('compare-button').addEventListener('click', updateComparison);
    document.getElementById('compare-reset').addEventListener('click', resetComparison);
    
    // Configurar eventos de mudança para atualização automática
    document.getElementById('lifestyle-filter').addEventListener('change', applyFilters);
    document.getElementById('origin-filter').addEventListener('change', applyFilters);
    document.getElementById('gene-filter').addEventListener('input', function() {
        document.getElementById('gene-value').textContent = this.value;
        applyFilters();
    });
    
    // Configurar eventos para os selects múltiplos
    const speciesFilter = document.getElementById('species-filter');
    for (let option of speciesFilter.options) {
        option.addEventListener('click', function() {
            if (this.value === 'all') {
                // Se selecionar "Todas", desmarcar as outras
                for (let opt of speciesFilter.options) {
                    if (opt.value !== 'all') opt.selected = false;
                }
            } else {
                // Se selecionar uma espécie, desmarcar "Todas"
                speciesFilter.options[0].selected = false;
            }
            applyFilters();
        });
    }
}

function renderAllCharts() {
    renderLifestyleChart();
    renderGenomeSizeChart();
    renderGCContentChart();
    renderSecretedProteinsChart();
}

function renderLifestyleChart() {
    const ctx = document.getElementById('lifestyle-chart').getContext('2d');
    
    // Calcular totais
    const pathogens = Object.values(speciesData).reduce((sum, species) => sum + species.lifestyle['Patógeno'], 0);
    const endophytes = Object.values(speciesData).reduce((sum, species) => sum + species.lifestyle['Endófito'], 0);
    
    if (lifestyleChart) lifestyleChart.destroy();
    
    lifestyleChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Patógenos', 'Endófitos'],
            datasets: [{
                data: [pathogens, endophytes],
                backgroundColor: ['#e74c3c', '#3498db'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: false
                }
            }
        }
    });
}

function renderGenomeSizeChart() {
    const ctx = document.getElementById('genome-size-chart').getContext('2d');
    
    const labels = Object.keys(speciesData);
    const data = labels.map(species => {
        const sizes = speciesData[species].genomeSize;
        return sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
    });
    
    if (genomeSizeChart) genomeSizeChart.destroy();
    
    genomeSizeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Tamanho Médio do Genoma (bp)',
                data: data,
                backgroundColor: '#2c3e50',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Tamanho (bp)'
                    }
                }
            }
        }
    });
}

function renderGCContentChart() {
    const ctx = document.getElementById('gc-content-chart').getContext('2d');
    
    const labels = Object.keys(speciesData);
    const data = labels.map(species => {
        const gcValues = speciesData[species].gcContent;
        return gcValues.reduce((sum, gc) => sum + gc, 0) / gcValues.length;
    });
    
    if (gcContentChart) gcContentChart.destroy();
    
    gcContentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Conteúdo GC Médio (%)',
                data: data,
                backgroundColor: '#3498db',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Conteúdo GC (%)'
                    }
                }
            }
        }
    });
}

function renderSecretedProteinsChart() {
    const ctx = document.getElementById('secreted-proteins-chart').getContext('2d');
    
    const labels = Object.keys(speciesData);
    const data = labels.map(species => {
        const proteins = speciesData[species].secretedProteins;
        return proteins.reduce((sum, count) => sum + count, 0) / proteins.length;
    });
    
    if (secretedProteinsChart) secretedProteinsChart.destroy();
    
    secretedProteinsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Proteínas Secretadas Médias',
                data: data,
                backgroundColor: '#9b59b6',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Proteínas Secretadas'
                    }
                }
            }
        }
    });
}

function applyFilters() {
    const selectedSpecies = Array.from(document.getElementById('species-filter').selectedOptions).map(opt => opt.value);
    const lifestyleFilter = document.getElementById('lifestyle-filter').value;
    const originFilter = document.getElementById('origin-filter').value;
    const geneFilter = parseInt(document.getElementById('gene-filter').value);
    
    // Filtrar dados com base nas seleções
    let filteredData = {};
    let totalStrains = 0;
    let totalGenes = 0;
    let totalProteins = 0;
    
    for (const [species, data] of Object.entries(speciesData)) {
        if (selectedSpecies.includes('all') || selectedSpecies.includes(species)) {
            // Verificar filtro de estilo de vida
            if (lifestyleFilter === 'all' || data.lifestyle[lifestyleFilter] > 0) {
                // Verificar filtro de origem
                if (originFilter === 'all' || 
                    (originFilter === 'Brasil' && data.origins.includes('Brasil')) ||
                    (originFilter === 'China' && data.origins.includes('China')) ||
                    (originFilter === 'Tailândia' && data.origins.includes('Tailândia')) ||
                    (originFilter === 'Outros' && !data.origins.includes('Brasil') && 
                     !data.origins.includes('China') && !data.origins.includes('Tailândia'))) {
                    
                    // Verificar filtro de genes
                    const avgGenes = data.genes.reduce((a, b) => a + b, 0) / data.genes.length;
                    if (avgGenes >= geneFilter) {
                        filteredData[species] = data;
                        totalStrains += data.strains;
                        totalGenes += avgGenes;
                        totalProteins += data.secretedProteins.reduce((a, b) => a + b, 0) / data.secretedProteins.length;
                    }
                }
            }
        }
    }
    
    // Atualizar os cartões de resumo
    document.getElementById('total-species').textContent = Object.keys(filteredData).length;
    document.getElementById('total-strains').textContent = totalStrains;
    document.getElementById('avg-genes').textContent = Math.round(totalGenes / Object.keys(filteredData).length || 0).toLocaleString();
    document.getElementById('avg-proteins').textContent = Math.round(totalProteins / Object.keys(filteredData).length || 0);
    
    // Atualizar gráficos com dados filtrados
    updateChartsWithFilteredData(filteredData);
}

function updateChartsWithFilteredData(filteredData) {
    // Atualizar gráfico de estilo de vida
    const pathogens = Object.values(filteredData).reduce((sum, species) => sum + species.lifestyle['Patógeno'], 0);
    const endophytes = Object.values(filteredData).reduce((sum, species) => sum + species.lifestyle['Endófito'], 0);
    
    lifestyleChart.data.datasets[0].data = [pathogens, endophytes];
    lifestyleChart.update();
    
    // Atualizar gráfico de tamanho do genoma
    const genomeLabels = Object.keys(filteredData);
    const genomeData = genomeLabels.map(species => {
        const sizes = filteredData[species].genomeSize;
        return sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
    });
    
    genomeSizeChart.data.labels = genomeLabels;
    genomeSizeChart.data.datasets[0].data = genomeData;
    genomeSizeChart.update();
    
    // Atualizar gráfico de conteúdo GC
    const gcLabels = Object.keys(filteredData);
    const gcData = gcLabels.map(species => {
        const gcValues = filteredData[species].gcContent;
        return gcValues.reduce((sum, gc) => sum + gc, 0) / gcValues.length;
    });
    
    gcContentChart.data.labels = gcLabels;
    gcContentChart.data.datasets[0].data = gcData;
    gcContentChart.update();
    
    // Atualizar gráfico de proteínas secretadas
    const proteinLabels = Object.keys(filteredData);
    const proteinData = proteinLabels.map(species => {
        const proteins = filteredData[species].secretedProteins;
        return proteins.reduce((sum, count) => sum + count, 0) / proteins.length;
    });
    
    secretedProteinsChart.data.labels = proteinLabels;
    secretedProteinsChart.data.datasets[0].data = proteinData;
    secretedProteinsChart.update();
}

function resetFilters() {
    document.getElementById('species-filter').selectedIndex = 0;
    document.getElementById('lifestyle-filter').value = 'all';
    document.getElementById('origin-filter').value = 'all';
    document.getElementById('gene-filter').value = 9000;
    document.getElementById('gene-value').textContent = '9000';
    
    applyFilters();
}

function updateComparison() {
    const species1 = document.getElementById('compare-1').value;
    const species2 = document.getElementById('compare-2').value;
    
    // Destacar as colunas comparadas na tabela
    const table = document.getElementById('comparison-table');
    const headers = table.querySelectorAll('th');
    const rows = table.querySelectorAll('tbody tr');
    
    // Remover destaque anterior
    headers.forEach(header => header.classList.remove('highlight'));
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        cells.forEach(cell => cell.classList.remove('highlight'));
    });
    
    // Destacar as colunas comparadas
    for (let i = 0; i < headers.length; i++) {
        if (headers[i].textContent === species1 || headers[i].textContent === species2) {
            headers[i].classList.add('highlight');
            
            // Destacar também as células correspondentes
            rows.forEach(row => {
                row.children[i].classList.add('highlight');
            });
        }
    }
}

function resetComparison() {
    const table = document.getElementById('comparison-table');
    const headers = table.querySelectorAll('th');
    const rows = table.querySelectorAll('tbody tr');
    
    // Remover destaque
    headers.forEach(header => header.classList.remove('highlight'));
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        cells.forEach(cell => cell.classList.remove('highlight'));
    });
}

function updateSummaryCards() {
    // Esta função poderia ser expandida para calcular valores com base nos dados
    // Por enquanto, usamos valores estáticos para demonstração
}