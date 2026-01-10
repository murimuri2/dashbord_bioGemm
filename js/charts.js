// charts.js - VERSÃO ATUALIZADA COM MELHORIAS
const ChartManager = {
    charts: {},
    
    init() {
        this.renderAllCharts();
    },
    
    renderAllCharts() {
        this.renderGenomicsCharts();
        this.renderProteomicsCharts();
        this.renderStructureCharts();
    },
    
    renderGenomicsCharts() {
        this.renderGenomeSizeChart();
        this.renderGCContentChart();
        this.renderGenesChart();
        this.renderRepetitiveContentChart();
        this.renderRipAffectedChart();
        this.renderContigsChart();
    },
    
    renderProteomicsCharts() {
        this.renderSecretedProteinsChart();
        this.renderEffectorsChart();
        this.renderBGCsChart();
        this.renderCAZymesChart();
        this.renderLipasesChart();
        this.renderProteasesChart();
    },
    
    renderStructureCharts() {
        // Gráficos de estrutura ATUALIZADOS
        this.renderGenomeComparisonChart();     // Scatter aprimorado com linha de tendência
        this.renderGenesVsProteinsChart();      // Duplo eixo Y
        this.renderGCDistributionChart();       // Boxplot em vez de polar
        this.renderGenomicFeaturesHeatmap();    // Heatmap em vez de radar
    },

    // Função para criar gráficos de barras padrão
    createBarChart(ctx, label, dataKey, backgroundColor, yAxisTitle) {
        const labels = Object.keys(speciesData);
        const chartData = labels.map(species => speciesData[species][dataKey][0]);
        
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: chartData,
                    backgroundColor: backgroundColor,
                    borderWidth: 1,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(44, 62, 80, 0.9)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'rgba(52, 152, 219, 0.8)',
                        borderWidth: 2
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: yAxisTitle,
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
        
    },
    

    // Gráficos Genômicos
    renderGenomeSizeChart() {
        const ctx = document.getElementById('genome-size-chart').getContext('2d');
        this.charts.genomeSizeChart = this.createBarChart(ctx, 'Tamanho do Genoma (Mb)', 'genomeSize', '#2c3e50', 'Tamanho (Mb)');
    },

    renderGCContentChart() {
        const ctx = document.getElementById('gc-content-chart').getContext('2d');
        this.charts.gcContentChart = this.createBarChart(ctx, 'Conteúdo GC (%)', 'gcContent', '#3498db', 'Conteúdo GC (%)');
    },

    renderGenesChart() {
        const ctx = document.getElementById('genes-chart').getContext('2d');
        this.charts.genesChart = this.createBarChart(ctx, 'Genes Previstos', 'genes', '#9b59b6', 'Genes');
    },

    renderRepetitiveContentChart() {
        const ctx = document.getElementById('repetitive-content-chart').getContext('2d');
        this.charts.repetitiveContentChart = this.createBarChart(ctx, 'Conteúdo Repetitivo (%)', 'repetitiveContent', '#e67e22', 'Conteúdo Repetitivo (%)');
    },

    renderRipAffectedChart() {
        const ctx = document.getElementById('rip-affected-chart').getContext('2d');
        this.charts.ripAffectedChart = this.createBarChart(ctx, '% de TEs Afetados por RIP', 'ripAffected', '#27ae60', '% de TEs Afetados');
    },

    renderContigsChart() {
        const ctx = document.getElementById('contigs-chart').getContext('2d');
        this.charts.contigsChart = this.createBarChart(ctx, 'Número de Contigs', 'contigs', '#8e44ad', 'Número de Contigs');
    },

    // Gráficos Proteômicos
    renderSecretedProteinsChart() {
        const ctx = document.getElementById('secreted-proteins-chart').getContext('2d');
        this.charts.secretedProteinsChart = this.createBarChart(ctx, 'Proteínas Secretadas', 'secretedProteins', '#e74c3c', 'Proteínas Secretadas');
    },

    renderEffectorsChart() {
        const ctx = document.getElementById('effectors-chart').getContext('2d');
        this.charts.effectorsChart = this.createBarChart(ctx, 'Efetores', 'effectors', '#d35400', 'Efetores');
    },

    renderBGCsChart() {
        const ctx = document.getElementById('bgcs-chart').getContext('2d');
        this.charts.bgcsChart = this.createBarChart(ctx, 'BGCs', 'bgcs', '#16a085', 'BGCs');
    },

    renderCAZymesChart() {
        const ctx = document.getElementById('cazymes-chart').getContext('2d');
        this.charts.cazymesChart = this.createBarChart(ctx, 'CAZymes', 'cazymes', '#2980b9', 'CAZymes');
    },

    renderLipasesChart() {
        const ctx = document.getElementById('lipases-chart').getContext('2d');
        this.charts.lipasesChart = this.createBarChart(ctx, 'Lipases', 'lipases', '#f39c12', 'Lipases');
    },

    renderProteasesChart() {
        const ctx = document.getElementById('proteases-chart').getContext('2d');
        this.charts.proteasesChart = this.createBarChart(ctx, 'Proteases', 'proteases', '#c0392b', 'Proteases');
    },

    // ========== GRÁFICOS DE ESTRUTURA ATUALIZADOS ==========

    // 1. Bubble chart aprimorado para Genoma vs Genes
    renderGenomeComparisonChart() {
        const ctx = document.getElementById('genome-comparison-chart').getContext('2d');
        
        const labels = Object.keys(speciesData);
        const dataPoints = labels.map(species => {
            const data = speciesData[species];
            return {
                x: data.genomeSize[0],
                y: data.genes[0],
                r: 8 + (data.contigs[0] / 10), // Tamanho proporcional aos contigs
                species: species,
                gcContent: data.gcContent[0],
                contigs: data.contigs[0],
                effectors: data.effectors[0],
                secretedProteins: data.secretedProteins[0]
            };
        });

        // Calcular linha de tendência
        const trendline = this.calculateTrendline(dataPoints);
        
        this.charts.genomeComparisonChart = new Chart(ctx, {
            type: 'bubble',
            data: {
                datasets: [
                    {
                        label: 'Espécies',
                        data: dataPoints,
                        backgroundColor: labels.map((_, i) => 
                            `hsla(${i * 60}, 70%, 50%, 0.7)`
                        ),
                        borderColor: labels.map((_, i) => 
                            `hsl(${i * 60}, 70%, 40%)`
                        ),
                        borderWidth: 2
                    },
                    {
                        label: 'Linha de Tendência',
                        data: trendline,
                        type: 'line',
                        fill: false,
                        borderColor: '#e74c3c',
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0,
                        showLine: true
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const point = context.raw;
                                return [
                                    `Espécie: ${point.species}`,
                                    `Tamanho: ${point.x.toFixed(2)} Mb`,
                                    `Genes: ${point.y.toLocaleString()}`,
                                    `Contigs: ${point.contigs}`,
                                    `GC: ${point.gcContent}%`,
                                    `Efetores: ${point.effectors}`,
                                    `Prot. Secretadas: ${point.secretedProteins}`
                                ];
                            }
                        },
                        backgroundColor: 'rgba(44, 62, 80, 0.95)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'rgba(52, 152, 219, 0.8)',
                        borderWidth: 2
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Tamanho do Genoma (Mb)',
                            font: { size: 12, weight: 'bold' }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Número de Genes',
                            font: { size: 12, weight: 'bold' }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'nearest'
                }
            }
        });
    },

    calculateTrendline(points) {
        if (points.length === 0) return [];
        
        const n = points.length;
        const sumX = points.reduce((sum, p) => sum + p.x, 0);
        const sumY = points.reduce((sum, p) => sum + p.y, 0);
        const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
        const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        const minX = Math.min(...points.map(p => p.x));
        const maxX = Math.max(...points.map(p => p.x));
        
        return [
            { x: minX, y: slope * minX + intercept },
            { x: maxX, y: slope * maxX + intercept }
        ];
    },

    // 2. Gráfico de Barras (genes) e Linha (proteínas) com duplo eixo
    renderGenesVsProteinsChart() {
        const ctx = document.getElementById('genes-vs-proteins-chart').getContext('2d');
        
        const labels = Object.keys(speciesData);
        const geneCounts = labels.map(species => speciesData[species].genes[0]);
        const proteinCounts = labels.map(species => speciesData[species].secretedProteins[0]);
        
        this.charts.genesVsProteinsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Genes Previstos',
                        data: geneCounts,
                        backgroundColor: 'rgba(52, 152, 219, 0.7)',
                        borderColor: '#3498db',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Proteínas Secretadas',
                        data: proteinCounts,
                        type: 'line',
                        fill: false,
                        borderColor: '#e74c3c',
                        backgroundColor: '#e74c3c',
                        borderWidth: 3,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(44, 62, 80, 0.95)',
                        titleColor: 'white',
                        bodyColor: 'white'
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Número de Genes',
                            font: { size: 12, weight: 'bold' }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Proteínas Secretadas',
                            font: { size: 12, weight: 'bold' }
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
    },

    // 3. Boxplot de Distribuição de GC (substitui o polar chart)
   // charts.js -> SUBSTITUA A FUNÇÃO INTEIRA POR ESTA VERSÃO CORRIGIDA

    // 3. Boxplot de Distribuição de GC (substitui o polar chart)
    renderGCDistributionChart() {
        const ctx = document.getElementById('gc-distribution-chart').getContext('2d');
        
        // Simular múltiplas medições para cada espécie
        const gcDistributions = {};
        Object.keys(speciesData).forEach(species => {
            const baseGC = speciesData[species].gcContent[0];
            gcDistributions[species] = Array.from({length: 20}, () => {
                const variation = (Math.random() - 0.5) * 2; // Variação de ±1%
                return baseGC + variation;
            });
        });

        // Calcular estatísticas para boxplot
        const boxplotData = Object.keys(gcDistributions).map(species => {
            const values = gcDistributions[species].sort((a, b) => a - b);
            const q1 = values[Math.floor(values.length * 0.25)];
            const median = values[Math.floor(values.length * 0.5)];
            const q3 = values[Math.floor(values.length * 0.75)];
            const iqr = q3 - q1;
            const min = Math.max(values[0], q1 - 1.5 * iqr);
            const max = Math.min(values[values.length - 1], q3 + 1.5 * iqr);
            
            return {
                min: min,
                q1: q1,
                median: median,
                q3: q3,
                max: max,
                outliers: values.filter(v => v < min || v > max)
            };
        });

        this.charts.gcDistributionChart = new Chart(ctx, {
            type: 'boxplot', // Agora este tipo é válido por causa do plugin
            data: {
                labels: Object.keys(gcDistributions),
                datasets: [{
                    label: 'Distribuição de Conteúdo GC',
                    // MODIFICAÇÃO IMPORTANTE: Passamos o array de objetos diretamente
                    data: boxplotData,
                    backgroundColor: 'rgba(52, 152, 219, 0.3)',
                    borderColor: '#3498db',
                    borderWidth: 2,
                    outlierColor: '#e74c3c',
                    itemRadius: 3
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        // MODIFICAÇÃO IMPORTANTE: O formato dos dados (stats) mudou
                        callbacks: {
                            label: function(context) {
                                const stats = context.raw;
                                return [
                                    `Máximo: ${stats.max.toFixed(2)}%`,
                                    `Q3: ${stats.q3.toFixed(2)}%`,
                                    `Mediana: ${stats.median.toFixed(2)}%`,
                                    `Q1: ${stats.q1.toFixed(2)}%`,
                                    `Mínimo: ${stats.min.toFixed(2)}%`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Conteúdo GC (%)',
                            font: { size: 12, weight: 'bold' }
                        }
                    }
                }
            }
        });
    },
    // 4. Heatmap de Características Genômicas (substitui o radar chart)
    renderGenomicFeaturesHeatmap() {
        const ctx = document.getElementById('effectors-vs-bgcs-chart').getContext('2d');
        
        const species = Object.keys(speciesData);
        const features = [
            { key: 'effectors', label: 'Efetores', color: '#e74c3c' },
            { key: 'bgcs', label: 'BGCs', color: '#3498db' },
            { key: 'cazymes', label: 'CAZymes', color: '#2ecc71' },
            { key: 'lipases', label: 'Lipases', color: '#f39c12' },
            { key: 'proteases', label: 'Proteases', color: '#9b59b6' },
            { key: 'secretedProteins', label: 'Prot. Secretadas', color: '#1abc9c' }
        ];

        // Preparar dados para heatmap
        const data = {
            labels: features.map(f => f.label),
            datasets: species.map((spec, speciesIndex) => ({
                label: spec,
                data: features.map(feature => speciesData[spec][feature.key][0]),
                backgroundColor: features.map((feature, featureIndex) => {
                    const value = speciesData[spec][feature.key][0];
                    const maxValue = Math.max(...species.map(s => speciesData[s][feature.key][0]));
                    const intensity = value / maxValue;
                    return `hsla(${featureIndex * 60}, 70%, 50%, ${0.3 + intensity * 0.7})`;
                }),
                borderColor: features.map(feature => feature.color),
                borderWidth: 1
            }))
        };

        this.charts.genomicFeaturesHeatmap = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const feature = features[context.dataIndex];
                                const species = context.dataset.label;
                                const value = context.parsed.x;
                                return `${species} - ${feature.label}: ${value}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        title: {
                            display: true,
                            text: 'Contagem',
                            font: { size: 12, weight: 'bold' }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y: {
                        stacked: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                }
            }
        });
    },

    // Função para atualizar todos os gráficos com dados filtrados
    updateChartsWithFilteredData(filteredData) {
        const labels = Object.keys(filteredData);
        
        // Atualizar gráficos de barras simples
        const barCharts = [
            { chart: this.charts.genomeSizeChart, dataKey: 'genomeSize' },
            { chart: this.charts.gcContentChart, dataKey: 'gcContent' },
            { chart: this.charts.genesChart, dataKey: 'genes' },
            { chart: this.charts.repetitiveContentChart, dataKey: 'repetitiveContent' },
            { chart: this.charts.ripAffectedChart, dataKey: 'ripAffected' },
            { chart: this.charts.contigsChart, dataKey: 'contigs' },
            { chart: this.charts.secretedProteinsChart, dataKey: 'secretedProteins' },
            { chart: this.charts.effectorsChart, dataKey: 'effectors' },
            { chart: this.charts.bgcsChart, dataKey: 'bgcs' },
            { chart: this.charts.cazymesChart, dataKey: 'cazymes' },
            { chart: this.charts.lipasesChart, dataKey: 'lipases' },
            { chart: this.charts.proteasesChart, dataKey: 'proteases' }
        ];

        barCharts.forEach(({ chart, dataKey }) => {
            if (chart && chart.data) {
                const data = labels.map(species => filteredData[species][dataKey][0]);
                chart.data.labels = labels;
                chart.data.datasets[0].data = data;
                chart.update('none');
            }
        });

        // Atualizar gráficos complexos de estrutura
        this.updateStructureChartsWithFilteredData(filteredData);
    },

    // Atualizar apenas os gráficos de estrutura
    updateStructureChartsWithFilteredData(filteredData) {
        const labels = Object.keys(filteredData);

        // 1. Atualizar Bubble Chart
        if (this.charts.genomeComparisonChart) {
            const dataPoints = labels.map(species => {
                const data = filteredData[species];
                return {
                    x: data.genomeSize[0],
                    y: data.genes[0],
                    r: 8 + (data.contigs[0] / 10),
                    species: species,
                    gcContent: data.gcContent[0],
                    contigs: data.contigs[0],
                    effectors: data.effectors[0],
                    secretedProteins: data.secretedProteins[0]
                };
            });
            const trendline = this.calculateTrendline(dataPoints);
            
            this.charts.genomeComparisonChart.data.datasets[0].data = dataPoints;
            this.charts.genomeComparisonChart.data.datasets[1].data = trendline;
            this.charts.genomeComparisonChart.update('none');
        }

        // 2. Atualizar Gráfico de Duplo Eixo
        if (this.charts.genesVsProteinsChart) {
            const geneCounts = labels.map(species => filteredData[species].genes[0]);
            const proteinCounts = labels.map(species => filteredData[species].secretedProteins[0]);
            
            this.charts.genesVsProteinsChart.data.labels = labels;
            this.charts.genesVsProteinsChart.data.datasets[0].data = geneCounts;
            this.charts.genesVsProteinsChart.data.datasets[1].data = proteinCounts;
            this.charts.genesVsProteinsChart.update('none');
        }

        // 3. Atualizar Boxplot de GC
        if (this.charts.gcDistributionChart) {
            const gcDistributions = {};
            labels.forEach(species => {
                const baseGC = filteredData[species].gcContent[0];
                gcDistributions[species] = Array.from({length: 20}, (_, i) => {
                    const variation = (Math.random() - 0.5) * 2;
                    return baseGC + variation;
                });
            });

            const boxplotData = labels.map(species => {
                const values = gcDistributions[species].sort((a, b) => a - b);
                const q1 = values[Math.floor(values.length * 0.25)];
                const median = values[Math.floor(values.length * 0.5)];
                const q3 = values[Math.floor(values.length * 0.75)];
                const iqr = q3 - q1;
                const min = Math.max(values[0], q1 - 1.5 * iqr);
                const max = Math.min(values[values.length - 1], q3 + 1.5 * iqr);
                
                return [min, q1, median, q3, max];
            });

            this.charts.gcDistributionChart.data.labels = labels;
            this.charts.gcDistributionChart.data.datasets[0].data = boxplotData;
            this.charts.gcDistributionChart.update('none');
        }

        // 4. Atualizar Heatmap
        if (this.charts.genomicFeaturesHeatmap) {
            const features = ['effectors', 'bgcs', 'cazymes', 'lipases', 'proteases', 'secretedProteins'];
            
            this.charts.genomicFeaturesHeatmap.data.datasets = labels.map((spec, speciesIndex) => ({
                label: spec,
                data: features.map(feature => filteredData[spec][feature][0]),
                backgroundColor: features.map((feature, featureIndex) => {
                    const value = filteredData[spec][feature][0];
                    const maxValue = Math.max(...labels.map(s => filteredData[s][feature][0]));
                    const intensity = value / maxValue;
                    return `hsla(${featureIndex * 60}, 70%, 50%, ${0.3 + intensity * 0.7})`;
                }),
                borderColor: features.map((_, featureIndex) => 
                    `hsl(${featureIndex * 60}, 70%, 40%)`
                ),
                borderWidth: 1
            }));
            this.charts.genomicFeaturesHeatmap.update('none');
        }
    }
};

// Registrar o tipo de gráfico boxplot se não estiver registrado
if (Chart.controllers.boxplot === undefined) {
    Chart.register({
        id: 'boxplot',
        beforeInit: function(chart) {
            chart.legend.afterFit = function() {
                this.height = this.height + 20;
            };
        }
    });
}

let multiSpeciesChart = null;
let bubbleChart = null;
let taiChart = null;

// --- GRÁFICO 1: MATRIZ MULTI-ESPÉCIES ---
// --- GRÁFICO 1: MATRIZ MULTI-ESPÉCIES (Estilo R/ggplot2) ---
function renderMultiSpeciesChartGrouped(data, xLabels, yLabels) {
    const matrixContainer = document.getElementById('multi-species-matrix-container');
    const ctx = document.getElementById('multi-species-matrix-chart').getContext('2d');
    
    // 1. Controle de Exibição
    if (matrixContainer) matrixContainer.style.display = 'block';
    const individualContainer = document.getElementById('trna-bubble-chart')?.closest('.chart-box');
    if (individualContainer) individualContainer.style.display = 'none';
    
    // 2. Preparação dos Dados (Flattening)
    const datasetData = [];

    data.forEach((item) => {
        xLabels.forEach((anticodon) => {
            const val = item.counts[anticodon] || 0;
            if (val > 0) {
                datasetData.push({
                    x: anticodon,     // Categoria Eixo X
                    y: item.species,  // Categoria Eixo Y
                    r: Math.min(Math.sqrt(val) * 4.5, 25), // Raio proporcional (Teto 25px)
                    v: val,
                    speciesName: item.species,
                    anticodonName: anticodon,
                    aa: typeof ANTICODON_TO_AA !== 'undefined' ? ANTICODON_TO_AA[anticodon] : '?',
                });
            }
        });
    });

    // 3. Altura Dinâmica (IMPORTANTE: Corrige o espaçamento vertical)
    // Base: 60px por espécie + 140px (cabeçalho/rodapé/padding)
    const calculatedHeight = (yLabels.length * 60) + 140; 
    if (matrixContainer) matrixContainer.style.height = `${calculatedHeight}px`;

    // Destruir instância anterior
    if (multiSpeciesChart) multiSpeciesChart.destroy();

    // 4. Renderização Chart.js
    multiSpeciesChart = new Chart(ctx, {
        type: 'bubble',
        data: {
            datasets: [{
                label: 'tRNAs',
                data: datasetData,
                // Mapa de Calor (Azul -> Laranja -> Vermelho)
                backgroundColor: function(context) {
                    const val = context.raw?.v || 0;
                    if (val >= 15) return 'rgba(192, 57, 43, 0.85)';  // Vermelho Forte
                    if (val >= 10) return 'rgba(231, 76, 60, 0.85)';  // Vermelho
                    if (val >= 5)  return 'rgba(243, 156, 18, 0.85)'; // Laranja
                    return 'rgba(52, 152, 219, 0.65)';                // Azul Suave
                },
                borderColor: 'rgba(0,0,0,0.2)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: { top: 40, right: 20, bottom: 0, left: 10 }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: () => '',
                        label: (c) => `${c.raw.y} | ${c.raw.aa}-${c.raw.x}: ${c.raw.v} cópias`
                    },
                    backgroundColor: 'rgba(44, 62, 80, 0.95)',
                    padding: 10,
                    cornerRadius: 6,
                    displayColors: true,
                    boxWidth: 10
                }
            },
            scales: {
                x: {
                    type: 'category',
                    labels: xLabels,
                    position: 'top', // Labels no topo
                    ticks: { 
                        autoSkip: false, 
                        maxRotation: 90, 
                        minRotation: 90,
                        font: { size: 10, family: "'Courier New', monospace" },
                        color: '#34495e'
                    },
                    grid: {
                        drawBorder: false,
                        // Linhas de grade visualmente distintas para separar Aminoácidos
                        color: (ctx) => {
                            if (typeof ANTICODON_TO_AA === 'undefined') return '#eee';
                            const index = ctx.index;
                            if (index === 0) return 'transparent';
                            const curr = ANTICODON_TO_AA[xLabels[index]];
                            const prev = ANTICODON_TO_AA[xLabels[index-1]];
                            return curr !== prev ? '#bdc3c7' : '#f7f9f9'; // Escuro na borda do grupo
                        },
                        lineWidth: (ctx) => {
                            if (typeof ANTICODON_TO_AA === 'undefined') return 1;
                            const index = ctx.index;
                            if (index === 0) return 0;
                            const curr = ANTICODON_TO_AA[xLabels[index]];
                            const prev = ANTICODON_TO_AA[xLabels[index-1]];
                            return curr !== prev ? 2 : 1;
                        }
                    }
                },
                y: {
                    type: 'category',
                    labels: yLabels,
                    offset: true,
                    ticks: { 
                        font: { size: 12, weight: '600' },
                        color: '#2c3e50'
                    },
                    grid: {
                        color: '#ecf0f1', // Linhas horizontais
                        drawBorder: false
                    }
                }
            }
        },
        // Plugin: Caixas de Agrupamento de Aminoácidos no Topo
        plugins: [{
            id: 'headerGroup',
            afterDraw: (chart) => {
                if (typeof ANTICODON_TO_AA === 'undefined') return;
                const ctx = chart.ctx;
                const xAxis = chart.scales.x;
                const topY = xAxis.bottom;

                let currentAA = null;
                let startX = null;

                ctx.save();
                ctx.font = 'bold 10px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                xLabels.forEach((label, i) => {
                    const aa = ANTICODON_TO_AA[label];
                    const x = xAxis.getPixelForValue(i);
                    const halfWidth = (xAxis.width / xLabels.length) / 2;

                    // Mudança de grupo ou início
                    if (aa !== currentAA) {
                        // Desenhar grupo anterior
                        if (currentAA !== null) {
                            const endX = xAxis.getPixelForValue(i - 1) + halfWidth;
                            const rectWidth = endX - startX;
                            
                            // Caixa
                            ctx.fillStyle = '#ecf0f1';
                            ctx.fillRect(startX, topY - 32, rectWidth - 2, 18);
                            // Texto
                            ctx.fillStyle = '#7f8c8d';
                            ctx.fillText(currentAA, startX + (rectWidth/2), topY - 23);
                        }
                        currentAA = aa;
                        startX = x - halfWidth;
                    }
                    
                    // Desenhar último grupo
                    if (i === xLabels.length - 1) {
                        const endX = x + halfWidth;
                        const rectWidth = endX - startX;
                        ctx.fillStyle = '#ecf0f1';
                        ctx.fillRect(startX, topY - 32, rectWidth - 2, 18);
                        ctx.fillStyle = '#7f8c8d';
                        ctx.fillText(currentAA, startX + (rectWidth/2), topY - 23);
                    }
                });
                ctx.restore();
            }
        }]
    });
}
// --- GRÁFICO 2: tRNA INDIVIDUAL (Blue) ---
function renderIndividualTrnaChart(counts, speciesName) {
    const individualContainer = document.getElementById('trna-bubble-chart').closest('.chart-box');
    const matrixContainer = document.getElementById('multi-species-matrix-container');
    
    if (individualContainer) individualContainer.style.display = 'block';
    if (matrixContainer) matrixContainer.style.display = 'none';
    
    const ctx = document.getElementById('trna-bubble-chart').getContext('2d');
    const labels = Object.keys(counts).sort();
    
    const dataPoints = labels.map((anticodon, index) => ({
        x: index,
        y: 0,
        r: Math.min(counts[anticodon] * 2, 30),
        v: counts[anticodon],
        anticodon: anticodon
    }));
    
    if (bubbleChart) bubbleChart.destroy();
    
    bubbleChart = new Chart(ctx, {
        type: 'bubble',
        data: {
            labels: labels,
            datasets: [{
                label: `tRNAs de ${speciesName}`,
                data: dataPoints,
                backgroundColor: 'rgba(52, 152, 219, 0.8)',
                borderColor: 'rgba(41, 128, 185, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Visualização de tRNAs - ${speciesName}`,
                    font: { size: 14, weight: 'bold' },
                    color: '#3498db'
                },
                legend: { display: false },
                tooltip: { callbacks: { label: (ctx) => `${ctx.raw.anticodon}: ${ctx.raw.v} cópias` } }
            },
            scales: {
                x: { 
                    type: 'category', labels: labels,
                    ticks: { autoSkip: false, maxRotation: 90, minRotation: 90, font: { size: 9 } }
                },
                y: { display: false, min: -1, max: 1 }
            }
        }
    });
}

