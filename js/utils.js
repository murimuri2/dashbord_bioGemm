const ANTICODON_TO_AA = {
    'GCC': 'Ala', 'GCT': 'Ala', 'GCA': 'Ala', 'GCG': 'Ala',
    'CGC': 'Arg', 'CGT': 'Arg', 'CGA': 'Arg', 'CGG': 'Arg', 'AGA': 'Arg', 'AGG': 'Arg', 'ACG': 'Arg', 'CCG': 'Arg', 'TCT': 'Arg', 'CCT': 'Arg',
    'AAC': 'Asn', 'AAT': 'Asn', 'GTT': 'Asn',
    'GAC': 'Asp', 'GAT': 'Asp', 'GTC': 'Asp',
    'TGC': 'Cys', 'TGT': 'Cys', 'GCA': 'Cys',
    'CAG': 'Gln', 'CAA': 'Gln', 'CTG': 'Gln', 'TTG': 'Gln',
    'GAG': 'Glu', 'GAA': 'Glu', 'CTC': 'Glu', 'TTC': 'Glu',
    'GGC': 'Gly', 'GGT': 'Gly', 'GGA': 'Gly', 'GGG': 'Gly', 'TCC': 'Gly', 'CCC': 'Gly',
    'CAC': 'His', 'CAT': 'His', 'GTG': 'His',
    'ATC': 'Ile', 'ATT': 'Ile', 'ATA': 'Ile', 'GAT': 'Ile', 'AAT': 'Ile',
    'CTC': 'Leu', 'CTT': 'Leu', 'CTA': 'Leu', 'CTG': 'Leu', 'TTA': 'Leu', 'TTG': 'Leu', 'CAA': 'Leu', 'TAG': 'Leu', 'CAG': 'Leu', 'TAA': 'Leu', 'GAG': 'Leu',
    'AAG': 'Lys', 'AAA': 'Lys', 'CTT': 'Lys', 'TTT': 'Lys',
    'ATG': 'Met', 'CAT': 'Met',
    'TTC': 'Phe', 'TTT': 'Phe', 'GAA': 'Phe',
    'CCC': 'Pro', 'CCT': 'Pro', 'CCA': 'Pro', 'CCG': 'Pro', 'AGG': 'Pro', 'TGG': 'Pro',
    'TCC': 'Ser', 'TCT': 'Ser', 'TCA': 'Ser', 'TCG': 'Ser', 'AGC': 'Ser', 'AGT': 'Ser', 'GCT': 'Ser', 'AGA': 'Ser', 'CGA': 'Ser', 'GGA': 'Ser', 'TGA': 'Ser',
    'ACC': 'Thr', 'ACT': 'Thr', 'ACA': 'Thr', 'ACG': 'Thr', 'GGT': 'Thr', 'CGT': 'Thr', 'TGT': 'Thr',
    'TGG': 'Trp', 'CCA': 'Trp',
    'TAC': 'Tyr', 'TAT': 'Tyr', 'GTA': 'Tyr',
    'GTC': 'Val', 'GTT': 'Val', 'GTA': 'Val', 'GTG': 'Val', 'AAC': 'Val', 'CAC': 'Val', 'TAC': 'Val',
    'TCA': 'Sup', 'CTA': 'Sup', 'TTA': 'Sup', 'TCA': 'Sec'
};

const AA_ORDER = ['Ala', 'Arg', 'Asn', 'Asp', 'Cys', 'Gln', 'Glu', 'Gly', 'His', 'Ile', 
                  'Leu', 'Lys', 'Met', 'Phe', 'Pro', 'Sec', 'Ser', 'Sup', 'Thr', 'Trp', 'Tyr', 'Val'];

const ORDERED_CODONS = [
    'TTT', 'TTC', 'TTA', 'TTG', 'TCT', 'TCC', 'TCA', 'TCG',
    'TAT', 'TAC', 'TAA', 'TAG', 'TGT', 'TGC', 'TGA', 'TGG',
    'CTT', 'CTC', 'CTA', 'CTG', 'CCT', 'CCC', 'CCA', 'CCG',
    'CAT', 'CAC', 'CAA', 'CAG', 'CGT', 'CGC', 'CGA', 'CGG',
    'ATT', 'ATC', 'ATA', 'ATG', 'ACT', 'ACC', 'ACA', 'ACG',
    'AAT', 'AAC', 'AAA', 'AAG', 'AGT', 'AGC', 'AGA', 'AGG',
    'GTT', 'GTC', 'GTA', 'GTG', 'GCT', 'GCC', 'GCA', 'GCG',
    'GAT', 'GAC', 'GAA', 'GAG', 'GGT', 'GGC', 'GGA', 'GGG'
];

