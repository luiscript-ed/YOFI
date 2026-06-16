/* ==========================================================================
   LÓGICA MATEMÁTICA E RENDERIZAÇÃO DO GRÁFICO DINÂMICO
   ========================================================================== */

// Evento disparado assim que a página carrega completamente
document.addEventListener("DOMContentLoaded", function() {
    
    // Função para gerar números inteiros aleatórios inclusivos
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // 1. Gerando os 3 primeiros números aleatórios (Ex: Valores entre 10 e 50 para equilíbrio visual)
    const number_one = getRandomInt(10, 50);
    const number_two = getRandomInt(15, 60);
    const number_tree = getRandomInt(20, 70);

    // 2. Executando a fórmula matemática exata exigida:
    // number_four = (two + tree) - (one / 4)
    // Usamos Math.round para manter o "int" (número inteiro) no gráfico
    const number_four = Math.round((number_two + number_tree) - (number_one / 4));

    // Array contendo os dados processados para alimentar o gráfico
    const dadosFinanceiros = [number_one, number_two, number_tree, number_four];

    // Buscando o contexto do elemento Canvas no HTML
    const ctx = document.getElementById('yofiChart').getContext('2d');

    // Instanciando o Chart.js para criar um gráfico Misto (Barras + Linha por cima)
    const yofiChart = new Chart(ctx, {
        data: {
            // Rótulos do eixo X representativos de períodos ou meses
            labels: ['Período 01', 'Período 02', 'Período 03', 'Meta Atual (Máxima)'],
            datasets: [
                {
                    // CAMADA 1: Gráfico de Linha por cima fazendo as quedas e subidas
                    type: 'line',
                    label: 'Tendência de Estabilidade',
                    data: dadosFinanceiros,
                    borderColor: '#ef4444', // Linha vermelha para destacar subidas e descidas
                    borderWidth: 3,
                    fill: false,
                    tension: 0.1, // Curvatura sutil da linha
                    order: 1 // Garante que a linha fique renderizada por cima das barras
                },
                {
                    // CAMADA 2: Gráfico de Barras representando cada valor individual
                    type: 'bar',
                    label: 'Controle de Volume Financeiro',
                    data: dadosFinanceiros,
                    backgroundColor: [
                        'rgba(37, 99, 235, 0.7)',  // Azul padrão
                        'rgba(37, 99, 235, 0.7)',  // Azul padrão
                        'rgba(37, 99, 235, 0.7)',  // Azul padrão
                        'rgba(16, 185, 129, 0.8)'  // Último maior valor destacado em Verde
                    ],
                    borderWidth: 1,
                    order: 2
                }
            ]
        },
        options: {
                responsive: true,
                maintainAspectRatio: false,
    
            // Configuração da animação de subida:
                animation: {
                    duration: 2000, // 2 segundos de animação
                    easing: 'easeOutQuart' // Efeito suave de desaceleração ao chegar no topo
                },
    
                scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.08)'
                    },
                ticks: {
                    color: 'white'
                }
        },
                x: {
                ticks: {
                    color: 'white'
                }
            }
        }
    }
});

    // Log para fins de debug e conferência no painel do desenvolvedor (F12)
    console.log(`Valores Gerados com Sucesso: N1: ${number_one} | N2: ${number_two} | N3: ${number_tree} | N4 (Fórmula): ${number_four}`);
});

/* ==========================================================================
   ESPAÇO RESERVADO PARA SEUS PULOS (Botões de menu, voltar, etc.)
   ========================================================================== */
// Você pode adicionar seus ouvintes de clique e funções de redirecionamento aqui embaixo...