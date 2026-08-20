// ============================================================
// CONFIGURAÇÃO
// ============================================================

const API_URL = "https://yofi-api.onrender.com";

let usuario = null;
let usuarioId = null;
let dashboardAtual = null;

let mesSelecionado = new Date().getMonth();
let anoSelecionado = new Date().getFullYear();

let graficoCategorias = null;
let graficoEvolucao = null;

let ultimaNotificacaoId = null;
let audioPermitido = false;


// ============================================================
// ELEMENTOS
// ============================================================

const sidebar = document.getElementById("sidebar");
const app = document.querySelector(".app");
const menuBtn = document.getElementById("menuBtn");

const usuarioNome = document.getElementById("usuarioNome");
const usuarioEmail = document.getElementById("usuarioEmail");

const mesAtual = document.getElementById("mesAtual");
const anoAtual = document.getElementById("anoAtual");

const resultadoMYA = document.getElementById("myaResultado");
const MYAGIF = document.querySelectorAll("MYAload");

if (MYAGIF) {
    MYAGIF.classList.add("active");
}



const notificationBtn =
    document.getElementById("notificationBtn");

const notificationPanel =
    document.getElementById("notificationPanel");

const notificationList =
    document.getElementById("notificationList");

const notificationCount =
    document.getElementById("notificationCount");


// ============================================================
// UTILIDADES
// ============================================================

function formatarMoeda(valor) {
    return `R$ ${(Number(valor) || 0).toFixed(2)}`;
}


async function obterJSON(resposta) {
    const texto = await resposta.text();

    if (!texto) {
        return null;
    }

    try {
        return JSON.parse(texto);
    } catch {
        return texto;
    }
}