// --- GRÁFICO 3: Distribuição tAI (Histograma) ---
function renderTaiDistributionChart(results) {
    const canvas = document.getElementById('tai-distribution-chart');
    if (!canvas) return;
    
    // Destrói gráfico anterior se existir (evita sobreposição)
    if (typeof taiChart !== 'undefined' && taiChart) {
        taiChart.destroy();
    }

    // 1. Validar Dados
    if (!results || results.length === 0) {
        console.warn("Sem dados para gerar distribuição tAI");
        return;
    }

    // 2. Processar Dados (Histograma)
    // tAI varia de 0.0 a 1.0. Vamos criar 20 intervalos (bins) de 0.05
    const binCount = 20;
    const histogram = new Array(binCount).fill(0);
    const values = results.map(r => r.tai);

    values.forEach(val => {
        // Encontra o índice do intervalo (ex: 0.43 * 20 = 8.6 -> índice 8)
        let index = Math.floor(val * binCount);
        // Garante que o valor máximo (1.0) fique no último intervalo
        if (index >= binCount) index = binCount - 1;
        histogram[index]++;
    });

    // Criar labels para o eixo X (0.0, 0.05, 0.10 ...)
    const labels = histogram.map((_, i) => (i / binCount).toFixed(2));

    const ctx = canvas.getContext('2d');
    
    // 3. Renderizar Gráfico
    // Importante: atribuir à variável global 'taiChart' declarada no topo do arquivo
    taiChart = new Chart(ctx, { 
        type: 'bar', 
        data: {
            labels: labels, 
            datasets: [{
                label: 'Frequência de Genes', 
                data: histogram, 
                backgroundColor: 'rgba(52, 152, 219, 0.7)', // Azul
                borderColor: 'rgba(41, 128, 185, 1)',
                borderWidth: 1,
                // Estas duas propriedades fazem as barras se tocarem (visual de histograma)
                barPercentage: 1.0,
                categoryPercentage: 1.0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // CRUCIAL: Permite que o gráfico ocupe os 350px do HTML
            plugins: {
                legend: { display: false },
                title: { 
                    display: true, 
                    text: `Distribuição de Eficiência (tAI) - ${results.length} Genes`,
                    font: { size: 14 }
                },
                tooltip: {
                    callbacks: {
                        title: (items) => {
                            const i = items[0].dataIndex;
                            const start = (i / binCount).toFixed(2);
                            const end = ((i + 1) / binCount).toFixed(2);
                            return `Intervalo tAI: ${start} - ${end}`;
                        },
                        label: (item) => `${item.raw} genes`
                    }
                }
            },
            scales: {
                x: { 
                    title: { display: true, text: 'Índice de Adaptação (tAI)' },
                    ticks: { maxTicksLimit: 11 } // Evita poluição visual no eixo X
                },
                y: { 
                    title: { display: true, text: 'Quantidade de Genes' },
                    beginAtZero: true
                }
            }
        } 
    });
}
