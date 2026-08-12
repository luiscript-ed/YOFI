// ============================================================
// CONFIGURAÇÃO
// ============================================================

function salvarUrlAtual() {
    const urlAtual = window.location.href;
    localStorage.setItem('urlSalva', urlAtual);
    console.log('URL salva com sucesso:', urlAtual);
}

salvarUrlAtual();

const API_URL = "https://yofi-api.onrender.com";

let usuario = null;

let mesSelecionado = new Date().getMonth();
let anoSelecionado = new Date().getFullYear();

let graficoCategorias = null;
let graficoEvolucao = null;


// ============================================================
// ELEMENTOS
// ============================================================

const sidebar = document.getElementById("sidebar");
const app = document.querySelector(".app");
const menuBtn = document.getElementById("menuBtn");

menuBtn.addEventListener("click", () => {

    sidebar.classList.toggle("closed");
    app.classList.toggle("sidebar-closed");

});

const usuarioNome = document.getElementById("usuarioNome");
const usuarioEmail = document.getElementById("usuarioEmail");

const mesAtual = document.getElementById("mesAtual");
const anoAtual = document.getElementById("anoAtual");

const resultadoMYA =
document.getElementById("myaResultado");

let usuarioId = null;

// ============================================================
// AUTENTICAÇÃO
// ============================================================

