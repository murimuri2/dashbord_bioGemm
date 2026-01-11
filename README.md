# Sistema de Dashboard Genômico Integrado

## Introdução

Este sistema é uma plataforma web completa para análise, visualização e comparação de dados genômicos de espécies fúngicas do gênero *Phyllosticta*. Desenvolvido para o Laboratório de Bioprospecção e Genética Molecular de Microrganismos (BioGeMM) da UFPR, o dashboard combina algoritmos bioinformáticos avançados com uma interface interativa que permite pesquisadores e estudantes explorarem dados genômicos complexos de forma intuitiva.

O sistema foi projetado com uma arquitetura modular que separa claramente as responsabilidades: frontend para visualização, backend para processamento de dados, e algoritmos especializados para análise genômica. A aplicação funciona completamente no navegador com suporte a processamento assíncrono e comunicação com APIs externas.

## Algoritmos Científicos Implementados

### 1. Algoritmo de Cálculo tAI (tRNA Adaptation Index)

O Índice de Adaptação de tRNA (tAI) é uma métrica que mede a eficiência de tradução de genes com base na correspondência entre a frequência de códons em um gene e a abundância de tRNAs celulares. O algoritmo implementado segue estas etapas:

```pseudo
INICIAR cálculo_tAI(sequência_do_gene, contagens_de_tRNA):
    
    // Passo 1: Calcular pesos dos códons baseados em tRNAs
    pesos = MAPA vazio
    
    PARA CADA códon NA tabela_de_códons:
        SE códon EM ['ATG', 'TGG', 'TAA', 'TAG', 'TGA']:
            pesos[códon] = 1  // Códons especiais
        SENÃO:
            pesos[códon] = 0
    
    // Mapear tRNAs para códons usando regras de Wobble
    PARA CADA anticodon NAS contagens_de_tRNA:
        abundância = contagens_de_tRNA[anticodon]
        
        // Converter anticodon para bases complementares
        base1 = complemento(anticodon[2])  // Posição 1 do códon
        base2 = complemento(anticodon[1])  // Posição 2 do códon
        
        // Determinar bases possíveis na posição 3 (Wobble)
        SE anticodon[0] = 'G':
            bases_possíveis = ['C', 'T']
        SENÃO SE anticodon[0] = 'C':
            bases_possíveis = ['G']
        SENÃO SE anticodon[0] = 'A':
            bases_possíveis = ['T']
        SENÃO SE anticodon[0] = 'T':
            bases_possíveis = ['A', 'G']
        SENÃO SE anticodon[0] = 'I':
            bases_possíveis = ['A', 'C', 'T']
        SENÃO:
            bases_possíveis = [complemento(anticodon[0])]
        
        // Atribuir abundância a códons reconhecidos
        PARA CADA base3 EM bases_possíveis:
            códon = base1 + base2 + base3
            SE códon EM pesos:
                pesos[códon] = pesos[códon] + abundância
    
    // Passo 2: Normalizar pesos por aminoácido
    pesos_normalizados = MAPA vazio
    
    // Encontrar valor máximo por aminoácido
    máximos_por_aa = MAPA vazio
    PARA CADA códon EM pesos:
        aa = aminoácido(códon)
        SE pesos[códon] > máximos_por_aa[aa] OU aa NÃO_EM máximos_por_aa:
            máximos_por_aa[aa] = pesos[códon]
    
    // Normalizar
    PARA CADA códon EM pesos:
        aa = aminoácido(códon)
        SE aa EM ['Met', 'Trp', 'STOP']:
            pesos_normalizados[códon] = 1
        SENÃO SE máximos_por_aa[aa] > 0:
            pesos_normalizados[códon] = pesos[códon] / máximos_por_aa[aa]
        SENÃO:
            pesos_normalizados[códon] = 0.0001  // Valor pequeno para evitar zero
    
    // Passo 3: Calcular tAI para o gene (média geométrica)
    SE comprimento(sequência_do_gene) < 15 OU comprimento(sequência_do_gene) % 3 != 0:
        RETORNAR nulo
    
    // Remover códon de parada se presente no final
    últimos_3 = sequência_do_gene[-3:]
    SE últimos_3 EM ['TAA', 'TAG', 'TGA']:
        sequência = sequência_do_gene[0:-3]
    SENÃO:
        sequência = sequência_do_gene
    
    soma_log = 0
    contagem_códons = 0
    
    PARA i = 0 ATÉ comprimento(sequência) - 2, PASSO 3:
        códon = sequência[i:i+3]
        SE códon EM pesos_normalizados:
            peso = pesos_normalizados[códon]
            soma_log = soma_log + LN(peso)
            contagem_códons = contagem_códons + 1
    
    SE contagem_códons = 0:
        RETORNAR 0
    
    // Fórmula final: média geométrica
    tAI = EXP(soma_log / contagem_códons)
    RETORNAR tAI
```

