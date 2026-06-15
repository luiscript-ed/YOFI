// =========================
// BARRA LATERAL IA
// =========================

const abrirIA = document.getElementById("abrirIA");
const fecharIA = document.getElementById("fecharIA");
const painelIA = document.getElementById("painelIA");

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

// =========================
// INICIAR
// =========================

carregarDashboard();
carregarTransacoes();
carregarNotificacoes();