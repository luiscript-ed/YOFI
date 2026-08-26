const API_URL = "https://yofi-api.onrender.com";


// ============================================================
// ELEMENTOS
// ============================================================

const sidebar =
    document.getElementById("sidebar");

const app =
    document.getElementById("app");

const menuBtn =
    document.getElementById("menuBtn");


const contaForm =
    document.getElementById("contaForm");

const contaId =
    document.getElementById("contaId");

const nomeConta =
    document.getElementById("nomeConta");

const tipoConta =
    document.getElementById("tipoConta");

const saldoInicial =
    document.getElementById("saldoInicial");

const salvarConta =
    document.getElementById("salvarConta");

const cancelarEdicao =
    document.getElementById("cancelarEdicao");

const formTitulo =
    document.getElementById("formTitulo");

const mensagem =
    document.getElementById("mensagem");

const contasList =
    document.getElementById("contasList");

const totalContas =
    document.getElementById("totalContas");

const saldoTotal =
    document.getElementById("saldoTotal");

const contasAtivas =
    document.getElementById("contasAtivas");

const usuarioNome =
    document.getElementById("usuarioNome");

const usuarioEmail =
    document.getElementById("usuarioEmail");


// ============================================================
// ESTADO
// ============================================================

let contas = [];


// ============================================================
// FORMATAÇÃO
// ============================================================

