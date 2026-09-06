// ============================================================
// CONFIGURAÇÃO
// ============================================================

const API_URL = "https://yofi-api.onrender.com";

const AUTH_URL =
    "https://luiscript-ed.github.io/YOFI/Front-end/autentification/autentification";

let usuario = null;
let usuarioId = null;

let mesSelecionado = new Date().getMonth();
let anoSelecionado = new Date().getFullYear();

let ultimaNotificacaoId = null;
let audioPermitido = false;


// ============================================================
// ELEMENTOS
// ============================================================

const sidebar =
    document.getElementById("sidebar");

const app =
    document.querySelector(".app");

const menuBtn =
    document.getElementById("menuBtn");

const usuarioNome =
    document.getElementById("usuarioNome");

const usuarioEmail =
    document.getElementById("usuarioEmail");

const usuarioImagem =
    document.getElementById("usuarioImagem");


const calMesAtual =
    document.getElementById("calMesAtual");

const calAnoAtual =
    document.getElementById("calAnoAtual");

const calMesAnterior =
    document.getElementById("calMesAnterior");

const calProximoMes =
    document.getElementById("calProximoMes");

const calendarDays =
    document.getElementById("calendarDays");


const notificationBtn =
    document.getElementById("notificationBtn");

const notificationPanel =
    document.getElementById("notificationPanel");

const notificationList =
    document.getElementById("notificationList");

const notificationCount =
    document.getElementById("notificationCount");


const transactionModal =
    document.getElementById("transactionModal");

const closeTransactionModal =
    document.getElementById("closeTransactionModal");

const transactionModalIcon =
    document.getElementById("transactionModalIcon");

const transactionModalTitle =
    document.getElementById("transactionModalTitle");

const transactionModalDate =
    document.getElementById("transactionModalDate");

const transactionModalType =
    document.getElementById("transactionModalType");

const transactionModalCategory =
    document.getElementById("transactionModalCategory");

const transactionModalValue =
    document.getElementById("transactionModalValue");

const transactionModalDescription =
    document.getElementById("transactionModalDescription");

const transactionModalSource =
    document.getElementById("transactionModalSource");


// ============================================================
// UTILIDADES
// ============================================================

function formatarMoeda(valor) {
    return `R$ ${(Number(valor) || 0).toFixed(2).replace(".", ",")}`;
}


async function obterJSON(resposta) {

    const texto =
        await resposta.text();

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

    if (
        valor === null ||
        valor === undefined
    ) {
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

    const resposta =
        await fetch(
            `${API_URL}${endpoint}`,
            {
                method: "GET",
                credentials: "include",
                headers: {
                    "Accept":
                        "application/json"
                }
            }
        );

    const dados =
        await obterJSON(resposta);

    return {
        resposta,
        dados
    };
}


// ============================================================
// SIDEBAR
// ============================================================

if (
    menuBtn &&
    sidebar &&
    app
) {

    menuBtn.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "closed"
            );

            app.classList.toggle(
                "sidebar-closed"
            );
        }
    );
}


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
                    .forEach(item => {

                        item.classList.remove(
                            "active"
                        );
                    });

                link.classList.add(
                    "active"
                );


                if (
                    window.innerWidth <= 800 &&
                    sidebar &&
                    app
                ) {

                    sidebar.classList.add(
                        "closed"
                    );

                    app.classList.add(
                        "sidebar-closed"
                    );
                }
            }
        );
    });


// ============================================================
// AUTENTICAÇÃO
// ============================================================