async function verificarLogin() {

    try {

        const resposta = await fetch(
            `${API_URL}/me`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        if (!resposta.ok) {

            console.warn(
                "Usuário não autenticado."
            );

            window.location.href =
                "https://luiscript-ed.github.io/YOFI/Front-end/autentification/autentification";
            return false;
        }

        usuario = await resposta.json();

        console.log(
            "Usuário autenticado:",
            usuario
        );

        usuarioNome.textContent =
            usuario.nome || "Usuário";

        usuarioEmail.textContent =
            usuario.email || "";

        return true;

    } catch (erro) {

        console.error(
            "Erro ao verificar autenticação:",
            erro
        );

        window.location.href =
        "https://luiscript-ed.github.io/YOFI/Front-end/autentification/autentification";

        return false;
    }
}


// ============================================================
// DASHBOARD
// ============================================================

async function carregarDashboard() {

    try {

        const resposta = await fetch(
            `${API_URL}/dashboard`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        if (!resposta.ok) {

            console.error(
                "Erro no dashboard:",
                resposta.status
            );

            return null;
        }

        const dados =
            await resposta.json();

        const saldo =
            Number(dados.saldo);

        const ganhos =
            Number(dados.total_ganhos);

        const gastos =
            Number(dados.total_gastos);


        document.getElementById("saldo").textContent =
            `R$ ${saldo.toFixed(2)}`;

        document.getElementById("ganhos").textContent =
            `R$ ${ganhos.toFixed(2)}`;

        document.getElementById("gastos").textContent =
            `R$ ${gastos.toFixed(2)}`;


        // ==========================================
        // ECONOMIA
        // ==========================================

        atualizarEconomia(
            ganhos,
            gastos
        );


        return dados;

    } catch (erro) {

        console.error(
            "Erro ao carregar dashboard:",
            erro
        );

        return null;
    }
}

// ============================================================
// ECONOMIA MENSAL
// ============================================================

function atualizarEconomia(
    receitas,
    despesas
) {

    const valorEconomizado =
        receitas - despesas;

    let taxa = 0;

    if (receitas > 0) {

        taxa =
            (valorEconomizado / receitas) * 100;

    }

    taxa =
        Math.max(
            0,
            Math.min(
                100,
                taxa
            )
        );


    document.getElementById(
        "economiaReceitas"
    ).textContent =
        `R$ ${receitas.toFixed(2)}`;


    document.getElementById(
        "economiaDespesas"
    ).textContent =
        `R$ ${despesas.toFixed(2)}`;


    document.getElementById(
        "taxaEconomia"
    ).textContent =
        `${taxa.toFixed(1)}%`;


    document.getElementById(
        "valorEconomizado"
    ).textContent =
        `R$ ${Math.max(
            0,
            valorEconomizado
        ).toFixed(2)}`;


    document.getElementById(
        "economiaProgressBar"
    ).style.width =
        `${taxa}%`;
}

// ============================================================
// TRANSAÇÕES
// ============================================================

async function carregarTransacoes() {

    try {

        const resposta = await fetch(
            `${API_URL}/transacoes`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        if (!resposta.ok) {

            console.error(
                "Erro nas transações:",
                resposta.status
            );

            return;
        }

        const transacoes =
            await resposta.json();

        const container =
            document.getElementById(
                "lista-transacoes"
            );

        container.innerHTML = "";


        if (
            !transacoes ||
            transacoes.length === 0
        ) {

            container.innerHTML = `
                <div class="sem-transacoes">
                    Nenhuma transação encontrada.
                </div>
            `;

            return;
        }


        const ultimasTres =
            transacoes.slice(0, 3);


        ultimasTres.forEach(
            transacao => {

                const ganho =
                    transacao.tipo === "ganho";

                const classe =
                    ganho
                        ? "ganho"
                        : "gasto";

                const sinal =
                    ganho
                        ? "+"
                        : "-";


                container.innerHTML += `

                    <div class="transacao">

                        <div>

                            <strong>
                                ${transacao.categoria}
                            </strong>

                            <br>

                            <small>
                                ${transacao.descricao || "Sem descrição"}
                            </small>

                        </div>

                        <div class="${classe}">

                            ${sinal}
                            R$
                            ${Number(
                                transacao.valor
                            ).toFixed(2)}

                        </div>

                    </div>

                `;
            }
        );

    } catch (erro) {

        console.error(
            "Erro ao carregar transações:",
            erro
        );

    }
}

// ============================================================
// GRÁFICO DE CATEGORIAS
// ============================================================

async function carregarGraficoCategorias() {

    try {

        const resposta = await fetch(
            `${API_URL}/grafico-categorias`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        if (!resposta.ok) {

            console.error(
                "Erro no gráfico:",
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
                item => Number(item.total)
            );


        const canvas =
            document.getElementById(
                "graficoCategorias"
            );


        if (!canvas) {
            return;
        }


        if (graficoCategorias) {

            graficoCategorias.destroy();

        }


        graficoCategorias =
            new Chart(
                canvas,
                {

                    type: "doughnut",

                    data: {

                        labels,

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

                                ],

                                borderWidth: 0

                            }

                        ]

                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio: true,

                        plugins: {

                            legend: {

                                position: "bottom",

                                labels: {

                                    color: "#f5f5f7",

                                    padding: 16

                                }

                            }

                        }

                    }

                }
            );

    } catch (erro) {

        console.error(
            "Erro ao carregar gráfico:",
            erro
        );

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




// ============================================================
// NOTIFICAÇÕES
// ============================================================

let ultimaNotificacaoId = null;

async function carregarNotificacoes() {

    try {

        const resposta = await fetch(
            `${API_URL}/notificacoes`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        if (!resposta.ok) {

            console.error(
                "Erro nas notificações:",
                resposta.status
            );

            return;
        }

        const notificacoes =
            await resposta.json();

        const lista =
            document.getElementById(
                "notificationList"
            );

        const contador =
            document.getElementById(
                "notificationCount"
            );


        contador.textContent =
            notificacoes.length;


        // ==========================================
        // NOVA NOTIFICAÇÃO
        // ==========================================

        if (
            notificacoes.length > 0 &&
            ultimaNotificacaoId !== null &&
            notificacoes[0].id > ultimaNotificacaoId
        ) {

            console.log(
                "🔔 Nova notificação!"
            );

            // Se sua função existir
            if (
                typeof tocarSomMYA ===
                "function"
            ) {

                tocarSomMYA();

            }

            if (
                typeof mostrarNotificacaoNavegador ===
                "function"
            ) {

                mostrarNotificacaoNavegador(
                    notificacoes[0]
                );

            }
        }


        if (
            notificacoes.length > 0
        ) {

            ultimaNotificacaoId =
                notificacoes[0].id;

        }


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

    } catch (erro) {

        console.error(
            "Erro ao carregar notificações:",
            erro
        );
    }
}


// Abrir / fechar painel

if (notificationBtn) {

    notificationBtn.addEventListener(
        "click",
        () => {

            notificationPanel
                .classList
                .toggle("hidden");

        }
    );

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
    100000
);

// ============================================================
// MESES
// ============================================================

const nomesMeses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro"
];


function atualizarMesNaTela() {

    mesAtual.textContent =
        nomesMeses[mesSelecionado];

    anoAtual.textContent =
        anoSelecionado;

    console.log(
        "Mês selecionado:",
        nomesMeses[mesSelecionado],
        anoSelecionado
    );

    // Futuramente:
    // carregarDashboardMensal();
    // carregarEvolucaoMensal();
}


// MÊS ANTERIOR

document
    .getElementById("mesAnterior")
    .addEventListener("click", async () => {

        mesSelecionado--;

        if (mesSelecionado < 0) {

            mesSelecionado = 11;
            anoSelecionado--;

        }

        atualizarMesNaTela();

        await carregarDashboard();

        await carregarGraficos();

    });


// PRÓXIMO MÊS

document
    .getElementById("proximoMes")
    .addEventListener("click", async () => {

        mesSelecionado++;

        if (mesSelecionado > 11) {

            mesSelecionado = 0;
            anoSelecionado++;

        }

        atualizarMesNaTela();

        await carregarDashboard();

        await carregarGraficos();

    });

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


// Fechar sidebar ao clicar em um link no celular

const linksSidebar =
    document.querySelectorAll(".sidebar-link");

linksSidebar.forEach(link => {

    link.addEventListener("click", () => {

        if (window.innerWidth <= 800) {

            sidebar.classList.remove("open");

        }

    });

});

// ============================================================
// LINKS DA SIDEBAR
// ============================================================

document
    .querySelectorAll(".sidebar-link")
    .forEach(link => {

        link.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".sidebar-link"
                    )
                    .forEach(
                        item =>
                            item.classList
                                .remove("active")
                    );

                link.classList.add(
                    "active"
                );

            }
        );

    });

// ============================================================
// PAINEL DA IA (IA-SIDEBAR)
// ============================================================

// Seleciona os elementos do HTML
const abrirIABtn = document.getElementById('abrirIA');
const fecharIABtn = document.getElementById('fecharIA');
const painelIA = document.getElementById('painelIA');

// Função para abrir o painel da IA
abrirIABtn.addEventListener('click', () => {
    painelIA.classList.add('active'); // Ou remova a classe 'hidden' se estiver usando CSS assim
});

// Função para FECHAR o painel da IA (AQUI ESTÁ O QUE FALTA)
fecharIABtn.addEventListener('click', () => {
    painelIA.classList.remove('active');
});

// ============================================================
// GRÁFICOS
// ============================================================

async function carregarGraficos() {

    await carregarGraficoCategorias();

    criarGraficoEvolucaoDespesas();

}

// ============================================================
// INICIAR PÁGINA
// ============================================================

async function iniciarPagina() {

    const autenticado =
        await verificarLogin();

    if (!autenticado) {
        return;
    }


    atualizarMesNaTela();


    await carregarDashboard();

    await carregarTransacoes();

    await carregarNotificacoes();

    await carregarGraficos();


    // Atualizar notificações periodicamente

    setInterval(
        carregarNotificacoes,
        10000
    );

}

iniciarPagina();
