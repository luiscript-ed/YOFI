/* const API_URL =
    "https://yofi-api.onrender.com";


// ============================================================
// ELEMENTOS
// ============================================================

const sidebar = document.getElementById("sidebar");
const app = document.getElementById("app");
const menuBtn =  document.getElementById("menuBtn");


const cartaoForm = document.getElementById("cartaoForm");
const cartaoId = document.getElementById("cartaoId");
const nomeCartao = document.getElementById("nomeCartao");

const bancoCartao = document.getElementById("bancoCartao");
const limiteCartao = document.getElementById("limiteCartao");
const diaFechamento = document.getElementById("diaFechamento");

const diaVencimento = document.getElementById("diaVencimento");
const salvarCartao = document.getElementById("salvarCartao");
const cancelarEdicao = document.getElementById("cancelarEdicao");

const formTitulo = document.getElementById("formTitulo");
const mensagem = document.getElementById("mensagem");
const cartoesList = document.getElementById("cartoesList");

const totalCartoes = document.getElementById("totalCartoes");
const limiteTotal = document.getElementById("limiteTotal");
const utilizadoTotal = document.getElementById("utilizadoTotal");

const disponivelTotal = document.getElementById("disponivelTotal");

const usuarioNome = document.getElementById("usuarioNome");
const usuarioEmail = document.getElementById("usuarioEmail");
const usuarioImagem = document.getElementById("usuarioImagem");

// ============================================================
// ESTADO
// ============================================================

let cartoes = [];


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


// ============================================================
// SIDEBAR
// ============================================================

function atualizarMenu() {

    let aberto =
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
                    "https://luiscript-ed.github.io/YOFI/Front-end/autentification/autentification";

            }

            return;

        }

        const dados =
            await resposta.json();

if (usuarioImagem) {
    if (dados.imagem) {
        usuarioImagem.src = dados.imagem;
        usuarioImagem.alt = dados.nome || "Foto do usuário";
    } else {
        usuarioImagem.src = "../Imagens-Audios/404/usuarioGenerico.png";
        usuarioImagem.alt = "Usuário";
    }
}
        
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
// COFRINHOS
// ============================================================

async function carregarCofrinhos() {

    cartoesList.innerHTML =
        `<div class="empty-state">
            Carregando cofrinhos...
        </div>`;

    try {

        const resposta =
            await fetch(
                `${API_URL}/cofrinhos`,
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
                    "https://luiscript-ed.github.io/YOFI/Front-end/autentification/autentification";

                return;

            }

            throw new Error(
                "Não foi possível carregar os cofrinhos."
            );

        }

        cofre =
            await resposta.json();

        renderizarCofrinho();

    } catch (erro) {

        console.error(
            "Erro ao carregar cofrinhos:",
            erro
        );

        cartoesList.innerHTML =
            `<div class="empty-state">
                Erro ao carregar os cofrinhos.
            </div>`;

    }

}

function trocarPosicaoCartao(element, event) {
    // Evita alternar se clicar nos botões de ação internos
    if (event.target.closest('.card-actions')) return;
    
    element.classList.toggle('flipped');
}


// ============================================================
// RESUMO
// ============================================================

function atualizarResumo() {

    const total =
        cartoes.length;

    const limite =
        cartoes.reduce(
            (soma, cartao) =>
                soma +
                Number(
                    cartao.limite || 0
                ),
            0
        );

    const utilizado =
        cartoes.reduce(
            (soma, cartao) =>
                soma +
                Number(
                    cartao.utilizado || 0
                ),
            0
        );

    const disponivel =
        limite - utilizado;


    totalCartoes.textContent =
        total;

    limiteTotal.textContent =
        formatarMoeda(limite);

    utilizadoTotal.textContent =
        formatarMoeda(utilizado);

    disponivelTotal.textContent =
        formatarMoeda(disponivel);

}

// ============================================================
// ATIVAR / DESATIVAR
// ============================================================

async function alternarCofrinho(id) {

    const cartao =
        cartoes.find(
            item =>
                Number(item.id) ===
                Number(id)
        );

    if (!cartao) {
        return;
    }


    try {

        const resposta =
            await fetch(
                `${API_URL}/cartoes/${id}`,
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
                                cartao.nome,

                            banco:
                                cartao.banco,

                            limite:
                                cartao.limite,

                            dia_vencimento:
                                cartao.dia_vencimento,

                            dia_fechamento:
                                cartao.dia_fechamento,

                            ativo:
                                !cartao.ativo

                        })

                }
            );


        const resultado =
            await resposta.json();


        if (!resposta.ok) {

            throw new Error(
                resultado.detail ||
                "Não foi possível alterar o cartão."
            );

        }


        mostrarMensagem(
            resultado.mensagem ||
            "Status alterado com sucesso.",
            "success"
        );


        await carregarCartoes();

    } catch (erro) {

        console.error(
            "Erro ao alterar cartão:",
            erro
        );

        mostrarMensagem(
            erro.message ||
            "Erro ao alterar o cartão.",
            "error"
        );

    }

}


window.alternarCartao =
    alternarCartao;






// ============================================================
// FATURA
// ============================================================

async function abrirFatura(id) {

    const agora =
        new Date();

    const mes =
        agora.getMonth() + 1;

    const ano =
        agora.getFullYear();


    try {

        const resposta =
            await fetch(
                `${API_URL}/cartoes/${id}/fatura?mes=${mes}&ano=${ano}`,
                {
                    method: "GET",
                    credentials:
                        "include"
                }
            );


        const resultado =
            await resposta.json();


        if (!resposta.ok) {

            throw new Error(
                resultado.detail ||
                "Não foi possível carregar a fatura."
            );

        }


        const total =
            formatarMoeda(
                resultado.total
            );


        const cartao =
            resultado.cartao;


        let detalhes =
            `Fatura de ${cartao.nome}

Total: ${total}

Fechamento: dia ${cartao.dia_fechamento}

Vencimento: dia ${cartao.dia_vencimento}

Transações: ${resultado.transacoes.length}`;


        alert(detalhes);

    } catch (erro) {

        console.error(
            "Erro ao carregar fatura:",
            erro
        );

        mostrarMensagem(
            erro.message ||
            "Erro ao carregar a fatura.",
            "error"
        );

    }

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

    await carregarCartoes();

    await carregarContadorNotificacoes();

}


iniciarPagina(); */