Este algoritmo implementa a teoria original de Sharp & Li (1987) com adaptações modernas. A média geométrica é usada porque a eficiência de tradução é o produto das eficiências individuais dos códons, não uma soma.

### 2. Algoritmo de Análise de FASTA

O sistema processa arquivos FASTA para extrair genes e suas sequências:

```pseudo
INICIAR analisar_fasta(conteúdo_do_arquivo):
    genes = LISTA vazia
    gene_atual = NULO
    
    PARA CADA linha EM dividir_por_linhas(conteúdo_do_arquivo):
        linha = remover_espaços(linha)
        
        SE linha está vazia:
            CONTINUAR
        
        SE linha começa com ">":
            // Novo gene
            SE gene_atual != NULO:
                ADICIONAR gene_atual À genes
            
            nome_gene = extrair_nome(linha)  // Tudo após '>' até primeiro espaço
            gene_atual = {'nome': nome_gene, 'sequência': ''}
        
        SENÃO:
            // Adicionar à sequência do gene atual
            SE gene_atual != NULO:
                // Filtrar apenas bases válidas
                sequência_filtrada = substituir_tudo_exceto(linha, 'ATCGN', '')
                gene_atual.sequência = gene_atual.sequência + MAIÚSCULAS(sequência_filtrada)
    
    // Adicionar último gene se existir
    SE gene_atual != NULO:
        ADICIONAR gene_atual À genes
    
    // Filtrar apenas genes válidos (múltiplo de 3 e não vazio)
    genes_válidos = FILTRAR genes ONDE:
        comprimento(gene.sequência) % 3 = 0
        E comprimento(gene.sequência) > 0
    
    RETORNAR genes_válidos
```

### 3. Algoritmo de Renderização da Matriz Comparativa

A visualização de matriz multi-espécies usa um algoritmo sofisticado para posicionamento e coloração:

```pseudo
INICIAR renderizar_matriz_comparativa(dados, espécies, anticódons):
    
    // Passo 1: Preparar dados
    pontos = LISTA vazia
    
    PARA CADA espécie EM espécies:
        PARA CADA anticodon EM anticódons:
            valor = dados[espécie][anticodon] OU 0
            
            SE valor > 0:
                // Calcular posição no grid
                índice_x = posição_em(anticodon, anticódons)
                índice_y = posição_em(espécie, espécies)
                
                // Calcular raio proporcional (raiz quadrada para melhor visual)
                raio_base = RAIZ_QUADRADA(valor) * 4.5
                raio = MÍNIMO(raio_base, 25)  // Limitar tamanho máximo
                
                // Calcular cor baseada no valor (gradiente azul->vermelho)
                valor_máximo = MÁXIMO(todos_os_valores)
                intensidade = valor / valor_máximo
                
                SE valor >= 15:
                    cor = 'rgba(192, 57, 43, 0.85)'    // Vermelho forte
                SENÃO SE valor >= 10:
                    cor = 'rgba(231, 76, 60, 0.85)'    // Vermelho
                SENÃO SE valor >= 5:
                    cor = 'rgba(243, 156, 18, 0.85)'   // Laranja
                SENÃO:
                    // Azul com intensidade variável
                    cor = `rgba(52, 152, 219, ${0.3 + intensidade * 0.7})`
                
                // Criar ponto
                ponto = {
                    x: índice_x,
                    y: índice_y,
                    r: raio,
                    cor: cor,
                    espécie: espécie,
                    anticodon: anticodon,
                    valor: valor
                }
                
                ADICIONAR ponto À pontos
    
    // Passo 2: Renderizar grid
    DESENHAR eixo_x COM anticódons
    DESENHAR eixo_y COM espécies
    
    // Passo 3: Adicionar agrupamento por aminoácido
    grupos_aminoácidos = AGRUPAR anticódons POR aminoácido
    
    PARA CADA grupo EM grupos_aminoácidos:
        aminoácido = grupo.nome
        anticódons_grupo = grupo.itens
        
        // Calcular posição do grupo
        início = posição_em(primeiro(anticódons_grupo), anticódons)
        fim = posição_em(último(anticódons_grupo), anticódons)
        
        // Desenhar barra de fundo para o grupo
        DESENHAR_RETÂNGULO(x: início, y: topo, largura: fim-início, altura: 18)
        DESENHAR_TEXTO(aminoácido, x: centro, y: topo+9)
    
    // Passo 4: Adicionar bolhas
    PARA CADA ponto EM pontos:
        DESENHAR_CÍRCULO(
            centro_x: ponto.x,
            centro_y: ponto.y,
            raio: ponto.r,
            cor: ponto.cor,
            borda: 'rgba(0,0,0,0.2)'
        )
    
    // Passo 5: Adicionar interatividade
    CONFIGURAR tooltips PARA CADA ponto MOSTRAR:
        `Espécie: ${ponto.espécie}`
        `Anticodon: ${ponto.anticodon} (${aminoácido(ponto.anticodon)})`
        `Cópias: ${ponto.valor}`
```

### 4. Algoritmo de Integração NCBI

O sistema se comunica com o banco de dados NCBI através da API Entrez:

```pseudo
INICIAR buscar_ncbi(termo_de_busca):
    
    // Passo 1: Buscar IDs de genomas
    PARÂMETROS = {
        db: 'assembly',
        term: termo_de_busca,
        retmode: 'json',
        api_key: CHAVE_API
    }
    
    resposta = REQUISIÇÃO_HTTP_GET('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi', PARÂMETROS)
    ids = resposta.json().esearchresult.idlist
    
    SE ids ESTÁ VAZIO:
        RETORNAR lista_vazia
    
    // Passo 2: Obter detalhes dos genomas
    PARÂMETROS = {
        db: 'assembly',
        id: JUNTAR(ids, ','),
        retmode: 'json'
    }
    
    resposta = REQUISIÇÃO_HTTP_GET('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi', PARÂMETROS)
    dados_crus = resposta.json().result
    
    // Passo 3: Processar resultados
    resultados = LISTA vazia
    
    PARA CADA id EM ids:
        item = dados_crus[id]
        
        // Priorizar acesso RefSeq (GCF) sobre GenBank (GCA)
        acesso = item.assemblyaccession OU 'N/A'
        é_refseq = acesso COMEÇA COM 'GCF'
        
        genoma = {
            id: id,
            organismo: item.organism OU 'N/A',
            título: item.assemblyname + (é_refseq ? ' (RefSeq)' : ' (GenBank)') ,
            acesso: acesso,
            data_submissão: item.submissiondate OU 'N/A',
            é_refseq: é_refseq,
            ftp_path: item.ftppath_refseq OU item.ftppath_genbank
        }
        
        ADICIONAR genoma À resultados
    
    // Ordenar: RefSeq primeiro
    ORDENAR resultados POR é_refseq DESCENDENTE
    
    RETORNAR resultados
```

