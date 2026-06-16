document.addEventListener("DOMContentLoaded", () => {
    
    // Generador de números aleatórios
    const n1 = Math.floor(Math.random() * 4000) + 1000;
    const n2 = Math.floor(Math.random() * 4000) + 1000;
    const n3 = Math.floor(Math.random() * 4000) + 1000;

    // Garante que o último número (n4) é maior que todos os outros 3 anteriores
    const maiorValor = Math.max(n1, n2, n3);
    const n4 = maiorValor + Math.floor(Math.random() * 2000) + 1000;

    const dadosValores = [n1, n2, n3, n4];

    // Atualiza os textos no HTML
    document.getElementById("v1").textContent = `R$ ${n1.toFixed(2)}`;
    document.getElementById("v2").textContent = `R$ ${n2.toFixed(2)}`;
    document.getElementById("v3").textContent = `R$ ${n3.toFixed(2)}`;
    document.getElementById("v4").textContent = `R$ ${n4.toFixed(2)}`;

    // Inicialização do Gráfico Misto (Barras + Linha)
    const ctx = document.getElementById("graficoRecursos").getContext("2d");

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Jan-Mar', 'Apr-Jun', 'Jul-Set', 'Projeção Alvo'],
            datasets: [
                {
                    // A linha passando por cima
                    type: 'line',
                    label: 'Fluxo de Tendência',
                    data: dadosValores,
                    borderColor: '#10b981',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.3,
                    pointBackgroundColor: '#fff'
                },
                {
                    // As barras
                    label: 'Métricas de Caixa',
                    data: dadosValores,
                    backgroundColor: [
                        'rgba(168, 85, 247, 0.6)',
                        'rgba(124, 58, 237, 0.6)',
                        'rgba(99, 102, 241, 0.6)',
                        'rgba(16, 185, 129, 0.6)'
                    ],
                    borderWidth: 0,
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            // ANIMAÇÃO DE SUBIDA DA TABELA PARA O TAMANHO CORRETO
            animation: {
                duration: 2000,
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: {
                    labels: { color: 'white' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: 'white' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: 'white' }
                }
            }
        }
    });
});