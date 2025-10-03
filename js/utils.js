// Utilitários gerais
const Utils = {
    // Formatar números
    formatNumber: (num) => num.toLocaleString('pt-BR'),
    
    // Calcular média de array
    calculateAverage: (arr) => arr.reduce((a, b) => a + b, 0) / arr.length,
    
    // Gerar cor baseada no nome
    generateColor: (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = hash % 360;
        return `hsl(${hue}, 70%, 60%)`;
    },
    
    // Debounce para otimizar performance
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Validar arquivo FASTA
    isValidFasta: (content) => {
        return content.startsWith('>') && content.includes('\n');
    },
    
    // Analisar conteúdo FASTA básico
    analyzeFasta: (content, fileName) => {
        const lines = content.split('\n');
        const sequence = lines.slice(1).join('').replace(/\s/g, '');
        const gcCount = (sequence.match(/[GC]/gi) || []).length;
        const totalBases = sequence.length;
        
        return {
            name: fileName.replace('.fasta', '').replace('.fa', '').replace('.fna', ''),
            size: totalBases,
            gcContent: totalBases > 0 ? (gcCount / totalBases * 100).toFixed(2) : 0,
            genes: Math.floor(totalBases / 1000), // Estimativa simples
            contigs: 1 // Assumindo um contig por arquivo
        };
    }
};