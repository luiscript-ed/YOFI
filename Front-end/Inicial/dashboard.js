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

// ==========================================
// CONFIGURAÇÃO DO SOM DA MYA
// ==========================================

const somMYA = new Audio("../Imagens-Audios/somMya.mp3");

somMYA.preload = "auto";

let audioPermitido = false;


// ==========================================
// DEBUG DO ÁUDIO
// ==========================================

console.log("🔊 Inicializando sistema de áudio...");
console.log("🔊 Caminho do áudio:", somMYA.src);


// Quando o arquivo de áudio estiver carregado
somMYA.addEventListener("canplaythrough", () => {

    console.log("✅ Áudio da MYA carregado corretamente.");

});


// Caso o arquivo não seja encontrado
somMYA.addEventListener("error", (erro) => {

    console.error(
        "❌ ERRO ao carregar o áudio da MYA:",
        erro
    );

    console.error(
        "❌ Caminho utilizado:",
        somMYA.src
    );

});


// ==========================================
// ATIVAR ÁUDIO APÓS INTERAÇÃO DO USUÁRIO
// ==========================================

async function ativarAudio() {

    console.log("🔊 Tentando liberar áudio...");

    try {

        somMYA.volume = 0;

        await somMYA.play();

        somMYA.pause();

        somMYA.currentTime = 0;

        somMYA.volume = 1;

        audioPermitido = true;

        console.log(
            "✅ Áudio da MYA foi liberado pelo navegador!"
        );

    } catch (erro) {

        console.error(
            "❌ Não foi possível liberar o áudio:",
            erro
        );

        audioPermitido = false;
    }
}


// Qualquer primeira interação do usuário libera o áudio
document.addEventListener(
    "click",
    ativarAudio,
    { once: true }
);


// ==========================================
// TOCAR SOM DA MYA
// ==========================================

async function tocarSomMYA() {

    console.log("🐱 MYA recebeu ordem para tocar o som.");

    console.log(
        "🔊 Áudio permitido:",
        audioPermitido
    );

    if (!audioPermitido) {

        console.warn(
            "⚠️ Áudio ainda não foi liberado pelo usuário."
        );

        return;
    }

    try {

        somMYA.currentTime = 0;

        await somMYA.play();

        console.log(
            "🐱 Som da MYA reproduzido com sucesso!"
        );

    } catch (erro) {

        console.error(
            "❌ Erro ao reproduzir som da MYA:",
            erro
        );

    }
}


// ==========================================
// NOTIFICAÇÕES DO NAVEGADOR
// ==========================================

async function solicitarPermissaoNotificacao() {

    console.log(
        "🔔 Permissão atual:",
        Notification.permission
    );

    // Navegador já autorizou
    if (Notification.permission === "granted") {

        console.log(
            "✅ Notificações já estão autorizadas."
        );

        return true;
    }


    // Navegador bloqueou anteriormente
    if (Notification.permission === "denied") {

        console.warn(
            "❌ Notificações estão bloqueadas pelo navegador."
        );

        return false;
    }


    // Ainda não foi decidido
    try {

        const permissao =
            await Notification.requestPermission();

        console.log(
            "🔔 Nova permissão:",
            permissao
        );

        if (permissao === "granted") {

            console.log(
                "✅ Usuário permitiu notificações!"
            );

            return true;
        }

        console.warn(
            "⚠️ Usuário não permitiu notificações."
        );

        return false;

    } catch (erro) {

        console.error(
            "❌ Erro ao solicitar permissão:",
            erro
        );

        return false;
    }
}


// ==========================================
// ELEMENTOS DAS NOTIFICAÇÕES
// ==========================================

const notificationBtn =
    document.getElementById("notificationBtn");

const notificationPanel =
    document.getElementById("notificationPanel");


// ==========================================
// BOTÃO DE NOTIFICAÇÕES
// ==========================================

if (notificationBtn) {

    notificationBtn.addEventListener("click", async () => {

        console.log(
            "🔔 Botão de notificações clicado."
        );

        // Libera áudio
        await ativarAudio();

        // Solicita permissão para notificações
        await solicitarPermissaoNotificacao();

        // Abre/fecha painel
        notificationPanel.classList.toggle("hidden");

    });

} else {

    console.error(
        "❌ Elemento #notificationBtn não encontrado."
    );

}


// ==========================================
// CONTROLE
// ==========================================