```pseudo
INICIAR baixar_sequência(acesso):
    
    // Passo 1: Obter caminho FTP
    genoma = buscar_ncbi(acesso)[0]
    caminho_ftp = genoma.ftp_path
    
    SE caminho_ftp É NULO:
        LANÇAR ERRO 'Caminho FTP não disponível'
    
    // Passo 2: Construir URL para arquivo CDS
    nome_arquivo = ÚLTIMO_SEGMENTO(caminho_ftp, '/')
    url_cds = `${caminho_ftp}/${nome_arquivo}_cds_from_genomic.fna.gz`
    
    // Converter FTP para HTTPS
    url_cds = SUBSTITUIR(url_cds, 'ftp://', 'https://')
    
    // Passo 3: Baixar e descompactar
    resposta = REQUISIÇÃO_HTTP_GET(url_cds)
    
    SE resposta.status = 404:
        LANÇAR ERRO 'Arquivo CDS não encontrado. Tente um genoma RefSeq (GCF).'
    
    conteúdo_comprimido = resposta.conteúdo
    conteúdo_descomprimido = DESCOMPACTAR_GZIP(conteúdo_comprimido)
    
    RETORNAR conteúdo_descomprimido
```

### 5. Algoritmo de Extração de tRNA

Para análise tAI, o sistema precisa extrair contagens de tRNA de arquivos de anotação:

```pseudo
INICIAR extrair_trna(conteúdo_tabela_características):
    
    contagens = MAPA vazio
    
    PARA CADA linha EM dividir_por_linhas(conteúdo_tabela_características):
        // Pular comentários
        SE linha COMEÇA COM '#':
            CONTINUAR
        
        partes = DIVIDIR(linha, '\t')
        
        // Verificar se é tRNA
        SE partes[0] = 'tRNA':
            // Procurar anticodon na linha
            anticodon = NULO
            
            // Padrão: anticodon=XYZ
            correspondência = BUSCAR_REGEX(linha, 'anticodon=([A-Za-z]{3})')
            
            SE correspondência ENCONTRADA:
                anticodon = MAIÚSCULAS(correspondência[1])
            
            SE anticodon != NULO E comprimento(anticodon) = 3:
                contagens[anticodon] = contagens[anticodon] + 1 OU 1
    
    SE contagens ESTÁ VAZIO:
        LANÇAR ERRO 'Nenhum tRNA encontrado na anotação'
    
    RETORNAR contagens
```

### 6. Algoritmo de Filtragem Avançada

O sistema implementa filtros complexos que operam em tempo real:

```pseudo
INICIAR aplicar_filtros(dados_completos, filtros):
    
    dados_filtrados = MAPA vazio
    
    PARA CADA (espécie, dados) EM dados_completos:
        
        // Filtro 1: Espécies selecionadas
        SE filtros.espécies != ['all']:
            SE espécie NÃO_EM filtros.espécies:
                CONTINUAR
        
        // Filtro 2: Estilo de vida
        SE filtros.estilo_vida != 'all':
            SE filtros.estilo_vida NÃO_EM dados.lifestyles:
                CONTINUAR
        
        // Filtro 3: Origem geográfica
        SE filtros.origem != 'all':
            
            SE filtros.origem = 'Uploaded':
                SE dados.type != 'uploaded':
                    CONTINUAR
            
            SENÃO SE filtros.origem = 'Outros':
                principais_países = ['Brasil', 'China', 'Tailândia']
                tem_país_principal = FALSO
                
                PARA CADA origem EM dados.origins:
                    SE origem EM principais_países:
                        tem_país_principal = VERDADEIRO
                        PARAR
                
                SE tem_país_principal:
                    CONTINUAR
            
            SENÃO:
                // País específico
                SE filtros.origem NÃO_EM dados.origins:
                    CONTINUAR
        
        // Filtro 4: Número mínimo de genes
        média_genes = dados.genes[0]
        SE média_genes < filtros.min_genes:
            CONTINUAR
        
        // Passou em todos os filtros
        dados_filtrados[espécie] = dados
    
    RETORNAR dados_filtrados
```

## Funcionalidades do Sistema

### Processamento de Dados Genômicos