function escaparHTML(valor) {
    if (valor === null || valor === undefined) {
        return "";
    }

    return String(valor)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


async function apiGet(endpoint) {
    const resposta = await fetch(
        `${API_URL}${endpoint}`,
        {
            method: "GET",
            credentials: "include",
            headers: {
                "Accept": "application/json"
            }
        }
    );

    const dados = await obterJSON(resposta);

    return {
        resposta,
        dados
    };
}


async function apiDelete(endpoint) {
    const resposta = await fetch(
        `${API_URL}${endpoint}`,
        {
            method: "DELETE",
            credentials: "include",
            headers: {
                "Accept": "application/json"
            }
        }
    );

    const dados = await obterJSON(resposta);

    return {
        resposta,
        dados
    };
}


// ============================================================
// SIDEBAR
// ============================================================

if (menuBtn && sidebar && app) {
    menuBtn.addEventListener("click", () => {
        sidebar.classList.toggle("closed");
        app.classList.toggle("sidebar-closed");
    });
}


document
    .querySelectorAll(".sidebar-link")
    .forEach(link => {
        link.addEventListener("click", () => {

            document
                .querySelectorAll(".sidebar-link")
                .forEach(item => {
                    item.classList.remove("active");
                });

            link.classList.add("active");

            if (
                window.innerWidth <= 800 &&
                sidebar &&
                app
            ) {
                sidebar.classList.add("closed");
                app.classList.add("sidebar-closed");
            }
        });
    });


// ============================================================
// AUTENTICAÇÃO
// ============================================================

async function verificarLogin() {
    try {
        const { resposta, dados } =
            await apiGet("/me");

        if (!resposta.ok) {
            console.warn(
                "Usuário não autenticado:",
                resposta.status,
                dados
            );

            return false;
        }

        usuario = dados;
        usuarioId = usuario.usuario_id;

        if (!usuarioId) {
            console.error(
                "O endpoint /me não retornou usuario_id."
            );

            return false;
        }

        console.log(
            "Usuário autenticado:",
            usuario
        );

        console.log(
            "ID do usuário:",
            usuarioId
        );

        if (usuarioNome) {
            usuarioNome.textContent =
                usuario.nome || "Usuário";
        }

        if (usuarioEmail) {
            usuarioEmail.textContent =
                usuario.email || "";
        }

        return true;

    } catch (erro) {
        console.error(
            "Erro ao verificar autenticação:",
            erro
        );

        return false;
    }
}


// ============================================================
// DASHBOARD PRINCIPAL
// ============================================================

async function carregarDashboard() {
    try {
        const { resposta, dados } =
            await apiGet(
                `/dashboard?mes=${mesSelecionado + 1}&ano=${anoSelecionado}`
            );

        if (!resposta.ok) {
            console.error(
                "Erro no dashboard:",
                resposta.status,
                dados
            );

            dashboardAtual = null;
            return null;
        }

        dashboardAtual = dados;

        renderizarResumo(dados);
        renderizarEconomia(dados);

        return dados;

    } catch (erro) {
        console.error(
            "Erro ao carregar dashboard:",
            erro
        );

        dashboardAtual = null;
        return null;
    }
}


// ============================================================
// RESUMO
// ============================================================

function renderizarResumo(dados) {
    const resumo = dados?.resumo || {};

    const saldo =
        Number(resumo.saldo) || 0;

    const ganhos =
        Number(resumo.ganhos) || 0;

    const gastos =
        Number(resumo.gastos) || 0;


    const elementoSaldo =
        document.getElementById("saldo");

    const elementoGanhos =
        document.getElementById("ganhos");

    const elementoGastos =
        document.getElementById("gastos");


    if (elementoSaldo) {
        elementoSaldo.textContent =
            formatarMoeda(saldo);
    }

    if (elementoGanhos) {
        elementoGanhos.textContent =
            formatarMoeda(ganhos);
    }

    if (elementoGastos) {
        elementoGastos.textContent =
            formatarMoeda(gastos);
    }
}


// ============================================================
// ECONOMIA
// ============================================================

function renderizarEconomia(dados) {
    const economia =
        dados?.economia || {};

    const receitas =
        Number(economia.receitas) || 0;

    const despesas =
        Number(economia.despesas) || 0;

    const valorEconomizado =
        Number(economia.valor_economizado) || 0;

    const taxa =
        Math.max(
            0,
            Math.min(
                100,
                Number(economia.taxa) || 0
            )
        );


    const economiaReceitas =
        document.getElementById(
            "economiaReceitas"
        );

    const economiaDespesas =
        document.getElementById(
            "economiaDespesas"
        );

    const taxaEconomia =
        document.getElementById(
            "taxaEconomia"
        );

    const valorEconomizadoElemento =
        document.getElementById(
            "valorEconomizado"
        );

    const progressBar =
        document.getElementById(
            "economiaProgressBar"
        );


    if (economiaReceitas) {
        economiaReceitas.textContent =
            formatarMoeda(receitas);
    }

    if (economiaDespesas) {
        economiaDespesas.textContent =
            formatarMoeda(despesas);
    }

    if (taxaEconomia) {
        taxaEconomia.textContent =
            `${taxa.toFixed(1)}%`;
    }

    if (valorEconomizadoElemento) {
        valorEconomizadoElemento.textContent =
            formatarMoeda(
                Math.max(
                    0,
                    valorEconomizado
                )
            );
    }

    if (progressBar) {
        progressBar.style.width =
            `${taxa}%`;
    }
}


// ============================================================
// ÚLTIMAS TRANSAÇÕES
// ============================================================

function renderizarUltimasTransacoes(dados) {
    const container =
        document.getElementById(
            "lista-transacoes"
        );

    if (!container) {
        return;
    }

    const transacoes =
        Array.isArray(
            dados?.ultimas_transacoes
        )
            ? dados.ultimas_transacoes
            : [];


    container.innerHTML = "";


    if (!transacoes.length) {
        container.innerHTML = `
            <div class="sem-transacoes">
                Nenhuma transação encontrada.
            </div>
        `;

        return;
    }


    transacoes
        .slice(0, 3)
        .forEach(transacao => {

            const tipo =
                String(
                    transacao.tipo || ""
                ).toLowerCase();

            const ganho =
                tipo === "ganho";

            const classe =
                ganho
                    ? "ganho"
                    : "gasto";

            const sinal =
                ganho
                    ? "+"
                    : "-";

            const categoria =
                escaparHTML(
                    transacao.categoria ||
                    "Sem categoria"
                );

            const descricao =
                escaparHTML(
                    transacao.descricao ||
                    "Sem descrição"
                );

            const valor =
                Number(
                    transacao.valor
                ) || 0;


            container.innerHTML += `
                <div class="transacao">
                    <div>
                        <strong>${categoria}</strong>
                        <br>
                        <small>${descricao}</small>
                    </div>

                    <div class="${classe}">
                        ${sinal} ${formatarMoeda(valor)}
                    </div>
                </div>
            `;
        });
}


// ============================================================
// GRÁFICO DE CATEGORIAS
// ============================================================

function carregarGraficoCategorias(dados) {
    const canvas =
        document.getElementById(
            "graficoCategorias"
        );

    if (!canvas) {
        return;
    }

    if (
        typeof Chart ===
        "undefined"
    ) {
        console.error(
            "Chart.js não foi carregado."
        );

        return;
    }


    const categorias =
        Array.isArray(
            dados?.categorias
        )
            ? dados.categorias
            : [];


    const labels =
        categorias.map(
            item =>
                item.categoria ||
                "Sem categoria"
        );


    const valores =
        categorias.map(
            item =>
                Number(
                    item.total
                ) || 0
        );


    if (graficoCategorias) {
        graficoCategorias.destroy();
        graficoCategorias = null;
    }


    if (!valores.length) {
        return;
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
                                "#10B981",
                                "#F59E0B",
                                "#EF4444",
                                "#EC4899",
                                "#14B8A6"
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
}


// ============================================================
// GRÁFICO DE EVOLUÇÃO
// ============================================================

function carregarGraficoEvolucao(dados) {
    const canvas =
        document.getElementById(
            "graficoEvolucaoDespesas"
        );

    if (!canvas) {
        return;
    }

    if (
        typeof Chart ===
        "undefined"
    ) {
        console.error(
            "Chart.js não foi carregado."
        );

        return;
    }


    const evolucao =
        Array.isArray(
            dados?.evolucao
        )
            ? dados.evolucao
            : [];


    const ultimoDia =
        new Date(
            anoSelecionado,
            mesSelecionado + 1,
            0
        ).getDate();


    const valoresPorDia = {};


    evolucao.forEach(item => {

        if (!item?.data) {
            return;
        }

        const data =
            new Date(item.data);

        if (
            Number.isNaN(
                data.getTime()
            )
        ) {
            return;
        }

        const dia =
            data.getDate();

        valoresPorDia[dia] =
            Number(item.total) || 0;
    });


    const labels = [];
    const valores = [];


    for (
        let dia = 1;
        dia <= ultimoDia;
        dia++
    ) {
        labels.push(
            String(dia).padStart(2, "0")
        );

        valores.push(
            valoresPorDia[dia] || 0
        );
    }


    if (graficoEvolucao) {
        graficoEvolucao.destroy();
        graficoEvolucao = null;
    }


    graficoEvolucao =
        new Chart(
            canvas,
            {
                type: "line",

                data: {
                    labels,

                    datasets: [
                        {
                            label: "Despesas",

                            data: valores,

                            borderColor:
                                "#A855F7",

                            backgroundColor:
                                "rgba(168, 85, 247, 0.12)",

                            borderWidth: 2,

                            tension: 0.35,

                            fill: true,

                            pointRadius: 3,

                            pointHoverRadius: 5
                        }
                    ]
                },

                options: {
                    responsive: true,
                    maintainAspectRatio: false,

                    interaction: {
                        intersect: false,
                        mode: "index"
                    },

                    plugins: {
                        legend: {
                            display: false
                        }
                    },

                    scales: {
                        x: {
                            ticks: {
                                color: "#a8a5b0"
                            },

                            grid: {
                                color:
                                    "rgba(255,255,255,0.05)"
                            }
                        },

                        y: {
                            beginAtZero: true,

                            ticks: {
                                color: "#a8a5b0",

                                callback: valor =>
                                    `R$ ${Number(valor).toFixed(0)}`
                            },

                            grid: {
                                color:
                                    "rgba(255,255,255,0.05)"
                            }
                        }
                    }
                }
            }
        );
}


// ============================================================
// CONTAS E CARTÕES
// ============================================================

function atualizarDadosFinanceiros(dados) {

    const contas =
        Array.isArray(dados?.contas)
            ? dados.contas
            : [];

    const cartoes =
        Array.isArray(dados?.cartoes)
            ? dados.cartoes
            : [];


    console.log(
        "Contas carregadas:",
        contas
    );

    console.log(
        "Cartões carregados:",
        cartoes
    );

    // Os dados ficam disponíveis em dashboardAtual.
    // Os elementos visuais específicos podem ser ligados
    // quando definirmos os IDs da Home.
}


// ============================================================
// RENDERIZAÇÃO CENTRAL
// ============================================================

function renderizarDashboard(dados) {
    if (!dados) {
        return;
    }

  if (MYAGIF) {
    MYAGIF.classList.add("active");
}


    renderizarResumo(dados);
    renderizarEconomia(dados);
    renderizarUltimasTransacoes(dados);
    atualizarDadosFinanceiros(dados);

    carregarGraficoCategorias(dados);
    carregarGraficoEvolucao(dados);

    if (MYAGIF) {
    MYAGIF.classList.remove("active");
}

}


// ============================================================
// ÁUDIO DA MYA
// ============================================================

const somMYA =
    new Audio(
        "../Imagens-Audios/somMya.mp3"
    );

somMYA.preload = "auto";


console.log(
    "🔊 Inicializando sistema de áudio..."
);

console.log(
    "🔊 Caminho do áudio:",
    somMYA.src
);


somMYA.addEventListener(
    "canplaythrough",
    () => {
        console.log(
            "✅ Áudio da MYA carregado corretamente."
        );
    }
);


somMYA.addEventListener(
    "error",
    erro => {
        console.error(
            "❌ Erro ao carregar o áudio da MYA:",
            erro
        );
    }
);


async function ativarAudio() {
    if (audioPermitido) {
        return true;
    }

    try {
        somMYA.volume = 0;

        await somMYA.play();

        somMYA.pause();
        somMYA.currentTime = 0;
        somMYA.volume = 1;

        audioPermitido = true;

        return true;

    } catch {
        audioPermitido = false;
        return false;
    }
}


document.addEventListener(
    "click",
    ativarAudio,
    { once: true }
);


async function tocarSomMYA() {
    if (!audioPermitido) {
        return;
    }

    try {
        somMYA.currentTime = 0;
        await somMYA.play();

    } catch (erro) {
        console.error(
            "Erro ao reproduzir som da MYA:",
            erro
        );
    }
}


// ============================================================
// NOTIFICAÇÕES DO NAVEGADOR
// ============================================================

async function solicitarPermissaoNotificacao() {

    if (
        !("Notification" in window)
    ) {
        return false;
    }

    if (
        Notification.permission ===
        "granted"
    ) {
        return true;
    }

    if (
        Notification.permission ===
        "denied"
    ) {
        return false;
    }

    try {
        const permissao =
            await Notification.requestPermission();

        return permissao === "granted";

    } catch (erro) {
        console.error(
            "Erro ao solicitar permissão:",
            erro
        );

        return false;
    }
}


function mostrarNotificacaoNavegador(
    notificacao
) {

    if (
        !("Notification" in window)
    ) {
        return;
    }

    if (
        Notification.permission !==
        "granted"
    ) {
        return;
    }

    try {
        const notificacaoNativa =
            new Notification(
                notificacao.titulo ||
                    "YOFI - MYA",
                {
                    body:
                        notificacao.mensagem ||
                        "Você recebeu uma nova notificação.",

                    icon:
                        "../Imagens-Audios/logo.png",

                    tag:
                        "yofi-notificacao"
                }
            );

        notificacaoNativa.onclick =
            () => {

                window.focus();

                notificacaoNativa.close();
            };

    } catch (erro) {
        console.error(
            "Erro na notificação nativa:",
            erro
        );
    }
}


// ============================================================
// NOTIFICAÇÕES
// ============================================================

async function carregarContadorNotificacoes() {
    try {
        const { resposta, dados } =
            await apiGet(
                "/notificacoes/contador"
            );

        if (!resposta.ok) {
            console.error(
                "Erro no contador:",
                resposta.status,
                dados
            );

            return;
        }

        if (notificationCount) {
            notificationCount.textContent =
                Number(
                    dados?.quantidade
                ) || 0;
        }

    } catch (erro) {
        console.error(
            "Erro ao carregar contador:",
            erro
        );
    }
}


async function carregarNotificacoes() {
    try {
        const { resposta, dados } =
            await apiGet(
                "/notificacoes"
            );

        if (!resposta.ok) {
            console.error(
                "Erro nas notificações:",
                resposta.status,
                dados
            );

            return;
        }

        const notificacoes =
            Array.isArray(dados)
                ? dados
                : [];


        if (
            notificacoes.length > 0 &&
            ultimaNotificacaoId !== null &&
            Number(
                notificacoes[0].id
            ) >
            Number(
                ultimaNotificacaoId
            )
        ) {

            await tocarSomMYA();

            mostrarNotificacaoNavegador(
                notificacoes[0]
            );
        }


        if (
            notificacoes.length > 0
        ) {
            ultimaNotificacaoId =
                notificacoes[0].id;
        }


        if (!notificationList) {
            return;
        }


        notificationList.innerHTML = "";


        if (!notificacoes.length) {

            notificationList.innerHTML = `
                <div class="notification-empty">
                    Nenhuma notificação.
                </div>
            `;

            return;
        }


        notificacoes.forEach(
            notificacao => {

                notificationList.innerHTML += `
                    <div class="notification-item"
                         data-id="${notificacao.id}">

                        <strong>
                            ${escaparHTML(
                                notificacao.titulo ||
                                "YOFI"
                            )}
                        </strong>
                        <p>
                            ${escaparHTML(
                                notificacao.mensagem ||
                                ""
                            )}
                        </p>

                        <small>
                            ${escaparHTML(
                                notificacao.data ||
                                ""
                            )}
                        </small>

                        <button
                            type="button"
                            class="btn-ler-notificacao"
                            data-id="${notificacao.id}"
                        >
                            Marcar como lida
                        </button>

                    </div>
                `;
            }
        );


        notificationList
            .querySelectorAll(
                ".btn-ler-notificacao"
            )
            .forEach(botao => {

                botao.addEventListener(
                    "click",
                    () => {

                        deletarNotificacao(
                            botao.dataset.id
                        );
                    }
                );

            });

    } catch (erro) {
        console.error(
            "Erro ao carregar notificações:",
            erro
        );
    }
}


async function deletarNotificacao(
    notificacaoId
) {

    if (!notificacaoId) {
        return;
    }

    try {

        const {
            resposta,
            dados
        } =
            await apiDelete(
                `/notificacoes/${notificacaoId}`
            );


        if (!resposta.ok) {
            console.error(
                "Erro ao remover notificação:",
                resposta.status,
                dados
            );

            return;
        }


        await carregarNotificacoes();
        await carregarContadorNotificacoes();

    } catch (erro) {
        console.error(
            "Erro ao remover notificação:",
            erro
        );
    }
}


if (
    notificationBtn &&
    notificationPanel
) {

    notificationBtn.addEventListener(
        "click",
        async () => {

            await ativarAudio();

            await solicitarPermissaoNotificacao();

            const estavaFechado =
                notificationPanel.classList.contains(
                    "hidden"
                );

            notificationPanel.classList.toggle(
                "hidden"
            );

            if (estavaFechado) {
                await carregarNotificacoes();
            }
        }
    );
}


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

    if (mesAtual) {
        mesAtual.textContent =
            nomesMeses[
                mesSelecionado
            ];
    }

    if (anoAtual) {
        anoAtual.textContent =
            anoSelecionado;
    }
}


async function atualizarMes(direcao) {

    mesSelecionado += direcao;


    if (mesSelecionado < 0) {
        mesSelecionado = 11;
        anoSelecionado--;
    }


    if (mesSelecionado > 11) {
        mesSelecionado = 0;
        anoSelecionado++;
    }


    atualizarMesNaTela();


    const dados =
        await carregarDashboard();

    if (!dados) {
        return;
    }


    renderizarDashboard(dados);
}


const mesAnteriorBtn =
    document.getElementById(
        "mesAnterior"
    );


if (mesAnteriorBtn) {
    mesAnteriorBtn.addEventListener(
        "click",
        () => atualizarMes(-1)
    );
}


const proximoMesBtn =
    document.getElementById(
        "proximoMes"
    );


if (proximoMesBtn) {
    proximoMesBtn.addEventListener(
        "click",
        () => atualizarMes(1)
    );
}


// ============================================================
// MYA - ANÁLISE
// ============================================================

const btnAnalise =
    document.getElementById(
        "btnAnalise"
    );


if (
    btnAnalise &&
    resultadoMYA
) {

    btnAnalise.addEventListener(
        "click",
        async () => {

            resultadoMYA.innerHTML =
                "<p>MYA está analisando...</p>";

            try {

                const {
                    resposta,
                    dados
                } =
                    await apiGet(
                        "/analise"
                    );


                if (!resposta.ok) {

                    console.error(
                        "Erro na análise:",
                        resposta.status,
                        dados
                    );

                    resultadoMYA.innerHTML =
                        "<p>Não foi possível gerar a análise.</p>";

                    return;
                }


                resultadoMYA.innerHTML = `
                    <h4>📊 Resumo Financeiro</h4>
                    <p>
                        ${escaparHTML(
                            dados?.analise ||
                            "A MYA não retornou uma análise."
                        )}
                    </p>
                `;

            } catch (erro) {

                console.error(
                    "Erro na análise:",
                    erro
                );

                resultadoMYA.innerHTML =
                    "<p>Erro ao gerar análise.</p>";
            }
        }
    );
}


// ============================================================
// MYA - CATEGORIAS
// ============================================================

const btnGastos =
    document.getElementById(
        "btnGastos"
    );


if (
    btnGastos &&
    resultadoMYA
) {

    btnGastos.addEventListener(
        "click",
        async () => {

            resultadoMYA.innerHTML =
                "<p>Analisando categorias...</p>";

            try {

                const {
                    resposta,
                    dados
                } =
                    await apiGet(
                        "/categorias"
                    );


                if (!resposta.ok) {

                    console.error(
                        "Erro nas categorias:",
                        resposta.status,
                        dados
                    );

                    resultadoMYA.innerHTML =
                        "<p>Não foi possível analisar as categorias.</p>";

                    return;
                }


                const categorias =
                    Array.isArray(
                        dados?.categorias
                    )
                        ? dados.categorias
                        : [];


                let html =
                    "<h4>📊 Categorias com maiores gastos</h4>";


                if (!categorias.length) {

                    html +=
                        "<p>Nenhuma categoria encontrada.</p>";

                } else {

                    categorias.forEach(
                        categoria => {

                            const nome =
                                categoria.categoria ||
                                "Sem categoria";

                            const valor =
                                Number(
                                    categoria.valor
                                ) || 0;


                            html += `
                                <p>
                                    <strong>
                                        ${escaparHTML(nome)}
                                    </strong>
                                    -
                                    ${formatarMoeda(valor)}
                                </p>
                            `;
                        }
                    );
                }


                resultadoMYA.innerHTML =
                    html;

            } catch (erro) {

                console.error(
                    "Erro ao analisar categorias:",
                    erro
                );

                resultadoMYA.innerHTML =
                    "<p>Erro ao analisar categorias.</p>";
            }
        }
    );
}


// ============================================================
// MYA - ECONOMIA
// ============================================================

const btnEconomia =
    document.getElementById(
        "btnEconomia"
    );


if (
    btnEconomia &&
    resultadoMYA
) {

    btnEconomia.addEventListener(
        "click",
        async () => {

            resultadoMYA.innerHTML =
                "<p>MYA está criando dicas...</p>";

            try {

                const {
                    resposta,
                    dados
                } =
                    await apiGet(
                        "/economia"
                    );


                if (!resposta.ok) {

                    console.error(
                        "Erro na economia:",
                        resposta.status,
                        dados
                    );

                    resultadoMYA.innerHTML =
                        "<p>Não foi possível gerar as dicas.</p>";

                    return;
                }


                resultadoMYA.innerHTML = `
                    <h4>🎯 Dicas da MYA</h4>
                    <p>
                        ${escaparHTML(
                            dados?.dicas ||
                            "A MYA não retornou dicas."
                        )}
                    </p>
                `;

            } catch (erro) {

                console.error(
                    "Erro ao gerar dicas:",
                    erro
                );

                resultadoMYA.innerHTML =
                    "<p>Erro ao gerar dicas.</p>";
            }
        }
    );
}


// ============================================================
// PAINEL DA IA
// ============================================================

const abrirIABtn =
    document.getElementById(
        "abrirIA"
    );

const fecharIABtn =
    document.getElementById(
        "fecharIA"
    );

const painelIA =
    document.getElementById(
        "painelIA"
    );


if (
    abrirIABtn &&
    painelIA
) {

    abrirIABtn.addEventListener(
        "click",
        () => {
            painelIA.classList.add(
                "active"
            );
        }
    );
}


if (
    fecharIABtn &&
    painelIA
) {

    fecharIABtn.addEventListener(
        "click",
        () => {
            painelIA.classList.remove(
                "active"
            );
        }
    );
}


// ============================================================
// URL
// ============================================================

function salvarUrlAtual() {

    localStorage.setItem(
        "urlSalva",
        window.location.href
    );

    console.log(
        "URL salva com sucesso:",
        window.location.href
    );
}


salvarUrlAtual();

// ======================================
// ADD GIF
// ======================================




// ============================================================
// INICIALIZAÇÃO
// ============================================================

async function iniciarPagina() {
    console.log("🚀 Iniciando YOFI...");

    const autenticado = await verificarLogin();

    if (!autenticado) {
        return;
    }

    if (MYAGIF) {
        MYAGIF.classList.add("active");
    }

    atualizarMesNaTela();

    const dados = await carregarDashboard();

    if (!dados) {
        if (MYAGIF) {
            MYAGIF.classList.remove("active");
        }

        return;
    }

    renderizarDashboard(dados);

    await carregarContadorNotificacoes();

    if (MYAGIF) {
        MYAGIF.classList.remove("active");
    }

    console.log("✅ Dashboard carregado.");
}



iniciarPagina();


// ============================================================
// MONITORAMENTO
// ============================================================

setInterval(
    async () => {

        await carregarContadorNotificacoes();

    },
    100000
);