function formatarMoeda(valor) {

    return Number(valor || 0).toLocaleString(
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


function nomeTipoConta(tipo) {

    const tipos = {

        corrente: "Conta corrente",

        poupanca: "Poupança",

        carteira: "Carteira",

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
        !sidebar.classList.contains("closed");

    menuBtn.setAttribute(
        "aria-expanded",
        String(aberto)
    );

}


menuBtn.addEventListener(
    "click",
    () => {

        if (window.innerWidth <= 800) {

            sidebar.classList.toggle("open");

        } else {

            sidebar.classList.toggle("closed");

            app.classList.toggle(
                "sidebar-closed"
            );

        }

        atualizarMenu();

    }
);


// ============================================================
// FECHAR SIDEBAR NO MOBILE
// ============================================================

document
    .querySelectorAll(".sidebar-link")
    .forEach(link => {

        link.addEventListener(
            "click",
            () => {

                if (window.innerWidth <= 800) {

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

            if (resposta.status === 401) {

                window.location.href =
                    "https://luiscript-ed.github.io/YOFI/Front-end/Auth/auth";

            }

            return;

        }

        const dados =
            await resposta.json();

        usuarioNome.textContent =
            dados.nome || "Usuário";

        usuarioEmail.textContent =
            dados.email || "";

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
                    credentials: "include"
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
                    credentials: "include"
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

        if (!notificacoes.length) {

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
// CONTAS
// ============================================================

async function carregarContas() {

    contasList.innerHTML =
        `<div class="empty-state">
            Carregando contas...
        </div>`;

    try {

        const resposta =
            await fetch(
                `${API_URL}/contas`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );

        if (!resposta.ok) {

            if (resposta.status === 401) {

                window.location.href =
                    "https://luiscript-ed.github.io/YOFI/Front-end/Auth/auth";

                return;

            }

            throw new Error(
                "Não foi possível carregar as contas."
            );

        }

        contas =
            await resposta.json();

        renderizarContas();

    } catch (erro) {

        console.error(
            "Erro ao carregar contas:",
            erro
        );

        contasList.innerHTML =
            `<div class="empty-state">
                Erro ao carregar as contas.
            </div>`;

    }

}


// ============================================================
// RENDERIZAR CONTAS
// ============================================================

function renderizarContas() {

    atualizarResumo();


    if (!contas.length) {

        contasList.innerHTML =
            `<div class="empty-state">
                Você ainda não possui nenhuma conta cadastrada.
            </div>`;

        return;

    }


    contasList.innerHTML =
        contas.map(
            conta => {

                const saldo =
                    Number(
                        conta.saldo_atual || 0
                    );

                const saldoInicial =
                    Number(
                        conta.saldo_inicial || 0
                    );

                const classeInativa =
                    conta.ativo
                        ? ""
                        : "inactive";

                const status =
                    conta.ativo
                        ? "Ativa"
                        : "Inativa";


                return `

                    <article
                        class="account-card ${classeInativa}"
                    >

                        <div class="account-card-header">

                            <div class="account-title">

                                <h3>
                                    ${escaparHTML(
                                        conta.nome
                                    )}
                                </h3>

                                <span class="account-type">
                                    ${escaparHTML(
                                        nomeTipoConta(
                                            conta.tipo
                                        )
                                    )}
                                </span>

                            </div>


                            <span class="account-status">
                                ${status}
                            </span>

                        </div>


                        <span class="account-balance-label">
                            Saldo atual
                        </span>


                        <strong class="account-balance">

                            ${formatarMoeda(saldo)}

                        </strong>


                        <div class="account-initial">

                            <span>
                                Saldo inicial
                            </span>

                            <strong>
                                ${formatarMoeda(
                                    saldoInicial
                                )}
                            </strong>

                        </div>


                        <div class="account-actions">

                            <button
                                type="button"
                                class="account-action"
                                onclick="editarConta(${conta.id})"
                            >
                                Editar
                            </button>


                            <button
                                type="button"
                                class="account-action toggle"
                                onclick="alternarConta(${conta.id})"
                            >
                                ${conta.ativo
                                    ? "Desativar"
                                    : "Ativar"}
                            </button>


                            <button
                                type="button"
                                class="account-action delete"
                                onclick="deletarConta(${conta.id})"
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
        contas.length;

    const ativas =
        contas.filter(
            conta => conta.ativo
        ).length;

    const saldo =
        contas.reduce(
            (soma, conta) =>
                soma +
                Number(
                    conta.saldo_atual || 0
                ),
            0
        );


    totalContas.textContent =
        total;

    contasAtivas.textContent =
        ativas;

    saldoTotal.textContent =
        formatarMoeda(saldo);

}


// ============================================================
// FORMULÁRIO
// ============================================================

contaForm.addEventListener(
    "submit",
    async evento => {

        evento.preventDefault();


        const id =
            contaId.value;


        const dados = {

            nome:
                nomeConta.value.trim(),

            tipo:
                tipoConta.value,

            saldo_inicial:
                Number(
                    saldoInicial.value
                ),

            ativo:
                true

        };


        if (!dados.nome) {

            mostrarMensagem(
                "Informe o nome da conta.",
                "error"
            );

            return;

        }


        if (!dados.tipo) {

            mostrarMensagem(
                "Selecione o tipo da conta.",
                "error"
            );

            return;

        }


        salvarConta.disabled =
            true;


        salvarConta.textContent =
            id
                ? "Salvando..."
                : "Criando...";


        limparMensagem();


        try {

            const resposta =
                await fetch(

                    id
                        ? `${API_URL}/contas/${id}`
                        : `${API_URL}/contas`,

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
                    "Não foi possível salvar a conta."
                );

            }


            mostrarMensagem(
                resultado.mensagem ||
                "Conta salva com sucesso!",
                "success"
            );


            limparFormulario();

            await carregarContas();

            await carregarContadorNotificacoes();

        } catch (erro) {

            console.error(
                "Erro ao salvar conta:",
                erro
            );

            mostrarMensagem(
                erro.message ||
                "Erro ao salvar a conta.",
                "error"
            );

        } finally {

            salvarConta.disabled =
                false;

            salvarConta.textContent =
                "Criar conta";

        }

    }
);


// ============================================================
// EDITAR CONTA
// ============================================================

function editarConta(id) {

    const conta =
        contas.find(
            item =>
                Number(item.id) ===
                Number(id)
        );

    if (!conta) {
        return;
    }


    contaId.value =
        conta.id;

    nomeConta.value =
        conta.nome;

    tipoConta.value =
        conta.tipo;

    saldoInicial.value =
        conta.saldo_inicial;


    formTitulo.textContent =
        "Editar conta";

    salvarConta.textContent =
        "Salvar alterações";

    cancelarEdicao.classList.remove(
        "hidden"
    );


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


window.editarConta =
    editarConta;


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
// ALTERNAR CONTA
// ============================================================

async function alternarConta(id) {

    const conta =
        contas.find(
            item =>
                Number(item.id) ===
                Number(id)
        );

    if (!conta) {
        return;
    }


    try {

        const resposta =
            await fetch(
                `${API_URL}/contas/${id}`,
                {

                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    credentials: "include",

                    body: JSON.stringify({

                        nome:
                            conta.nome,

                        tipo:
                            conta.tipo,

                        saldo_inicial:
                            conta.saldo_inicial,

                        ativo:
                            !conta.ativo

                    })

                }
            );


        const resultado =
            await resposta.json();


        if (!resposta.ok) {

            throw new Error(
                resultado.detail ||
                "Não foi possível alterar o status da conta."
            );

        }


        mostrarMensagem(
            resultado.mensagem ||
            "Status da conta alterado.",
            "success"
        );


        await carregarContas();

    } catch (erro) {

        console.error(
            "Erro ao alterar conta:",
            erro
        );

        mostrarMensagem(
            erro.message ||
            "Erro ao alterar a conta.",
            "error"
        );

    }

}


window.alternarConta =
    alternarConta;


// ============================================================
// EXCLUIR CONTA
// ============================================================

async function deletarConta(id) {

    const confirmar =
        confirm(
            "Tem certeza que deseja excluir esta conta?"
        );

    if (!confirmar) {
        return;
    }


    try {

        const resposta =
            await fetch(
                `${API_URL}/contas/${id}`,
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );


        const resultado =
            await resposta.json();


        if (!resposta.ok) {

            throw new Error(
                resultado.detail ||
                "Não foi possível excluir a conta."
            );

        }


        mostrarMensagem(
            resultado.mensagem ||
            "Conta excluída com sucesso!",
            "success"
        );


        await carregarContas();

    } catch (erro) {

        console.error(
            "Erro ao excluir conta:",
            erro
        );

        mostrarMensagem(
            erro.message ||
            "Erro ao excluir a conta.",
            "error"
        );

    }

}


window.deletarConta =
    deletarConta;


// ============================================================
// LIMPAR FORMULÁRIO
// ============================================================

function limparFormulario() {

    contaId.value = "";

    nomeConta.value = "";

    tipoConta.value = "";

    saldoInicial.value = "0";

    formTitulo.textContent =
        "Criar conta";

    salvarConta.textContent =
        "Criar conta";

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

    mensagem.textContent = "";

    mensagem.className =
        "form-message";

}


// ============================================================
// INICIALIZAÇÃO
// ============================================================

async function iniciarPagina() {

    await carregarUsuario();

    await carregarContas();

    await carregarContadorNotificacoes();

}

iniciarPagina();