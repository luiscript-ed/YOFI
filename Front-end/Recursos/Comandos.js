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
            labels: ['Primeiro mês', 'Segundo mês', 'Terceiro mês', 'Projeção Alvo'],
            datasets: [
                {
                    // A linha passando por cima
                    type: 'line',
                    label: 'Fluxo',
                    data: dadosValores,
                    borderColor: '#10b981',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.3,
                    pointBackgroundColor: '#fff'
                },
                {
                    // As barras
                    label: 'Estimativas',
                    data: dadosValores,
                    backgroundColor: [
                        'rgba(4, 62, 223, 0.6)',
                        'rgba(52, 17, 209, 0.87)',
                        'rgba(148, 3, 245, 0.6)',
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
    //Faz os simbolos dos itens das atualizações
    document.addEventListener("DOMContentLoaded", () => {
    
        // Seleciona todas as tarefas do quadro
        const tarefas = document.querySelectorAll(".todo-item");

        tarefas.forEach(tarefa => {
            // Pega o status definido no HTML (feito, erro, pendente)
            const status = tarefa.getAttribute("data-status");
            // Procura a caixinha onde o ícone deve aparecer
            const iconContainer = tarefa.querySelector(".todo-icon");

            // Lógica de decisão pelo código
            if (status === "feito") {
                iconContainer.textContent = "✅";
            } 
            else if (status === "erro") {
                iconContainer.textContent = "🚫";
            } 
            else {
                iconContainer.textContent = "⏳"; 
            // Para o que ainda está sendo feito, ou qualuer outra nomenclatura usada.
            }
        });

    });
});