O sistema começa com dados genômicos básicos de seis espécies de *Phyllosticta*. Para cada espécie, armazena características como tamanho do genoma, conteúdo GC, número de genes, proteínas secretadas, efetores, BGCs, CAZymes, lipases, proteases, conteúdo repetitivo, percentual de TEs afetados por RIP, e número de contigs. Estas características são visualizadas em gráficos de barras interativos que atualizam em tempo real conforme filtros são aplicados.

### Análise de Eficiência de Tradução (tAI)

A funcionalidade mais avançada do sistema é o cálculo do Índice de Adaptação de tRNA. Esta análise requer dois conjuntos de dados: sequências de genes (em formato FASTA) e contagens de tRNAs (obtidas de anotações genômicas ou fornecidas pelo usuário). O algoritmo processa cada gene individualmente, calculando sua eficiência de tradução com base na correspondência entre seus códons e a abundância de tRNAs correspondentes. Os resultados são agregados por espécie e visualizados como distribuição de frequência e valores médios.

A matemática por trás do tAI é baseada na média geométrica dos pesos dos códons. Cada códon recebe um peso proporcional à abundância de tRNAs que o reconhecem, considerando as regras de pareamento wobble. A média geométrica é usada porque a eficiência de tradução total é o produto das eficiências individuais dos códons, não a soma.

### Sistema de Upload e Integração

O dashboard suporta três métodos de entrada de dados: (1) dados pré-carregados de espécies modelo, (2) upload de arquivos FASTA pelo usuário, e (3) busca e download automático do banco de dados NCBI. Para uploads, o sistema analisa automaticamente características básicas do genoma. Para NCBI, o sistema se conecta à API do Entrez, busca genomas por nome ou número de acesso, e baixa automaticamente sequências e anotações quando disponíveis.

A integração com NCBI é particularmente sofisticada: o sistema diferencia entre genomas RefSeq (GCF) e GenBank (GCA), priorizando os primeiros por terem anotações mais completas. Quando disponível, baixa a tabela de características para extrair automaticamente as contagens de tRNA, eliminando a necessidade de entrada manual.

### Visualização Comparativa

A matriz comparativa é uma visualização única que mostra a distribuição de tRNAs em múltiplas espécies simultaneamente. Cada célula representa um par espécie-anticodon, com o tamanho da bolha indicando o número de cópias. As colunas são agrupadas por aminoácido, facilitando a identificação de padrões de uso de tRNA entre espécies.

Esta visualização é implementada como um gráfico de bolhas customizado no Chart.js, com renderização otimizada para lidar com centenas de pontos de dados. O algoritmo de posicionamento calcula automaticamente o layout para garantir que as bolhas não se sobreponham excessivamente, enquanto o algoritmo de colorização aplica um gradiente baseado na contagem para destacar valores altos e baixos.

### Sistema de Filtros Interativos

Os filtros permitem explorar subconjuntos dos dados com base em múltiplos critérios: espécie, estilo de vida (patógeno vs. endófito), origem geográfica, e número mínimo de genes. Os filtros operam em cascata e atualizam todas as visualizações simultaneamente, proporcionando uma experiência de exploração de dados fluida.

O algoritmo de filtragem é otimizado para desempenho, utilizando estruturas de dados indexadas e avaliação preguiçosa. Quando um filtro é alterado, o sistema recalcula apenas as visualizações visíveis, mantendo a responsividade mesmo com grandes conjuntos de dados.

### Edição em Tempo Real

A tabela de comparação principal é completamente editável. Usuários podem clicar em valores para modificá-los, com as alterações refletindo imediatamente nos gráficos. Este recurso é valioso para cenários hipotéticos ("what-if") e para correção de dados.

Internamente, o sistema utiliza um modelo de dados reativo: quando um valor é alterado, um evento é disparado para todas as visualizações dependentes, que atualizam seus estados sem necessidade de recarregamento completo.

### Exportação de Resultados

O sistema oferece múltiplos formatos de exportação: gráficos como imagens PNG, tabelas de dados como CSV, e relatórios completos como arquivos textuais. A exportação de gráficos utiliza a API canvas do navegador para renderizar visualizações em alta resolução, enquanto a exportação de dados serializa estruturas JavaScript em formatos padronizados.

