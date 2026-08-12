const API_URL =
    "https://yofi-api.onrender.com";


// ============================================================
// ELEMENTOS
// ============================================================

const sidebar =
    document.getElementById("sidebar");

const app =
    document.getElementById("app");

const menuBtn =
    document.getElementById("menuBtn");


const objetivoForm =
    document.getElementById("objetivoForm");

const objetivoId =
    document.getElementById("objetivoId");

const nomeObjetivo =
    document.getElementById("nomeObjetivo");

const tipoObjetivo =
    document.getElementById("tipoObjetivo");

const valorMeta =
    document.getElementById("valorMeta");

const valorAtual =
    document.getElementById("valorAtual");

const prazo =
    document.getElementById("prazo");

const salvarObjetivo =
    document.getElementById("salvarObjetivo");

const cancelarEdicao =
    document.getElementById("cancelarEdicao");

const formTitulo =
    document.getElementById("formTitulo");

const mensagem =
    document.getElementById("mensagem");

const objetivosList =
    document.getElementById("objetivosList");

const totalObjetivos =
    document.getElementById("totalObjetivos");

const metaTotal =
    document.getElementById("metaTotal");

const valorAtualTotal =
    document.getElementById("valorAtualTotal");

const progressoGeral =
    document.getElementById("progressoGeral");

const usuarioNome =
    document.getElementById("usuarioNome");

const usuarioEmail =
    document.getElementById("usuarioEmail");


// ============================================================
// ESTADO
// ============================================================

let objetivos = [];


// ============================================================
// FORMATAÇÃO
// ============================================================

function formatarMoeda(valor) {

    return Number(
        valor || 0
    ).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}


function escaparHTML(texto) {

    const div =
        document.createElement("div");

    div.textContent =
        texto ?? "";

    return div.innerHTML;

}


function nomeTipoObjetivo(tipo) {

    const tipos = {

        viagem: "Viagem",

        compra: "Compra",

        reserva: "Reserva de emergência",

        investimento: "Investimento",

        outro: "Outro"

    };

    return tipos[tipo] || tipo;

}


// ============================================================
// SIDEBAR
// ============================================================

function atualizarMenu() {

    const aberto =
        !sidebar.classList.contains(
            "closed"
        );

    menuBtn.setAttribute(
        "aria-expanded",
        String(aberto)
    );

}


menuBtn.addEventListener(
    "click",
    () => {

        if (
            window.innerWidth <= 800
        ) {

            sidebar.classList.toggle(
                "open"
            );

        } else {

            sidebar.classList.toggle(
                "closed"
            );

            app.classList.toggle(
                "sidebar-closed"
            );

        }

        atualizarMenu();

    }
);


document
    .querySelectorAll(".sidebar-link")
    .forEach(link => {

        link.addEventListener(
            "click",
            () => {

                if (
                    window.innerWidth <= 800
                ) {

                    sidebar.classList.remove(
                        "open"
                    );

                }

            }
        );

    });


// ============================================================
// USUÁRIO
// ============================================================

async function carregarUsuario() {

    try {

        const resposta =
            await fetch(
                `${API_URL}/me`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );

        if (!resposta.ok) {

            if (
                resposta.status === 401
            ) {

                window.location.href =
                    "https://luiscript-ed.github.io/YOFI/Front-end/Auth/auth";

            }

            return;

        }

        const dados =
            await resposta.json();

        usuarioNome.textContent =
            dados.nome ||
            "Usuário";

        usuarioEmail.textContent =
            dados.email ||
            "";

    } catch (erro) {

        console.error(
            "Erro ao carregar usuário:",
            erro
        );

    }

}


// ============================================================
// NOTIFICAÇÕES
// ============================================================

const notificationBtn =
    document.getElementById(
        "notificationBtn"
    );

const notificationPanel =
    document.getElementById(
        "notificationPanel"
    );

const notificationCount =
    document.getElementById(
        "notificationCount"
    );

const notificationList =
    document.getElementById(
        "notificationList"
    );