async function verificarLogin() {

    try {

        const {
            resposta,
            dados
        } = await apiGet("/me");


        if (!resposta.ok) {

            console.warn(
                "Usuário não autenticado:",
                resposta.status,
                dados
            );

            window.location.href =
                AUTH_URL;

            return false;
        }


        usuario = dados;

        usuarioId =
            usuario.usuario_id;


        if (!usuarioId) {

            console.error(
                "O endpoint /me não retornou usuario_id."
            );

            window.location.href =
                AUTH_URL;

            return false;
        }


        if (usuarioNome) {

            usuarioNome.textContent =
                usuario.nome ||
                "Usuário";
        }


        if (usuarioEmail) {

            usuarioEmail.textContent =
                usuario.email ||
                "";
        }


        if (usuarioImagem) {

            if (usuario.imagem) {

                usuarioImagem.src =
                    usuario.imagem;

                usuarioImagem.alt =
                    usuario.nome ||
                    "Foto do usuário";

            } else {

                usuarioImagem.src =
                    "../Imagens-Audios/404/usuarioGenerico.png";

                usuarioImagem.alt =
                    "Usuário";
            }
        }


        return true;

    } catch (erro) {

        console.error(
            "Erro ao verificar autenticação:",
            erro
        );

        window.location.href =
            AUTH_URL;

        return false;
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


const nomesDias = [

    "DOM",
    "SEG",
    "TER",
    "QUA",
    "QUI",
    "SEX",
    "SÁB"

];


function atualizarMesNaTela() {

    if (calMesAtual) {

        calMesAtual.textContent =
            nomesMeses[
                mesSelecionado
            ];
    }


    if (calAnoAtual) {

        calAnoAtual.textContent =
            anoSelecionado;
    }
}


// ============================================================
// DATA
// ============================================================

function formatarData(data) {

    if (!data) {
        return "-";
    }

    const objeto =
        new Date(data);

    if (
        Number.isNaN(
            objeto.getTime()
        )
    ) {
        return "-";
    }

    return objeto.toLocaleDateString(
        "pt-BR"
    );
}


function obterDataISO(data) {

    if (!data) {
        return null;
    }

    const objeto =
        new Date(data);

    if (
        Number.isNaN(
            objeto.getTime()
        )
    ) {
        return null;
    }

    return objeto;
}


function obterChaveDia(data) {

    const objeto =
        obterDataISO(data);

    if (!objeto) {
        return null;
    }

    const ano =
        objeto.getFullYear();

    const mes =
        String(
            objeto.getMonth() + 1
        ).padStart(2, "0");

    const dia =
        String(
            objeto.getDate()
        ).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}


// ============================================================
// TRANSAÇÕES
// ============================================================

async function carregarTransacoes() {

    try {

        const {
            resposta,
            dados
        } = await apiGet(
            `/transacoes`
        );


        if (!resposta.ok) {

            console.error(
                "Erro ao carregar transações:",
                resposta.status,
                dados
            );

            return [];
        }


        if (
            Array.isArray(dados)
        ) {
            return dados;
        }


        if (
            Array.isArray(
                dados?.transacoes
            )
        ) {
            return dados.transacoes;
        }


        return [];

    } catch (erro) {

        console.error(
            "Erro ao carregar transações:",
            erro
        );

        return [];
    }
}


// ============================================================
// TRANSAÇÕES RESERVADAS
// ============================================================

async function carregarTransacoesReservadas() {

    try {

        const {
            resposta,
            dados
        } = await apiGet(
            "/transacoes-reservadas"
        );


        if (!resposta.ok) {

            console.error(
                "Erro ao carregar transações reservadas:",
                resposta.status,
                dados
            );

            return [];
        }


        if (
            Array.isArray(dados)
        ) {
            return dados;
        }


        if (
            Array.isArray(
                dados?.transacoes
            )
        ) {
            return dados.transacoes;
        }


        if (
            Array.isArray(
                dados?.transacoes_reservadas
            )
        ) {
            return dados.transacoes_reservadas;
        }


        return [];

    } catch (erro) {

        console.error(
            "Erro ao carregar transações reservadas:",
            erro
        );

        return [];
    }
}


// ============================================================
// CUSTOS RECORRENTES
// ============================================================

async function carregarCustosRecorrentes() {

    try {

        const {
            resposta,
            dados
        } = await apiGet(
            "/custos-recorrentes"
        );


        if (!resposta.ok) {

            console.error(
                "Erro ao carregar custos:",
                resposta.status,
                dados
            );

            return [];
        }


        if (
            Array.isArray(dados)
        ) {
            return dados;
        }


        if (
            Array.isArray(
                dados?.custos
            )
        ) {
            return dados.custos;
        }


        if (
            Array.isArray(
                dados?.custos_recorrentes
            )
        ) {
            return dados.custos_recorrentes;
        }


        return [];

    } catch (erro) {

        console.error(
            "Erro ao carregar custos:",
            erro
        );

        return [];
    }
}


// ============================================================
// GERAÇÃO DE OCORRÊNCIAS DOS CUSTOS
// ============================================================

function ultimoDiaDoMes(
    ano,
    mes
) {

    return new Date(
        ano,
        mes + 1,
        0
    ).getDate();
}


function gerarDatasCusto(
    custo
) {

    const eventos = [];

    if (!custo) {
        return eventos;
    }


    const inicio =
        new Date(
            `${custo.data_inicio}T12:00:00`
        );


    if (
        Number.isNaN(
            inicio.getTime()
        )
    ) {
        return eventos;
    }


    let fim;

    if (custo.data_fim) {

        fim =
            new Date(
                `${custo.data_fim}T12:00:00`
            );

    } else {

        fim =
            new Date(
                anoSelecionado + 1,
                mesSelecionado,
                0,
                12
            );
    }


    if (
        custo.frequencia ===
        "mensal"
    ) {

        const dias =
            Array.isArray(
                custo.dias
            )
                ? custo.dias
                : [];


        if (!dias.length) {
            return eventos;
        }


        let cursor =
            new Date(
                inicio.getFullYear(),
                inicio.getMonth(),
                1,
                12
            );


        while (
            cursor <= fim
        ) {

            const ano =
                cursor.getFullYear();

            const mes =
                cursor.getMonth();

            const ultimo =
                ultimoDiaDoMes(
                    ano,
                    mes
                );


            dias.forEach(
                dia => {

                    const numero =
                        Math.min(
                            Number(dia),
                            ultimo
                        );


                    const data =
                        new Date(
                            ano,
                            mes,
                            numero,
                            12
                        );


                    if (
                        data >= inicio &&
                        data <= fim &&
                        data.getMonth() === mesSelecionado &&
                        data.getFullYear() === anoSelecionado
                    ) {

                        eventos.push({
                            id:
                                `custo-${custo.id}-${data.toISOString()}`,
                            tipo:
                                "custo",
                            categoria:
                                custo.categoria ||
                                "Custo",
                            valor:
                                Number(
                                    custo.valor
                                ) || 0,
                            descricao:
                                custo.descricao ||
                                "Custo recorrente",
                            data:
                                data.toISOString(),
                            conta:
                                custo.conta ||
                                null,
                            cartao:
                                custo.cartao ||
                                null,
                            origem:
                                "Custo recorrente"
                        });
                    }
                }
            );


            cursor.setMonth(
                cursor.getMonth() + 1
            );
        }
    }


    if (
        custo.frequencia ===
        "anual" &&
        custo.data_anual
    ) {

        const dataAnual =
            new Date(
                `${custo.data_anual}T12:00:00`
            );


        if (
            !Number.isNaN(
                dataAnual.getTime()
            ) &&
            dataAnual.getFullYear() <=
                anoSelecionado
        ) {

            const data =
                new Date(
                    anoSelecionado,
                    dataAnual.getMonth(),
                    Math.min(
                        dataAnual.getDate(),
                        ultimoDiaDoMes(
                            anoSelecionado,
                            dataAnual.getMonth()
                        )
                    ),
                    12
                );


            if (
                data >= inicio &&
                data <= fim &&
                data.getMonth() === mesSelecionado
            ) {

                eventos.push({
                    id:
                        `custo-${custo.id}-${data.toISOString()}`,
                    tipo:
                        "custo",
                    categoria:
                        custo.categoria ||
                        "Custo",
                    valor:
                        Number(
                            custo.valor
                        ) || 0,
                    descricao:
                        custo.descricao ||
                        "Custo recorrente",
                    data:
                        data.toISOString(),
                    conta:
                        custo.conta ||
                        null,
                    cartao:
                        custo.cartao ||
                        null,
                    origem:
                        "Custo recorrente"
                });
            }
        }
    }


    return eventos;
}


// ============================================================
// ORGANIZAÇÃO DOS EVENTOS
// ============================================================

function adicionarEvento(
    mapa,
    evento
) {

    const chave =
        obterChaveDia(
            evento.data
        );


    if (!chave) {
        return;
    }


    if (!mapa[chave]) {

        mapa[chave] = [];
    }


    mapa[chave].push(
        evento
    );
}


function prepararEventos(
    transacoes,
    reservadas,
    custos
) {

    const mapa = {};


    transacoes.forEach(
        transacao => {

            const data =
                obterDataISO(
                    transacao.data
                );


            if (!data) {
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


            adicionarEvento(
                mapa,
                {
                    ...transacao,
                    tipo:
                        String(
                            transacao.tipo ||
                            "gasto"
                        ).toLowerCase(),
                    origem:
                        "Transação"
                }
            );
        }
    );


    reservadas.forEach(
        reservada => {

            if (
                reservada.executada ===
                true
            ) {
                return;
            }


            const data =
                obterDataISO(
                    reservada.data
                );


            if (!data) {
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


            adicionarEvento(
                mapa,
                {
                    ...reservada,
                    tipo:
                        "reservada",
                    origem:
                        "Transação reservada"
                }
            );
        }
    );


    custos.forEach(
        custo => {

            const eventos =
                gerarDatasCusto(
                    custo
                );


            eventos.forEach(
                evento => {

                    adicionarEvento(
                        mapa,
                        evento
                    );
                }
            );
        }
    );


    Object.values(mapa)
        .forEach(
            eventos => {

                eventos.sort(
                    (
                        a,
                        b
                    ) =>
                        new Date(
                            a.data
                        ) -
                        new Date(
                            b.data
                        )
                );
            }
        );


    return mapa;
}


// ============================================================
// CALENDÁRIO
// ============================================================

function renderizarCalendario(
    mapaEventos
) {

    if (!calendarDays) {
        return;
    }


    calendarDays.innerHTML =
        "";


    const primeiroDia =
        new Date(
            anoSelecionado,
            mesSelecionado,
            1
        );


    const ultimoDia =
        new Date(
            anoSelecionado,
            mesSelecionado + 1,
            0
        );


    const quantidadeDias =
        ultimoDia.getDate();


    const primeiroDiaSemana =
        primeiroDia.getDay();


    const totalCelulas =
        Math.ceil(
            (
                primeiroDiaSemana +
                quantidadeDias
            ) / 7
        ) * 7;


    const hoje =
        new Date();


    const hojeChave =
        `${hoje.getFullYear()}-${String(
            hoje.getMonth() + 1
        ).padStart(2, "0")}-${String(
            hoje.getDate()
        ).padStart(2, "0")}`;


    for (
        let indice = 0;
        indice < totalCelulas;
        indice++
    ) {

        const numeroDia =
            indice -
            primeiroDiaSemana +
            1;


        const celula =
            document.createElement(
                "div"
            );

        celula.className =
            "calendar-day";


        if (
            numeroDia < 1
        ) {

            const dataAnterior =
                new Date(
                    anoSelecionado,
                    mesSelecionado,
                    numeroDia
                );

            celula.classList.add(
                "other-month"
            );


            const numero =
                dataAnterior.getDate();


            celula.innerHTML = `
                <div class="calendar-day-number">
                    ${numero}
                </div>
                <div class="calendar-events"></div>
            `;

            calendarDays.appendChild(
                celula
            );

            continue;
        }


        if (
            numeroDia >
            quantidadeDias
        ) {

            const dataPosterior =
                new Date(
                    anoSelecionado,
                    mesSelecionado,
                    numeroDia
                );

            celula.classList.add(
                "other-month"
            );


            const numero =
                dataPosterior.getDate();


            celula.innerHTML = `
                <div class="calendar-day-number">
                    ${numero}
                </div>
                <div class="calendar-events"></div>
            `;

            calendarDays.appendChild(
                celula
            );

            continue;
        }


        const dia =
            String(
                numeroDia
            ).padStart(2, "0");


        const mes =
            String(
                mesSelecionado + 1
            ).padStart(2, "0");


        const chave =
            `${anoSelecionado}-${mes}-${dia}`;


        if (
            chave ===
            hojeChave
        ) {

            celula.classList.add(
                "today"
            );
        }


        const eventos =
            mapaEventos[chave] ||
            [];


        celula.innerHTML = `
            <div class="calendar-day-number">
                ${numeroDia}
            </div>

            <div class="calendar-events">
            </div>
        `;


        const containerEventos =
            celula.querySelector(
                ".calendar-events"
            );


        eventos.forEach(
            evento => {

                const botao =
                    document.createElement(
                        "button"
                    );


                const tipo =
                    String(
                        evento.tipo ||
                        "gasto"
                    ).toLowerCase();


                let classe =
                    "gasto";

                let icone =
                    "💸";

                let titulo =
                    evento.categoria ||
                    "Gasto";


                if (
                    tipo ===
                    "ganho"
                ) {

                    classe =
                        "ganho";

                    icone =
                        "💲";

                    titulo =
                        evento.categoria ||
                        "Ganho";

                } else if (
                    tipo ===
                    "custo"
                ) {

                    classe =
                        "custo";

                    icone =
                        "🕒";

                    titulo =
                        evento.categoria ||
                        "Custo";

                } else if (
                    tipo ===
                    "reservada"
                ) {

                    classe =
                        "reservada";

                    icone =
                        "📌";

                    titulo =
                        evento.categoria ||
                        "Reservada";
                }


                botao.className =
                    `calendar-event ${classe}`;


                botao.type =
                    "button";


                botao.dataset.evento =
                    JSON.stringify(
                        evento
                    );


                botao.innerHTML = `
                    <span class="calendar-event-icon">
                        ${icone}
                    </span>

                    <span class="calendar-event-text">
                        ${escaparHTML(
                            titulo
                        )}
                    </span>
                `;


                botao.addEventListener(
                    "click",
                    () => {

                        abrirDetalhesTransacao(
                            evento
                        );
                    }
                );


                containerEventos.appendChild(
                    botao
                );
            }
        );


        calendarDays.appendChild(
            celula
        );
    }
}


// ============================================================
// POPUP
// ============================================================

function abrirDetalhesTransacao(
    evento
) {

    if (!transactionModal) {
        return;
    }


    const tipo =
        String(
            evento?.tipo ||
            "gasto"
        ).toLowerCase();


    let icone =
        "💸";

    let titulo =
        "Gasto";


    if (
        tipo ===
        "ganho"
    ) {

        icone =
            "💲";

        titulo =
            "Ganho";

    } else if (
        tipo ===
        "custo"
    ) {

        icone =
            "🕒";

        titulo =
            "Custo recorrente";

    } else if (
        tipo ===
        "reservada"
    ) {

        icone =
            "📌";

        titulo =
            "Transação reservada";
    }


    if (transactionModalIcon) {

        transactionModalIcon.textContent =
            icone;
    }


    if (transactionModalTitle) {

        transactionModalTitle.textContent =
            evento.categoria ||
            titulo;
    }


    if (transactionModalDate) {

        transactionModalDate.textContent =
            formatarData(
                evento.data
            );
    }


    if (transactionModalType) {

        transactionModalType.textContent =
            titulo;
    }


    if (transactionModalCategory) {

        transactionModalCategory.textContent =
            evento.categoria ||
            "Sem categoria";
    }


    if (transactionModalValue) {

        const valor =
            Number(
                evento.valor
            ) || 0;


        const sinal =
            tipo === "ganho"
                ? "+ "
                : "- ";


        transactionModalValue.textContent =
            `${sinal}${formatarMoeda(valor)}`;
    }


    if (
        transactionModalDescription
    ) {

        transactionModalDescription.textContent =
            evento.descricao ||
            "Sem descrição";
    }


    if (
        transactionModalSource
    ) {

        const conta =
            evento.conta;

        const cartao =
            evento.cartao;


        transactionModalSource.textContent =
            conta?.nome ||
            cartao?.nome ||
            evento.origem ||
            "Não informado";
    }


    transactionModal.classList.remove(
        "hidden"
    );
}


function fecharModal() {

    if (!transactionModal) {
        return;
    }

    transactionModal.classList.add(
        "hidden"
    );
}


if (
    closeTransactionModal
) {

    closeTransactionModal.addEventListener(
        "click",
        fecharModal
    );
}


if (
    transactionModal
) {

    transactionModal.addEventListener(
        "click",
        evento => {

            if (
                evento.target ===
                transactionModal
            ) {

                fecharModal();
            }
        }
    );
}


document.addEventListener(
    "keydown",
    evento => {

        if (
            evento.key ===
            "Escape"
        ) {

            fecharModal();
        }
    }
);


// ============================================================
// CARREGAR CALENDÁRIO
// ============================================================

async function carregarCalendario() {

    try {

        atualizarMesNaTela();


        const [
            transacoes,
            reservadas,
            custos
        ] = await Promise.all([

            carregarTransacoes(),

            carregarTransacoesReservadas(),

            carregarCustosRecorrentes()

        ]);


        const mapaEventos =
            prepararEventos(
                transacoes,
                reservadas,
                custos
            );


        renderizarCalendario(
            mapaEventos
        );

    } catch (erro) {

        console.error(
            "Erro ao carregar calendário:",
            erro
        );
    }
}


// ============================================================
// NAVEGAÇÃO DOS MESES
// ============================================================

async function atualizarMes(
    direcao
) {

    mesSelecionado +=
        direcao;


    if (
        mesSelecionado < 0
    ) {

        mesSelecionado =
            11;

        anoSelecionado--;
    }


    if (
        mesSelecionado > 11
    ) {

        mesSelecionado =
            0;

        anoSelecionado++;
    }


    await carregarCalendario();
}


if (calMesAnterior) {

    calMesAnterior.addEventListener(
        "click",
        () => {
            atualizarMes(-1);
        }
    );
}


if (calProximoMes) {

    calProximoMes.addEventListener(
        "click",
        () => {
            atualizarMes(1);
        }
    );
}


// ============================================================
// NOTIFICAÇÕES
// ============================================================

async function carregarContadorNotificacoes() {

    try {

        const {
            resposta,
            dados
        } = await apiGet(
            "/notificacoes/contador"
        );

        if (!resposta.ok) {
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

        const {
            resposta,
            dados
        } = await apiGet(
            "/notificacoes"
        );

        if (!resposta.ok) {
            return;
        }

        const notificacoes =
            Array.isArray(dados)
                ? dados
                : [];


        // Nova notificação
        if (
            notificacoes.length > 0 &&
            ultimaNotificacaoId !== null &&
            Number(notificacoes[0].id) >
            Number(ultimaNotificacaoId)
        ) {

            await tocarSomMYA();

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


        if (!notificationList) {
            return;
        }


        if (!notificacoes.length) {

            notificationList.innerHTML = `
                <div class="notification-empty">
                    Nenhuma notificação.
                </div>
            `;

            return;
        }


        notificationList.innerHTML =
            notificacoes.map(
                notificacao => {

                    return `
                        <div class="notification-item">

                            <strong>
                                ${escaparHTML(
                                    notificacao.titulo
                                )}
                            </strong>

                            <p>
                                ${escaparHTML(
                                    notificacao.mensagem
                                )}
                            </p>

                            <button
                                type="button"
                                onclick="deletarNotificacao(${notificacao.id})"
                            >
                                Marcar como lida
                            </button>

                        </div>
                    `;
                }
            ).join("");

    } catch (erro) {

        console.error(
            "Erro nas notificações:",
            erro
        );
    }
}


async function deletarNotificacao(id) {

    try {

        const resposta =
            await fetch(
                `${API_URL}/notificacoes/${id}`,
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );


        if (!resposta.ok) {
            return;
        }


        await carregarNotificacoes();

        await carregarContadorNotificacoes();

    } catch (erro) {

        console.error(
            "Erro ao excluir notificação:",
            erro
        );
    }
}


window.deletarNotificacao =
    deletarNotificacao;


// Abrir / fechar painel
if (
    notificationBtn &&
    notificationPanel
) {

    notificationBtn.addEventListener(
        "click",
        async evento => {

            evento.stopPropagation();

            notificationPanel.classList.toggle(
                "hidden"
            );


            if (
                !notificationPanel.classList.contains(
                    "hidden"
                )
            ) {

                await carregarNotificacoes();
            }
        }
    );
}


// Fechar ao clicar fora
document.addEventListener(
    "click",
    evento => {

        if (
            notificationPanel &&
            notificationBtn &&
            !notificationPanel.contains(
                evento.target
            ) &&
            !notificationBtn.contains(
                evento.target
            )
        ) {

            notificationPanel.classList.add(
                "hidden"
            );
        }
    }
);
// ============================================================
// ÁUDIO
// ============================================================

const somMYA =
    new Audio(
        "../Imagens-Audios/somMya.mp3"
    );

somMYA.preload =
    "auto";


async function ativarAudio() {

    if (audioPermitido) {
        return true;
    }

    try {

        somMYA.volume =
            0;

        await somMYA.play();

        somMYA.pause();

        somMYA.currentTime =
            0;

        somMYA.volume =
            1;

        audioPermitido =
            true;

        return true;

    } catch {

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

        somMYA.currentTime =
            0;

        await somMYA.play();

    } catch (erro) {

        console.error(
            "Erro ao reproduzir som da MYA:",
            erro
        );
    }
}


// ============================================================
// INICIALIZAÇÃO
// ============================================================

async function iniciarPagina() {

    console.log(
        "🚀 Iniciando calendário YOFI..."
    );


    const autenticado =
        await verificarLogin();


    if (!autenticado) {
        return;
    }


    atualizarMesNaTela();


    await carregarCalendario();


    await carregarContadorNotificacoes();


    console.log(
        "✅ Calendário carregado."
    );
}


iniciarPagina();


// ============================================================
// MONITORAMENTO DAS NOTIFICAÇÕES
// ============================================================

setInterval(
    async () => {

        await carregarContadorNotificacoes();

    },
    100000
);