const CODON_TABLE = { 
    'TTT': 'Phe', 'TTC': 'Phe', 'TTA': 'Leu', 'TTG': 'Leu', 'TCT': 'Ser', 'TCC': 'Ser', 'TCA': 'Ser', 'TCG': 'Ser', 
    'TAT': 'Tyr', 'TAC': 'Tyr', 'TAA': 'STOP', 'TAG': 'STOP', 'TGT': 'Cys', 'TGC': 'Cys', 'TGA': 'STOP', 'TGG': 'Trp', 
    'CTT': 'Leu', 'CTC': 'Leu', 'CTA': 'Leu', 'CTG': 'Leu', 'CCT': 'Pro', 'CCC': 'Pro', 'CCA': 'Pro', 'CCG': 'Pro', 
    'CAT': 'His', 'CAC': 'His', 'CAA': 'Gln', 'CAG': 'Gln', 'CGT': 'Arg', 'CGC': 'Arg', 'CGA': 'Arg', 'CGG': 'Arg', 
    'ATT': 'Ile', 'ATC': 'Ile', 'ATA': 'Ile', 'ATG': 'Met', 'ACT': 'Thr', 'ACC': 'Thr', 'ACA': 'Thr', 'ACG': 'Thr', 
    'AAT': 'Asn', 'AAC': 'Asn', 'AAA': 'Lys', 'AAG': 'Lys', 'AGT': 'Ser', 'AGC': 'Ser', 'AGA': 'Arg', 'AGG': 'Arg', 
    'GTT': 'Val', 'GTC': 'Val', 'GTA': 'Val', 'GTG': 'Val', 'GCT': 'Ala', 'GCC': 'Ala', 'GCA': 'Ala', 'GCG': 'Ala', 
    'GAT': 'Asp', 'GAC': 'Asp', 'GAA': 'Glu', 'GAG': 'Glu', 'GGT': 'Gly', 'GGC': 'Gly', 'GGA': 'Gly', 'GGG': 'Gly' 
};

// --- FUNÇÕES UTILITÁRIAS ORIGINAIS ---

const Utils = {
    formatNumber: (num) => num.toLocaleString('pt-BR'),
    calculateAverage: (arr) => arr.reduce((a, b) => a + b, 0) / arr.length,
    
    generateColor: (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = hash % 360;
        return `hsl(${hue}, 70%, 60%)`;
    },
    
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
    
    isValidFasta: (content) => {
        return content.startsWith('>') && content.includes('\n');
    },
    
    analyzeFasta: (content, fileName) => {
        const lines = content.split('\n');
        const sequence = lines.slice(1).join('').replace(/\s/g, '');
        const gcCount = (sequence.match(/[GC]/gi) || []).length;
        const totalBases = sequence.length;
        
        return {
            name: fileName.replace(/\.(fasta|fa|fna|ffn)$/i, ''),
            size: totalBases,
            gcContent: totalBases > 0 ? (gcCount / totalBases * 100).toFixed(2) : 0,
            genes: Math.floor(totalBases / 1000),
            contigs: 1
        };
    }
};

// --- FUNÇÕES GLOBAIS ADICIONAIS ---

function getRandomColor() {
    const h = Math.floor(Math.random() * 360);
    return `hsla(${h}, 70%, 50%, 0.75)`; 
}

function readFile(file) { 
    return new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = e => resolve(e.target.result);
        fr.onerror = reject;
        fr.readAsText(file);
    }); 
}

// CORREÇÃO: Funções agora disponíveis globalmente
function parseTRNA(txt) { 
    const map = {}; 
    txt.split('\n').forEach(line => {
        const parts = line.split(/[,\t]/); 
        if (parts.length >= 2) {
            const key = parts[0].trim().toUpperCase();
            const value = parseFloat(parts[1]);
            if (key && !isNaN(value)) {
                map[key] = value;
            }
        }
    }); 
    return map; 
}

function parseFasta(txt) { 
    const genes = []; 
    let current = {name: "", seq: ""}; 
    
    txt.split('\n').forEach(line => {
        line = line.trim();
        if (!line) return;
        
        if (line.startsWith('>')) {
            if (current.name) genes.push(current);
            current = {name: line.substring(1).split(' ')[0], seq: ""};
        } else {
            // CORREÇÃO: Adiciona 'N' ao regex
            current.seq += line.toUpperCase().replace(/[^ATCGN]/g, ''); 
        }
    }); 
    
    if (current.name) genes.push(current); 
    
    // Filtra genes válidos
    return genes.filter(gene => gene.seq.length % 3 === 0 && gene.seq.length > 0);
}

function filterAndSortAnticodons(anticodons) {
    const canonical = anticodons.filter(ac => ANTICODON_TO_AA[ac]);
    
    const grouped = {};
    canonical.forEach(ac => {
        const aa = ANTICODON_TO_AA[ac];
        if (!grouped[aa]) grouped[aa] = [];
        grouped[aa].push(ac);
    });
    
    Object.keys(grouped).forEach(aa => {
        grouped[aa].sort();
    });
    
    const result = [];
    AA_ORDER.forEach(aa => {
        if (grouped[aa]) {
            result.push(...grouped[aa]);
        }
    });
    
    return result;
}

// Nova função para download de arquivos
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType || 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// 1. Plugin global para garantir fundo branco (essencial para PNG)
if (typeof Chart !== 'undefined') {
    Chart.register({
        id: 'whiteBackground',
        beforeDraw: (chart) => {
            const ctx = chart.canvas.getContext('2d');
            ctx.save();
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, chart.width, chart.height);
            ctx.restore();
        }
    });
}

// 2. Função genérica de download
function downloadChartImage(canvasId, fileName) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas com id ${canvasId} não encontrado`);
        return;
    }

    // Cria um link temporário para download
    const link = document.createElement('a');
    link.download = fileName || 'grafico.png';
    link.href = canvas.toDataURL('image/png', 1.0); // 1.0 = qualidade máxima
    link.click();
}