notificationBtn.addEventListener(
    "click",
    async () => {

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


async function carregarContadorNotificacoes() {

    try {

        const resposta =
            await fetch(
                `${API_URL}/notificacoes/contador`,
                {
                    credentials:
                        "include"
                }
            );

        if (!resposta.ok) {
            return;
        }

        const dados =
            await resposta.json();

        notificationCount.textContent =
            dados.quantidade || 0;

    } catch (erro) {

        console.error(
            "Erro no contador:",
            erro
        );

    }

}


async function carregarNotificacoes() {

    notificationList.innerHTML =
        `<div class="notification-empty">
            Carregando...
        </div>`;

    try {

        const resposta =
            await fetch(
                `${API_URL}/notificacoes`,
                {
                    credentials:
                        "include"
                }
            );

        if (!resposta.ok) {

            notificationList.innerHTML =
                `<div class="notification-empty">
                    Não foi possível carregar.
                </div>`;

            return;

        }

        const notificacoes =
            await resposta.json();

        if (
            !notificacoes.length
        ) {

            notificationList.innerHTML =
                `<div class="notification-empty">
                    Nenhuma notificação.
                </div>`;

            notificationCount.textContent =
                "0";

            return;

        }

        notificationList.innerHTML =
            notificacoes.map(
                notificacao => `

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

                `
            ).join("");

    } catch (erro) {

        console.error(
            "Erro ao carregar notificações:",
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
                    credentials:
                        "include"
                }
            );

        if (!resposta.ok) {
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


window.deletarNotificacao =
    deletarNotificacao;


document.addEventListener(
    "click",
    evento => {

        if (
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
// OBJETIVOS
// ============================================================

async function carregarObjetivos() {

    objetivosList.innerHTML =
        `<div class="empty-state">
            Carregando objetivos...
        </div>`;

    try {

        const resposta =
            await fetch(
                `${API_URL}/objetivos`,
                {
                    method: "GET",
                    credentials:
                        "include"
                }
            );

        if (!resposta.ok) {

            if (
                resposta.status === 401
            ) {

                window.location.href =
                    "https://luiscript-ed.github.io/YOFI/Front-end/Auth/auth";

                return;

            }

            throw new Error(
                "Não foi possível carregar os objetivos."
            );

        }

        objetivos =
            await resposta.json();

        renderizarObjetivos();

    } catch (erro) {

        console.error(
            "Erro ao carregar objetivos:",
            erro
        );

        objetivosList.innerHTML =
            `<div class="empty-state">
                Erro ao carregar os objetivos.
            </div>`;

    }

}


// ============================================================
// RENDERIZAR
// ============================================================

function renderizarObjetivos() {

    atualizarResumo();


    if (
        !objetivos.length
    ) {

        objetivosList.innerHTML =
            `<div class="empty-state">
                Você ainda não possui objetivos cadastrados.
            </div>`;

        return;

    }


    objetivosList.innerHTML =
        objetivos.map(
            objetivo => {

                const meta =
                    Number(
                        objetivo.valor_meta || 0
                    );

                const atual =
                    Number(
                        objetivo.valor_atual || 0
                    );

                const progresso =
                    Number(
                        objetivo.progresso || 0
                    );

                const progressoVisual =
                    Math.min(
                        Math.max(
                            progresso,
                            0
                        ),
                        100
                    );

                const classeInativa =
                    objetivo.ativo
                        ? ""
                        : "inactive";

                const status =
                    objetivo.ativo
                        ? "Ativo"
                        : "Inativo";


                return `

                    <article
                        class="goal-card ${classeInativa}"
                    >

                        <div class="goal-header">

                            <div class="goal-title">

                                <h3>
                                    ${escaparHTML(
                                        objetivo.nome
                                    )}
                                </h3>

                                <span>
                                    ${escaparHTML(
                                        nomeTipoObjetivo(
                                            objetivo.tipo
                                        )
                                    )}
                                </span>

                            </div>


                            <span class="goal-status">
                                ${status}
                            </span>

                        </div>


                        <div class="goal-values">

                            <div class="goal-value">

                                <span>
                                    Atual
                                </span>

                                <strong>
                                    ${formatarMoeda(
                                        atual
                                    )}
                                </strong>

                            </div>


                            <div class="goal-value">

                                <span>
                                    Meta
                                </span>

                                <strong>
                                    ${formatarMoeda(
                                        meta
                                    )}
                                </strong>

                            </div>

                        </div>


                        <div class="goal-progress">

                            <div class="goal-progress-bar">

                                <div
                                    class="goal-progress-fill"
                                    style="width: ${progressoVisual}%"
                                ></div>

                            </div>


                            <div class="goal-progress-label">

                                <span>
                                    ${progresso.toFixed(1)}% alcançado
                                </span>

                                <span>
                                    ${formatarMoeda(
                                        Math.max(
                                            meta - atual,
                                            0
                                        )
                                    )}
                                    restantes
                                </span>

                            </div>

                        </div>


                        <div class="goal-deadline">

                            <span>
                                Prazo
                                <strong>
                                    ${formatarData(
                                        objetivo.prazo
                                    )}
                                </strong>
                            </span>

                            <span>
                                ${textoPrazo(
                                    objetivo.prazo
                                )}
                            </span>

                        </div>


                        <div class="goal-actions">

                            <button
                                type="button"
                                class="goal-action"
                                onclick="editarObjetivo(${objetivo.id})"
                            >
                                Editar
                            </button>


                            <button
                                type="button"
                                class="goal-action toggle"
                                onclick="alternarObjetivo(${objetivo.id})"
                            >
                                ${objetivo.ativo
                                    ? "Desativar"
                                    : "Ativar"}
                            </button>


                            <button
                                type="button"
                                class="goal-action delete"
                                onclick="deletarObjetivo(${objetivo.id})"
                            >
                                Excluir
                            </button>

                        </div>

                    </article>

                `;

            }
        ).join("");

}


// ============================================================
// RESUMO
// ============================================================

function atualizarResumo() {

    const total =
        objetivos.length;

    const meta =
        objetivos.reduce(
            (soma, objetivo) =>
                soma +
                Number(
                    objetivo.valor_meta || 0
                ),
            0
        );

    const atual =
        objetivos.reduce(
            (soma, objetivo) =>
                soma +
                Number(
                    objetivo.valor_atual || 0
                ),
            0
        );

    const progresso =
        meta > 0
            ? Math.min(
                (atual / meta) * 100,
                100
            )
            : 0;


    totalObjetivos.textContent =
        total;

    metaTotal.textContent =
        formatarMoeda(meta);

    valorAtualTotal.textContent =
        formatarMoeda(atual);

    progressoGeral.textContent =
        `${progresso.toFixed(1)}%`;

}


// ============================================================
// DATAS
// ============================================================

function formatarData(data) {

    if (!data) {
        return "Sem prazo";
    }

    const partes =
        String(data).split("-");

    if (
        partes.length === 3
    ) {

        return `${partes[2]}/${partes[1]}/${partes[0]}`;

    }

    return data;

}


function textoPrazo(data) {

    if (!data) {
        return "";
    }

    const hoje =
        new Date();

    const dataPrazo =
        new Date(
            `${data}T00:00:00`
        );

    const diferenca =
        dataPrazo - hoje;

    const dias =
        Math.ceil(
            diferenca /
            (
                1000 *
                60 *
                60 *
                24
            )
        );


    if (dias < 0) {

        return "Prazo expirado";

    }

    if (dias === 0) {

        return "Vence hoje";

    }

    if (dias === 1) {

        return "1 dia restante";

    }

    if (dias < 30) {

        return `${dias} dias restantes`;

    }


    const meses =
        Math.floor(
            dias / 30
        );

    return meses === 1
        ? "1 mês restante"
        : `${meses} meses restantes`;

}


// ============================================================
// FORMULÁRIO
// ============================================================

objetivoForm.addEventListener(
    "submit",
    async evento => {

        evento.preventDefault();


        const id =
            objetivoId.value;


        const meta =
            Number(
                valorMeta.value
            );

        const atual =
            Number(
                valorAtual.value
            );


        if (
            atual > meta
        ) {

            mostrarMensagem(
                "O valor atual não pode ser maior que a meta.",
                "error"
            );

            return;

        }


        const dados = {

            nome:
                nomeObjetivo.value.trim(),

            tipo:
                tipoObjetivo.value,

            valor_meta:
                meta,

            valor_atual:
                atual,

            prazo:
                prazo.value,

            ativo:
                true

        };


        if (!dados.nome) {

            mostrarMensagem(
                "Informe o nome do objetivo.",
                "error"
            );

            return;

        }


        if (!dados.tipo) {

            mostrarMensagem(
                "Selecione o tipo do objetivo.",
                "error"
            );

            return;

        }


        if (!dados.prazo) {

            mostrarMensagem(
                "Informe o prazo do objetivo.",
                "error"
            );

            return;

        }


        salvarObjetivo.disabled =
            true;

        salvarObjetivo.textContent =
            id
                ? "Salvando..."
                : "Criando...";

        limparMensagem();


        try {

            const resposta =
                await fetch(

                    id
                        ? `${API_URL}/objetivos/${id}`
                        : `${API_URL}/objetivos`,

                    {

                        method:
                            id
                                ? "PUT"
                                : "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        credentials:
                            "include",

                        body:
                            JSON.stringify(
                                dados
                            )

                    }

                );


            const resultado =
                await resposta.json();


            if (!resposta.ok) {

                throw new Error(
                    resultado.detail ||
                    "Não foi possível salvar o objetivo."
                );

            }


            mostrarMensagem(
                resultado.mensagem ||
                "Objetivo salvo com sucesso!",
                "success"
            );


            limparFormulario();

            await carregarObjetivos();

        } catch (erro) {

            console.error(
                "Erro ao salvar objetivo:",
                erro
            );

            mostrarMensagem(
                erro.message ||
                "Erro ao salvar o objetivo.",
                "error"
            );

        } finally {

            salvarObjetivo.disabled =
                false;

            salvarObjetivo.textContent =
                "Criar objetivo";

        }

    }
);


// ============================================================
// EDITAR
// ============================================================

function editarObjetivo(id) {

    const objetivo =
        objetivos.find(
            item =>
                Number(item.id) ===
                Number(id)
        );

    if (!objetivo) {
        return;
    }


    objetivoId.value =
        objetivo.id;

    nomeObjetivo.value =
        objetivo.nome;

    tipoObjetivo.value =
        objetivo.tipo;

    valorMeta.value =
        objetivo.valor_meta;

    valorAtual.value =
        objetivo.valor_atual;

    prazo.value =
        objetivo.prazo;


    formTitulo.textContent =
        "Editar objetivo";

    salvarObjetivo.textContent =
        "Salvar alterações";

    cancelarEdicao.classList.remove(
        "hidden"
    );


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


window.editarObjetivo =
    editarObjetivo;


// ============================================================
// ATIVAR / DESATIVAR
// ============================================================

async function alternarObjetivo(id) {

    const objetivo =
        objetivos.find(
            item =>
                Number(item.id) ===
                Number(id)
        );

    if (!objetivo) {
        return;
    }


    try {

        const resposta =
            await fetch(
                `${API_URL}/objetivos/${id}`,
                {

                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    credentials:
                        "include",

                    body:
                        JSON.stringify({

                            nome:
                                objetivo.nome,

                            tipo:
                                objetivo.tipo,

                            valor_meta:
                                objetivo.valor_meta,

                            valor_atual:
                                objetivo.valor_atual,

                            prazo:
                                objetivo.prazo,

                            ativo:
                                !objetivo.ativo

                        })

                }
            );


        const resultado =
            await resposta.json();


        if (!resposta.ok) {

            throw new Error(
                resultado.detail ||
                "Não foi possível alterar o objetivo."
            );

        }


        mostrarMensagem(
            resultado.mensagem ||
            "Status alterado com sucesso.",
            "success"
        );


        await carregarObjetivos();

    } catch (erro) {

        console.error(
            "Erro ao alterar objetivo:",
            erro
        );

        mostrarMensagem(
            erro.message ||
            "Erro ao alterar o objetivo.",
            "error"
        );

    }

}


window.alternarObjetivo =
    alternarObjetivo;


// ============================================================
// EXCLUIR
// ============================================================

async function deletarObjetivo(id) {

    const confirmar =
        confirm(
            "Tem certeza que deseja excluir este objetivo?"
        );

    if (!confirmar) {
        return;
    }


    try {

        const resposta =
            await fetch(
                `${API_URL}/objetivos/${id}`,
                {
                    method: "DELETE",
                    credentials:
                        "include"
                }
            );


        const resultado =
            await resposta.json();


        if (!resposta.ok) {

            throw new Error(
                resultado.detail ||
                "Não foi possível excluir o objetivo."
            );

        }


        mostrarMensagem(
            resultado.mensagem ||
            "Objetivo excluído com sucesso!",
            "success"
        );


        await carregarObjetivos();

    } catch (erro) {

        console.error(
            "Erro ao excluir objetivo:",
            erro
        );

        mostrarMensagem(
            erro.message ||
            "Erro ao excluir o objetivo.",
            "error"
        );

    }

}


window.deletarObjetivo =
    deletarObjetivo;


// ============================================================
// CANCELAR EDIÇÃO
// ============================================================

cancelarEdicao.addEventListener(
    "click",
    () => {

        limparFormulario();

    }
);


// ============================================================
// LIMPAR FORMULÁRIO
// ============================================================

function limparFormulario() {

    objetivoId.value = "";

    nomeObjetivo.value = "";

    tipoObjetivo.value = "";

    valorMeta.value = "";

    valorAtual.value = "0";

    prazo.value = "";

    formTitulo.textContent =
        "Criar objetivo";

    salvarObjetivo.textContent =
        "Criar objetivo";

    cancelarEdicao.classList.add(
        "hidden"
    );

}


// ============================================================
// MENSAGENS
// ============================================================

function mostrarMensagem(
    texto,
    tipo
) {

    mensagem.textContent =
        texto;

    mensagem.className =
        `form-message ${tipo}`;

}


function limparMensagem() {

    mensagem.textContent =
        "";

    mensagem.className =
        "form-message";

}


// ============================================================
// INICIALIZAÇÃO
// ============================================================

async function iniciarPagina() {

    await carregarUsuario();

    await carregarObjetivos();

    await carregarContadorNotificacoes();

}


iniciarPagina();