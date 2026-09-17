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
// INICIALIZAÇÃO
// ============================================================

async function iniciarPagina() {

    await carregarUsuario();

    await carregarCartoes();

    await carregarContadorNotificacoes();

}


iniciarPagina(); */