## Arquitetura Técnica

O frontend é construído com HTML5, CSS3 moderno com variáveis customizadas e gradientes, e JavaScript ES6+ com módulos. Chart.js é usado para visualizações, com plugins customizados para gráficos especializados como boxplots e heatmaps. O código é estruturado modularmente, com separação clara entre gerenciadores de dados, renderização visual, e lógica de negócio.

O backend em Flask fornece uma API REST para integração com serviços externos, principalmente o NCBI. A API é projetada com tratamento robusto de erros e fallbacks para quando serviços externos estão indisponíveis. O backend também serve como proxy para evitar problemas de CORS e gerenciar chaves de API.

A comunicação entre frontend e backend utiliza fetch API com promises async/await, proporcionando uma experiência de usuário responsiva mesmo durante operações de rede lentas. O sistema implementa cache em memória para resultados de API, reduzindo chamadas redundantes ao NCBI.

## Algoritmos de Otimização

### Cache de Sequências

```pseudo
INICIAR obter_sequência(espécie):
    SE espécie.sequence_content != INDEFINIDO:
        RETORNAR espécie.sequence_content  // Cache hit
    
    SENÃO SE espécie.type = 'ncbi' E espécie.accession != INDEFINIDO:
        // Baixar do backend
        sequência = REQUISIÇÃO_BACKEND(`/api/fetch-sequence?accession=${espécie.accession}`)
        
        // Armazenar em cache
        espécie.sequence_content = sequência
        
        RETORNAR sequência
    
    SENÃO:
        LANÇAR ERRO 'Sequência não disponível'
```

### Processamento Assíncrono em Lote

```pseudo
INICIAR processar_espécies_em_lote(espécies, função_processamento):
    resultados = LISTA vazia
    promessas = LISTA vazia
    
    // Criar promessas para processamento paralelo (limitado)
    limite_concorrência = 3
    índice = 0
    
    ENQUANTO índice < comprimento(espécies):
        lote = espécies[índice:índice+limite_concorrência]
        
        PARA CADA espécie EM lote:
            promessa = função_processamento(espécie)
                .ENTÃO(resultado => {
                    ADICIONAR resultado À resultados
                    RETORNAR resultado
                })
                .CAPTURAR(erro => {
                    REGISTRAR erro
                    RETORNAR nulo
                })
            
            ADICIONAR promessa À promessas
        
        // Aguardar lote atual antes de prosseguir
        AGUARDAR TODAS promessas
        
        índice = índice + limite_concorrência
    
    RETORNAR resultados
```

### Renderização Preguiçosa de Gráficos

```pseudo
INICIAR renderizar_gráficos_preguiçosamente(contêiner):
    observador = NOVO IntersectionObserver(
        QUANDO entrada É visível:
            SE entrada.intersectionRatio > 0.1:
                gráfico = entrada.target
                
                SE gráfico.dataset.renderizado != 'true':
                    INICIAR gráfico
                    gráfico.dataset.renderizado = 'true'
                
                observador.unobserve(gráfico)
    )
    
    PARA CADA gráfico EM contêiner.queryselectorAll('.chart-canvas'):
        observador.observe(gráfico)
```

## Conclusão

Este sistema representa uma plataforma completa para análise genômica, combinando algoritmos bioinformáticos rigorosos com uma interface acessível. A implementação do cálculo tAI segue padrões estabelecidos na literatura científica, enquanto as visualizações oferecem novas perspectivas sobre dados genômicos complexos.

A arquitetura modular permite fácil extensão para novas análises e visualizações. O código é documentado internamente com comentários explicativos, e a separação clara de responsabilidades facilita a manutenção e colaboração.

O sistema é particularmente valioso para pesquisas comparativas em genômica fúngica, permitindo identificar padrões evolutivos, adaptações específicas de hospedeiro, e potenciais alvos para intervenção em patógenos agrícolas.