let ultimaQuantidade = 0;


// ==========================================
// CARREGAR NOTIFICAÇÕES
// ==========================================

async function carregarNotificacoes() {

    console.log(
        "🔄 Verificando novas notificações..."
    );

    try {

        const resposta = await fetch(
            "https://yofi-api.onrender.com/notificacoes",
            {
                method: "GET",
                credentials: "include"
            }
        );


        // ==================================
        // ERRO HTTP
        // ==================================

        if (!resposta.ok) {

            console.error(
                "❌ Erro HTTP notificações:",
                resposta.status
            );

            if (resposta.status === 401) {

                console.warn(
                    "⚠️ Usuário não autenticado."
                );

            }

            return;
        }


        // ==================================
        // RESPOSTA
        // ==================================

        const notificacoes =
            await resposta.json();

        console.log(
            "🔔 Notificações recebidas:",
            notificacoes
        );

        console.log(
            "🔢 Quantidade atual:",
            notificacoes.length
        );

        console.log(
            "🔢 Quantidade anterior:",
            ultimaQuantidade
        );


        const lista =
            document.getElementById(
                "notificationList"
            );

        const contador =
            document.getElementById(
                "notificationCount"
            );


        // ==================================
        // DETECTAR NOVA NOTIFICAÇÃO
        // ==================================

        if (
            ultimaQuantidade > 0 &&
            notificacoes.length > ultimaQuantidade
        ) {

            console.log(
                "🚨 NOVA NOTIFICAÇÃO DETECTADA!"
            );


            // Tocar miado
            tocarSomMYA();


            // Mostrar notificação do navegador
            mostrarNotificacaoNavegador(
                notificacoes[0]
            );

        }


        // Primeira leitura
        if (ultimaQuantidade === 0) {

            console.log(
                "ℹ️ Primeira leitura das notificações. Som não será reproduzido."
            );

        }


        ultimaQuantidade =
            notificacoes.length;


        // ==================================
        // ATUALIZAR CONTADOR
        // ==================================

        if (contador) {

            contador.innerText =
                notificacoes.length;

        }


        // ==================================
        // ATUALIZAR LISTA
        // ==================================

        if (lista) {

            lista.innerHTML = "";

            notificacoes.forEach(
                notificacao => {

                    lista.innerHTML += `

                    <div class="notification-card">

                        <h4>
                            ${notificacao.titulo}
                        </h4>

                        <p>
                            ${notificacao.mensagem}
                        </p>

                        <small>
                            ${notificacao.data}
                        </small>

                    </div>

                    `;

                }
            );

        }


    } catch (error) {

        console.error(
            "❌ Erro ao buscar notificações:",
            error
        );

    }
}


// ==========================================
// NOTIFICAÇÃO NATIVA DO NAVEGADOR
// ==========================================

function mostrarNotificacaoNavegador(
    notificacao
) {

    console.log(
        "🔔 Tentando mostrar notificação nativa..."
    );


    // Verifica suporte
    if (!("Notification" in window)) {

        console.warn(
            "⚠️ Este navegador não suporta notificações."
        );

        return;
    }


    // Verifica permissão
    if (Notification.permission !== "granted") {

        console.warn(
            "⚠️ Permissão de notificações não concedida."
        );

        console.warn(
            "Clique no botão de notificações para conceder permissão."
        );

        return;
    }


    try {

        const titulo =
            notificacao.titulo ||
            "YOFI - MYA";


        const mensagem =
            notificacao.mensagem ||
            "Você recebeu uma nova notificação.";


        const notificacaoNativa =
            new Notification(
                titulo,
                {
                    body: mensagem,
                    icon: "../Imagens-Audios/logo.png",
                    tag: "yofi-notificacao"
                }
            );


        console.log(
            "✅ Notificação nativa enviada!"
        );


        notificacaoNativa.onclick = () => {

            console.log(
                "🔔 Notificação clicada."
            );

            window.focus();

            notificacaoNativa.close();

        };


    } catch (erro) {

        console.error(
            "❌ Erro ao criar notificação nativa:",
            erro
        );

    }
}


// ==========================================
// INICIAR MONITORAMENTO
// ==========================================

console.log(
    "🚀 Sistema de notificações da MYA iniciado."
);


// Primeira consulta
carregarNotificacoes();


// Verificar a cada 10 segundos
setInterval(
    carregarNotificacoes,
    10000
);


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
