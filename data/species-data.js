
// Dados centralizados das espécies - ATUALIZADO COM DADOS CORRETOS DO CSV
const speciesData = {
    'P. capitalensis': {
        lifestyle: { 'Patógeno': 1, 'Endófito': 0 },
        genomeSize: [32.66],
        gcContent: [54.49],
        secretedProteins: [810],
        effectors: [204],
        bgcs: [22],
        cazymes: [287],
        lipases: [156],
        proteases: [303],
        genes: [9999],
        contigs: [48],
        repetitiveContent: [1.71],
        ripAffected: [84.22],
        strains: 7,
        origins: ['Brasil', 'República Dominicana', 'Indonésia', 'Tailândia', 'Nova Zelândia'],
        lifestyles: ['Patógeno'],
        type: 'original'
    },
    'P. citriasiana': {
        lifestyle: { 'Patógeno': 1, 'Endófito': 0 },
        genomeSize: [33.51],
        gcContent: [51.84],
        secretedProteins: [762],
        effectors: [182],
        bgcs: [23],
        cazymes: [276],
        lipases: [152],
        proteases: [301],
        genes: [9310],
        contigs: [76],
        repetitiveContent: [12.00],
        ripAffected: [92.42],
        strains: 4,
        origins: ['Tailândia', 'China', 'Vietnã'],
        lifestyles: ['Patógeno'],
        type: 'original'
    },
    'P. citribraziliensis': {
        lifestyle: { 'Patógeno': 0, 'Endófito': 1 },
        genomeSize: [31.34],
        gcContent: [54.28],
        secretedProteins: [797],
        effectors: [206],
        bgcs: [24],
        cazymes: [279],
        lipases: [151],
        proteases: [303],
        genes: [9695],
        contigs: [206],
        repetitiveContent: [5.49],
        ripAffected: [94.44],
        strains: 3,
        origins: ['Brasil'],
        lifestyles: ['Endófito'],
        type: 'original'
    },
    'P. citricarpa': {
        lifestyle: { 'Patógeno': 1, 'Endófito': 0 },
        genomeSize: [30.48],
        gcContent: [53.80],
        secretedProteins: [766],
        effectors: [189],
        bgcs: [24],
        cazymes: [277],
        lipases: [150],
        proteases: [300],
        genes: [9259],
        contigs: [104],
        repetitiveContent: [4.37],
        ripAffected: [94.81],
        strains: 9,
        origins: ['Austrália', 'Brasil', 'China', 'Zimbábue', 'África do Sul', 'EUA', 'Portugal', 'Argentina', 'Malta'],
        lifestyles: ['Patógeno'],
        type: 'original'
    },
    'P. citrichinaensis': {
        lifestyle: { 'Patógeno': 1, 'Endófito': 0 },
        genomeSize: [29.35],
        gcContent: [55.05],
        secretedProteins: [758],
        effectors: [187],
        bgcs: [24],
        cazymes: [273],
        lipases: [149],
        proteases: [300],
        genes: [9237],
        contigs: [24],
        repetitiveContent: [3.02],
        ripAffected: [93.99],
        strains: 2,
        origins: ['China'],
        lifestyles: ['Patógeno'],
        type: 'original'
    },
    'P. paracitricarpa': {
        lifestyle: { 'Patógeno': 1, 'Endófito': 0 },
        genomeSize: [30.18],
        gcContent: [54.00],
        secretedProteins: [745],
        effectors: [182],
        bgcs: [23],
        cazymes: [273],
        lipases: [147],
        proteases: [298],
        genes: [9218],
        contigs: [112],
        repetitiveContent: [3.50],
        ripAffected: [94.04],
        strains: 2,
        origins: ['Grécia'],
        lifestyles: ['Patógeno'],
        type: 'original'
    }
};

// Dados para genomas carregados pelo usuário
const uploadedGenomes = {};

function updateGenomeData(speciesName, newData) {
    if (uploadedGenomes[speciesName]) {
        // Atualizar dados existentes
        Object.assign(uploadedGenomes[speciesName], newData);
        
        // Atualizar também nos dados principais se estiver lá
        if (speciesData[speciesName]) {
            Object.assign(speciesData[speciesName], newData);
        }
        
        // Disparar evento de atualização
        window.dispatchEvent(new CustomEvent('dataUpdated', { 
            detail: { species: speciesName, data: newData } 
        }));
    }
    return uploadedGenomes[speciesName];
}