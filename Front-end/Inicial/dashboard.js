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

let usuario = null;
let usuarioId = null;

// =========================
// DADOS DO USUÁRIO
// =========================

async function verificarLogin() {
    try {

        const resposta = await fetch(
            "https://yofi-api.onrender.com/me",
            {
                method: "GET",
                credentials: "include"
            }
        );

        if (!resposta.ok) {

            window.location.href =
                "../autentification.html";

            return false;
        }

        usuario = await resposta.json();

        console.log(
            "Usuário autenticado:",
            usuario
        );

        usuarioId = usuario.usuario_id;

        console.log(
            "ID do usuário:",
            usuarioId
        );

        return true;

    } catch (erro) {

        console.error(
            "Erro ao verificar autenticação:",
            erro
        );

        window.location.href =
            "../autentification.html";

        return false;
    }
}


// =========================
// CARREGAR DASHBOARD
// =========================

async function carregarDashboard() {

    try {

        const resposta = await fetch(
            `https://yofi-api.onrender.com/dashboard`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        if (!resposta.ok) {

            console.error(
                "Erro HTTP dashboard:",
                resposta.status
            );

            return;
        }

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
            `https://yofi-api.onrender.com/transacoes`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        if (!resposta.ok) {

            console.error(
                "Erro HTTP transações:",
                resposta.status
            );

            return;
        }

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

const somMYA = new Audio("somMya.mp3");

function tocarSomMYA() {
    somMYA.currentTime = 0;
    somMYA.play();
}

let ultimaQuantidade = 0;

const notificationBtn =
document.getElementById("notificationBtn");

const notificationPanel =
document.getElementById("notificationPanel");

notificationBtn.addEventListener("click", () => {

    notificationPanel.classList.toggle("hidden");

});

async function carregarNotificacoes() {

        const resposta = await fetch(
            `https://yofi-api.onrender.com/notificacoes`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        if (!resposta.ok) {

            console.error(
                "Erro HTTP notificações:",
                resposta.status
            );

            return;
        }

    const notificacoes = await resposta.json();

    const lista =
    document.getElementById("notificationList");

    const contador =
    document.getElementById("notificationCount");

    if (
        ultimaQuantidade > 0 &&
        notificacoes.length > ultimaQuantidade
    ) {
        tocarSomMYA();
    }

    ultimaQuantidade = notificacoes.length;

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

        const resposta = await fetch(
            `https://yofi-api.onrender.com/analise`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        if (!resposta.ok) {

            console.error(
                "Erro HTTP analise financeira:",
                resposta.status
            );

            return;
        }

        const data =
        await resposta.json();

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

        const resposta = await fetch(
            `https://yofi-api.onrender.com/categorias`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        if (!resposta.ok) {

            console.error(
                "Erro HTTP categorias:",
                resposta.status
            );

            return;
        }

        const data =
        await resposta.json();

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
    "<p>MYA está criando dicas...</p>";

    try{

        const resposta = await fetch(
            `https://yofi-api.onrender.com/economia`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        if (!resposta.ok) {

            console.error(
                "Erro HTTP dashboard:",
                resposta.status
            );

            return;
        }

        const data =
        await resposta.json();

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

        const resposta = await fetch(
            `https://yofi-api.onrender.com/grafico-categorias`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        if (!resposta.ok) {

            console.error(
                "Erro HTTP dashboard:",
                resposta.status
            );

            return;
        }

        const categorias =
        await resposta.json();

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
// INICIAR PÁGINA
// =========================

async function iniciarPagina() {

    const autenticado =
        await verificarLogin();

    if (!autenticado) {

        return;

    }

    await carregarDashboard();

    await carregarTransacoes();

    await carregarNotificacoes();

    await carregarGraficoCategorias();

}

iniciarPagina();
