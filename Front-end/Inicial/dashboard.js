// =========================
// BARRA LATERAL IA
// =========================

const abrirIA = document.getElementById("abrirIA");
const fecharIA = document.getElementById("fecharIA");
const painelIA = document.getElementById("painelIA");

const resultadoMYA =
document.getElementById("myaResultado");

abrirIA.addEventListener("click", () => {
    painelIA.classList.add("active");
});

fecharIA.addEventListener("click", () => {
    painelIA.classList.remove("active");
});

// =========================
// DADOS DO USUÁRIO
// =========================

const usuarioId = localStorage.getItem("usuario_id");

if (!usuarioId) {
    alert("Usuário não está logado.");
    window.location.href = "autentification.html";
}


// =========================
// CARREGAR DASHBOARD
// =========================

async function carregarDashboard() {

    try {

        const resposta = await fetch(
            `http://127.0.0.1:8000/dashboard/${usuarioId}`
        );

        const dados = await resposta.json();

        document.getElementById("saldo").textContent =
            `R$ ${dados.saldo.toFixed(2)}`;

        document.getElementById("ganhos").textContent =
            `R$ ${dados.total_ganhos.toFixed(2)}`;

        document.getElementById("gastos").textContent =
            `R$ ${dados.total_gastos.toFixed(2)}`;

    } catch (erro) {

        console.error("Erro ao carregar dashboard:", erro);

    }
}

// =========================
// CARREGAR TRANSAÇÕES
// =========================

async function carregarTransacoes() {

    try {

        const resposta = await fetch(
            `http://127.0.0.1:8000/transacoes/${usuarioId}`
        );

        const transacoes = await resposta.json();

        const container = document.getElementById("lista-transacoes");

        container.innerHTML = "";

        if (transacoes.length === 0) {

            container.innerHTML = `
                <div class="sem-transacoes">
                    Nenhuma transação encontrada.
                </div>
            `;

            return;
        }

        const ultimasTres = transacoes.slice(0, 3);

        ultimasTres.forEach(transacao => {

            const classe =
                transacao.tipo === "ganho"
                ? "ganho"
                : "gasto";

            const sinal =
                transacao.tipo === "ganho"
                ? "+"
                : "-";

            container.innerHTML += `
                <div class="transacao">

                    <div>
                        <strong>${transacao.categoria}</strong>
                        <br>
                        <small>${transacao.descricao || "Sem descrição"}</small>
                    </div>

                    <div class="${classe}">
                        ${sinal} R$ ${Number(transacao.valor).toFixed(2)}
                    </div>

                </div>
            `;

        });

    } catch (erro) {

        console.error("Erro ao carregar transações:", erro);

    }
}


const notificationBtn =
document.getElementById("notificationBtn");

const notificationPanel =
document.getElementById("notificationPanel");

notificationBtn.addEventListener("click", () => {

    notificationPanel.classList.toggle("hidden");

});

async function carregarNotificacoes(){

    const resposta = await fetch(
        `http://127.0.0.1:8000/notificacoes/${usuarioId}`
    );

    const notificacoes = await resposta.json();

    const lista =
    document.getElementById("notificationList");

    const contador =
    document.getElementById("notificationCount");

    lista.innerHTML = "";

    contador.innerText = notificacoes.length;

    notificacoes.forEach(notificacao => {

        lista.innerHTML += `

        <div class="notification-card">

            <h4>${notificacao.titulo}</h4>

            <p>${notificacao.mensagem}</p>

            <small>${notificacao.data}</small>

        </div>

        `;

    });

}

document
.getElementById("btnAnalise")
.addEventListener("click", async () => {

    resultadoMYA.innerHTML =
    "<p>MYA está analisando...</p>";

    try{

        const response = await fetch(
            `http://127.0.0.1:8000/analise/${usuarioId}`
        );

        const data =
        await response.json();

        resultadoMYA.innerHTML = `
            <h4>📊 Resumo Financeiro</h4>
            <p>${data.analise}</p>
        `;

    }
    catch{

        resultadoMYA.innerHTML =
        "<p>Erro ao gerar análise.</p>";

    }

});

document
.getElementById("btnGastos")
.addEventListener("click", async () => {

    resultadoMYA.innerHTML =
    "<p>Analisando categorias...</p>";

    try{

        const response = await fetch(
            `http://127.0.0.1:8000/categorias/${usuarioId}`
        );

        const data =
        await response.json();

        let html =
        "<h4>📊 Categorias com maiores gastos</h4>";

        data.categorias.forEach(cat => {

            html += `
                <p>
                    <strong>${cat.categoria}</strong>
                    - R$ ${cat.valor.toFixed(2)}
                </p>
            `;

        });

        resultadoMYA.innerHTML = html;

    }
    catch{

        resultadoMYA.innerHTML =
        "<p>Erro ao analisar categorias.</p>";

    }

});

document
.getElementById("btnEconomia")
.addEventListener("click", async () => {

    resultadoMYA.innerHTML =
    "<p>MYA está analisando...</p>";

    try{

        const response = await fetch(
            `http://127.0.0.1:8000/analise/${usuarioId}`
        );

        const data =
        await response.json();

        resultadoMYA.innerHTML = `
            <h4>📊 Resumo Financeiro</h4>
            <p>${data.analise}</p>
        `;

    }
    catch{

        resultadoMYA.innerHTML =
        "<p>Erro ao gerar análise.</p>";

    }

});

document
.getElementById("btnEconomia")
.addEventListener("click", async () => {

    resultadoMYA.innerHTML =
    "<p>MYA está criando dicas...</p>";

    try{

        const response = await fetch(
            `http://127.0.0.1:8000/economia/${usuarioId}`
        );

        const data =
        await response.json();

        resultadoMYA.innerHTML = `
            <h4>🎯 Dicas da MYA</h4>
            <p>${data.dicas}</p>
        `;

    }
    catch{

        resultadoMYA.innerHTML =
        "<p>Erro ao gerar dicas.</p>";

    }

});

async function carregarGraficoCategorias(){

    try{

        const response = await fetch(
            `http://127.0.0.1:8000/grafico-categorias/${usuarioId}`
        );

        const categorias =
        await response.json();

        const labels =
        categorias.map(
            item => item.categoria
        );

        const valores =
        categorias.map(
            item => item.total
        );

        const ctx =
        document
        .getElementById(
            "graficoCategorias"
        );

        new Chart(ctx, {

            type: "doughnut",

            data: {

                labels: labels,

                datasets: [

                    {

                        data: valores,

                        backgroundColor: [

                            "#A855F7",
                            "#7C3AED",
                            "#6366F1",
                            "#3B82F6",
                            "#06B6D4",
                            "#10B981"

                        ]

                    }

                ]

            },

            options: {

                responsive: true,

                plugins: {

                    legend: {

                        labels: {

                            color: "white"

                        }

                    }

                }

            }

        });

    }
    catch(error){

        console.error(
            "Erro gráfico:",
            error
        );

    }

}

// =========================
// INICIAR
// =========================

carregarDashboard();
carregarTransacoes();
carregarNotificacoes();
carregarGraficoCategorias();