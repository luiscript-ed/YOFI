// ============================================================
// CONFIGURAÇÃO
// ============================================================

const API_URL = "https://yofi-api.onrender.com";

let usuario = null;
let usuarioId = null;

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

const notificationBtn =
    document.getElementById("notificationBtn");

const notificationPanel =
    document.getElementById("notificationPanel");


// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

function formatarMoeda(valor) {

    const numero = Number(valor) || 0;

    return `R$ ${numero.toFixed(2)}`;
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


// ============================================================
// SIDEBAR
// ============================================================

if (menuBtn && sidebar && app) {

    menuBtn.addEventListener("click", () => {

        sidebar.classList.toggle("closed");
        app.classList.toggle("sidebar-closed");

    });

}


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
                resposta.status
            );

            return false;
        }

        usuario = dados;

        usuarioId =
            usuario.usuario_id ??
            usuario.id ??
            usuario.user_id;

        if (!usuarioId) {

            console.error(
                "O endpoint /me não retornou o ID do usuário.",
                usuario
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
// DASHBOARD
// ============================================================

async function carregarDashboard() {

    if (!usuarioId) {
        return null;
    }

    try {

        const { resposta, dados } =
            await apiGet(
                `/dashboard/${usuarioId}`
            );

        if (!resposta.ok) {

            console.error(
                "Erro no dashboard:",
                resposta.status,
                dados
            );

            return null;
        }

        const saldo =
            Number(
                dados?.saldo ??
                dados?.saldo_atual ??
                0
            );

        const ganhos =
            Number(
                dados?.total_ganhos ??
                dados?.ganhos ??
                dados?.total_entradas ??
                0
            );

        const gastos =
            Number(
                dados?.total_gastos ??
                dados?.gastos ??
                dados?.total_despesas ??
                0
            );


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
// ECONOMIA
// ============================================================

function atualizarEconomia(
    receitas,
    despesas
) {

    receitas = Number(receitas) || 0;
    despesas = Number(despesas) || 0;

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
// TRANSAÇÕES
// ============================================================

async function carregarTransacoes() {

    if (!usuarioId) {
        return [];
    }

    try {

        const { resposta, dados } =
            await apiGet(
                `/transacoes/${usuarioId}`
            );

        if (!resposta.ok) {

            console.error(
                "Erro nas transações:",
                resposta.status,
                dados
            );

            return [];
        }

        const transacoes =
            Array.isArray(dados)
                ? dados
                : (
                    dados?.transacoes ||
                    dados?.data ||
                    []
                );


        const container =
            document.getElementById(
                "lista-transacoes"
            );


        if (!container) {
            return transacoes;
        }


        container.innerHTML = "";


        if (transacoes.length === 0) {

            container.innerHTML = `
                <div class="sem-transacoes">
                    Nenhuma transação encontrada.
                </div>
            `;

            return transacoes;
        }


        const ultimasTres =
            transacoes.slice(0, 3);


        ultimasTres.forEach(
            transacao => {

                const tipo =
                    String(
                        transacao.tipo || ""
                    ).toLowerCase();


                const ganho =
                    tipo === "ganho" ||
                    tipo === "entrada" ||
                    tipo === "receita";


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
            }
        );


        return transacoes;

    } catch (erro) {

        console.error(
            "Erro ao carregar transações:",
            erro
        );

        return [];
    }
}


// ============================================================
// GRÁFICO DE CATEGORIAS
// ============================================================

async function carregarGraficoCategorias() {

    if (!usuarioId) {
        return;
    }

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


    try {

        const { resposta, dados } =
            await apiGet(
                `/grafico-categorias/${usuarioId}`
            );


        if (!resposta.ok) {

            console.error(
                "Erro no gráfico de categorias:",
                resposta.status,
                dados
            );

            return;
        }


        let categorias = [];


        if (Array.isArray(dados)) {

            categorias = dados;

        } else if (
            Array.isArray(
                dados?.categorias
            )
        ) {

            categorias =
                dados.categorias;

        } else if (
            Array.isArray(
                dados?.data
            )
        ) {

            categorias =
                dados.data;

        }


        const labels =
            categorias.map(
                item =>
                    item.categoria ??
                    item.nome ??
                    "Sem categoria"
            );


        const valores =
            categorias.map(
                item =>
                    Number(
                        item.total ??
                        item.valor ??
                        item.quantidade ??
                        0
                    )
            );


        if (graficoCategorias) {

            graficoCategorias.destroy();
            graficoCategorias = null;

        }


        if (valores.length === 0) {

            console.warn(
                "Nenhum dado encontrado para o gráfico de categorias."
            );

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

    } catch (erro) {

        console.error(
            "Erro ao carregar gráfico de categorias:",
            erro
        );

    }
}


// ============================================================
// GRÁFICO DE EVOLUÇÃO DAS DESPESAS
// ============================================================

async function criarGraficoEvolucaoDespesas(
    transacoes = null
) {

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


    try {

        if (!transacoes) {

            transacoes =
                await carregarTransacoes();

        }


        if (!Array.isArray(transacoes)) {

            transacoes = [];

        }


        const despesasPorDia = {};


        transacoes.forEach(
            transacao => {

                const tipo =
                    String(
                        transacao.tipo || ""
                    ).toLowerCase();


                const ehDespesa =
                    tipo === "gasto" ||
                    tipo === "despesa" ||
                    tipo === "saida";


                if (!ehDespesa) {
                    return;
                }


                const dataOriginal =
                    transacao.data ||
                    transacao.created_at ||
                    transacao.data_criacao;


                if (!dataOriginal) {
                    return;
                }


                const data =
                    new Date(dataOriginal);


                if (
                    Number.isNaN(
                        data.getTime()
                    )
                ) {
                    return;
                }


                if (
                    data.getMonth() !==
                    mesSelecionado ||
                    data.getFullYear() !==
                    anoSelecionado
                ) {

                    return;
                }


                const dia =
                    data.getDate();


                const valor =
                    Number(
                        transacao.valor
                    ) || 0;


                despesasPorDia[dia] =
                    (
                        despesasPorDia[dia] ||
                        0
                    ) + valor;

            }
        );


        const ultimoDia =
            new Date(
                anoSelecionado,
                mesSelecionado + 1,
                0
            ).getDate();


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
                Number(
                    despesasPorDia[dia] || 0
                )
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
                                label:
                                    "Despesas",

                                data:
                                    valores,

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

                                    color:
                                        "#a8a5b0"
                                },

                                grid: {

                                    color:
                                        "rgba(255,255,255,0.05)"
                                }
                            },

                            y: {

                                beginAtZero: true,

                                ticks: {

                                    color:
                                        "#a8a5b0",

                                    callback:
                                        valor =>
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

    } catch (erro) {

        console.error(
            "Erro ao criar gráfico de evolução:",
            erro
        );

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
            "❌ Erro ao carregar áudio da MYA:",
            erro
        );

        console.error(
            "❌ Caminho:",
            somMYA.src
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

        console.log(
            "✅ Áudio da MYA liberado."
        );

        return true;

    } catch (erro) {

        audioPermitido = false;

        console.warn(
            "⚠️ Áudio ainda não liberado:",
            erro
        );

        return false;
    }
}


document.addEventListener(
    "click",
    ativarAudio,
    {
        once: true
    }
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

        return (
            permissao ===
            "granted"
        );

    } catch (erro) {

        console.error(
            "Erro ao solicitar permissão:",
            erro
        );

        return false;
    }
}


// ============================================================
// BOTÃO DE NOTIFICAÇÕES
// ============================================================

if (
    notificationBtn &&
    notificationPanel
) {

    notificationBtn.addEventListener(
        "click",
        async () => {

            await ativarAudio();

            await solicitarPermissaoNotificacao();

            notificationPanel
                .classList
                .toggle("hidden");

        }
    );

}


// ============================================================
// NOTIFICAÇÕES
// ============================================================

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
                : (
                    dados?.notificacoes ||
                    dados?.data ||
                    []
                );


        const lista =
            document.getElementById(
                "notificationList"
            );

        const contador =
            document.getElementById(
                "notificationCount"
            );


        if (contador) {

            contador.textContent =
                notificacoes.length;

        }


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


        if (!lista) {
            return;
        }


        lista.innerHTML = "";


        if (
            notificacoes.length === 0
        ) {

            lista.innerHTML = `
                <div class="notification-empty">
                    Nenhuma notificação.
                </div>
            `;

            return;
        }


        notificacoes.forEach(
            notificacao => {

                lista.innerHTML += `
                    <div class="notification-item">
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


async function mudarMes(
    direcao
) {

    mesSelecionado += direcao;


    if (
        mesSelecionado < 0
    ) {

        mesSelecionado = 11;
        anoSelecionado--;

    }


    if (
        mesSelecionado > 11
    ) {

        mesSelecionado = 0;
        anoSelecionado++;

    }


    atualizarMesNaTela();


    const transacoes =
        await carregarTransacoes();


    await carregarDashboard();

    await carregarGraficoCategorias();

    await criarGraficoEvolucaoDespesas(
        transacoes
    );
}


const mesAnteriorBtn =
    document.getElementById(
        "mesAnterior"
    );


if (mesAnteriorBtn) {

    mesAnteriorBtn.addEventListener(
        "click",
        () => mudarMes(-1)
    );

}


const proximoMesBtn =
    document.getElementById(
        "proximoMes"
    );


if (proximoMesBtn) {

    proximoMesBtn.addEventListener(
        "click",
        () => mudarMes(1)
    );

}


// ============================================================
// MYA - ANÁLISE FINANCEIRA
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
                        "Erro na análise financeira:",
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
// MYA - GASTOS
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
                        : (
                            Array.isArray(dados)
                                ? dados
                                : []
                        );


                let html =
                    "<h4>📊 Categorias com maiores gastos</h4>";


                if (
                    categorias.length === 0
                ) {

                    html +=
                        "<p>Nenhuma categoria encontrada.</p>";

                } else {

                    categorias.forEach(
                        categoria => {

                            const nome =
                                categoria.categoria ||
                                categoria.nome ||
                                "Sem categoria";


                            const valor =
                                Number(
                                    categoria.valor ??
                                    categoria.total ??
                                    0
                                );


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
// LINKS DA SIDEBAR
// ============================================================

const linksSidebar =
    document.querySelectorAll(
        ".sidebar-link"
    );


linksSidebar.forEach(
    link => {

        link.addEventListener(
            "click",
            () => {

                linksSidebar.forEach(
                    item => {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                link.classList.add(
                    "active"
                );


                if (
                    window.innerWidth <= 800 &&
                    sidebar
                ) {

                    sidebar.classList.add(
                        "closed"
                    );

                    if (app) {

                        app.classList.add(
                            "sidebar-closed"
                        );

                    }

                }

            }
        );

    }
);


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
// URL ATUAL
// ============================================================

function salvarUrlAtual() {

    const urlAtual =
        window.location.href;

    localStorage.setItem(
        "urlSalva",
        urlAtual
    );

    console.log(
        "URL salva com sucesso:",
        urlAtual
    );
}


salvarUrlAtual();


// ============================================================
// GRÁFICOS
// ============================================================

async function carregarGraficos() {

    const transacoes =
        await carregarTransacoes();


    await carregarGraficoCategorias();


    await criarGraficoEvolucaoDespesas(
        transacoes
    );
}


// ============================================================
// INICIAR PÁGINA
// ============================================================

async function iniciarPagina() {

    console.log(
        "🚀 Iniciando YOFI..."
    );


    const autenticado =
        await verificarLogin();


    if (!autenticado) {

        console.warn(
            "⚠️ Página interrompida: usuário não autenticado."
        );

        return;
    }


    atualizarMesNaTela();


    await carregarDashboard();


    await carregarGraficos();


    await carregarNotificacoes();


    console.log(
        "✅ Dashboard carregado."
    );

}


iniciarPagina();


// ============================================================
// MONITORAMENTO DAS NOTIFICAÇÕES
// ============================================================

setInterval(
    carregarNotificacoes,
    100000
);