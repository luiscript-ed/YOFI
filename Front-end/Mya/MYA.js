// ============================================================
// CONFIGURAÇÃO
// ============================================================

const API_URL = "https://yofi-api.onrender.com";

const AUTH_PAGE =
    "https://luiscript-ed.github.io/YOFI/Front-end/Auth/auth";

const HOME_PAGE =
    "https://luiscript-ed.github.io/YOFI/Front-end/Inicial/page";


// ============================================================
// ELEMENTOS
// ============================================================

const sidebar =
    document.getElementById("sidebar");

const app =
    document.getElementById("app");

const menuBtn =
    document.getElementById("menuBtn");

const usuarioNome =
    document.getElementById("usuarioNome");

const usuarioEmail =
    document.getElementById("usuarioEmail");

const notificationBtn =
    document.getElementById("notificationBtn");

const notificationPanel =
    document.getElementById("notificationPanel");

const notificationCount =
    document.getElementById("notificationCount");

const notificationList =
    document.getElementById("notificationList");


const chatContainer =
    document.getElementById("chatContainer");

const chatForm =
    document.getElementById("chatForm");

const userInput =
    document.getElementById("userInput");


// ============================================================
// ESTADO
// ============================================================

let enviandoMensagem = false;

let controllerAtual = null;


// ============================================================
// SIDEBAR
// ============================================================

function atualizarEstadoMenu() {

    if (!sidebar || !menuBtn) {
        return;
    }

    const aberta =
        window.innerWidth <= 800
            ? sidebar.classList.contains("open")
            : !sidebar.classList.contains("closed");

    menuBtn.setAttribute(
        "aria-expanded",
        String(aberta)
    );

}


function alternarSidebar() {

    if (!sidebar || !app) {
        return;
    }

    if (window.innerWidth <= 800) {

        sidebar.classList.toggle("open");

    } else {

        sidebar.classList.toggle("closed");

        app.classList.toggle(
            "sidebar-closed"
        );

    }

    atualizarEstadoMenu();

}


if (menuBtn) {

    menuBtn.addEventListener(
        "click",
        alternarSidebar
    );

}


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

                    atualizarEstadoMenu();

                }

            }
        );

    });


window.addEventListener(
    "resize",
    () => {

        if (
            window.innerWidth > 800
        ) {

            sidebar.classList.remove(
                "open"
            );

        }

        atualizarEstadoMenu();

    }
);


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


        if (
            resposta.status === 401
        ) {

            window.location.href =
                AUTH_PAGE;

            return;

        }


        if (!resposta.ok) {

            console.error(
                "Erro ao carregar usuário:",
                resposta.status
            );

            return;

        }


        const usuario =
            await resposta.json();


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

function escaparHTML(valor) {

    const elemento =
        document.createElement("div");

    elemento.textContent =
        valor ?? "";

    return elemento.innerHTML;

}


async function carregarContadorNotificacoes() {

    if (!notificationCount) {
        return;
    }

    try {

        const resposta =
            await fetch(
                `${API_URL}/notificacoes/contador`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );


        if (
            resposta.status === 401
        ) {

            return;

        }


        if (!resposta.ok) {
            return;
        }


        const dados =
            await resposta.json();


        notificationCount.textContent =
            Number(
                dados.quantidade || 0
            );

    } catch (erro) {

        console.error(
            "Erro ao carregar contador:",
            erro
        );

    }

}


async function carregarNotificacoes() {

    if (!notificationList) {
        return;
    }


    notificationList.innerHTML = `
        <div class="notification-empty">
            Carregando...
        </div>
    `;


    try {

        const resposta =
            await fetch(
                `${API_URL}/notificacoes`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );


        if (
            resposta.status === 401
        ) {

            window.location.href =
                AUTH_PAGE;

            return;

        }


        if (!resposta.ok) {

            throw new Error(
                "Não foi possível carregar as notificações."
            );

        }


        const notificacoes =
            await resposta.json();


        if (
            !Array.isArray(notificacoes) ||
            notificacoes.length === 0
        ) {

            notificationList.innerHTML = `
                <div class="notification-empty">
                    Nenhuma notificação.
                </div>
            `;

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
                            data-notificacao-id="${notificacao.id}"
                            class="notification-read-btn"
                        >
                            Marcar como lida
                        </button>

                    </div>

                `
            ).join("");


        notificationCount.textContent =
            notificacoes.length;

    } catch (erro) {

        console.error(
            "Erro ao carregar notificações:",
            erro
        );

        notificationList.innerHTML = `
            <div class="notification-empty">
                Erro ao carregar notificações.
            </div>
        `;

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


        if (
            resposta.status === 401
        ) {

            window.location.href =
                AUTH_PAGE;

            return;

        }


        if (!resposta.ok) {

            throw new Error(
                "Não foi possível remover a notificação."
            );

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


if (notificationBtn) {

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


if (notificationList) {

    notificationList.addEventListener(
        "click",
        async evento => {

            const botao =
                evento.target.closest(
                    ".notification-read-btn"
                );

            if (!botao) {
                return;
            }


            const id =
                botao.dataset.notificacaoId;


            await deletarNotificacao(id);

        }
    );

}


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
// CHAT
// ============================================================

function adicionarMensagem(
    texto,
    tipo
) {

    if (!chatContainer) {
        return null;
    }


    const messageDiv =
        document.createElement("div");


    messageDiv.classList.add(
        "message-bubble"
    );


    if (
        tipo === "user"
    ) {

        messageDiv.classList.add(
            "user-message"
        );

    } else if (
        tipo === "bot"
    ) {

        messageDiv.classList.add(
            "bot-message"
        );

    } else {

        messageDiv.classList.add(
            "error-message"
        );

    }

    if (
        tipo === "bot" &&
        typeof marked !== "undefined"
    ) {

        messageDiv.innerHTML =
            marked.parse(texto);

    } else {

        messageDiv.textContent =
            texto;

    }


    chatContainer.appendChild(
        messageDiv
    );


    chatContainer.scrollTop =
        chatContainer.scrollHeight;


    return messageDiv;

}


function criarLoading() {

    if (!chatContainer) {
        return null;
    }


    const loading =
        document.createElement("div");


    loading.classList.add(
        "message-bubble",
        "bot-message",
        "mya-loading"
    );


    loading.textContent =
        "MYA está analisando...";


    chatContainer.appendChild(
        loading
    );


    chatContainer.scrollTop =
        chatContainer.scrollHeight;


    return loading;

}


// ============================================================
// ENVIAR MENSAGEM PARA A MYA
// ============================================================

async function enviarMensagem(
    mensagem
) {

    if (
        enviandoMensagem ||
        !mensagem
    ) {

        return;

    }


    enviandoMensagem = true;


    if (userInput) {
        userInput.disabled = true;
    }


    const botaoEnviar =
        chatForm?.querySelector(
            '[type="submit"]'
        );


    if (botaoEnviar) {
        botaoEnviar.disabled = true;
    }


    adicionarMensagem(
        mensagem,
        "user"
    );


    if (userInput) {
        userInput.value = "";
    }


    const loading =
        criarLoading();


    controllerAtual =
        new AbortController();


    try {

        const resposta =
            await fetch(
                `${API_URL}/mya`,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    credentials:
                        "include",

                    signal:
                        controllerAtual.signal,

                    body:
                        JSON.stringify({
                            pergunta:
                                mensagem
                        })

                }
            );


        if (
            resposta.status === 401
        ) {

            throw new Error(
                "Sua sessão expirou. Faça login novamente."
            );

        }


        let dados = null;

        try {

            dados =
                await resposta.json();

        } catch {

            throw new Error(
                "O servidor retornou uma resposta inválida."
            );

        }


        if (!resposta.ok) {

            throw new Error(
                dados?.detail ||
                `Erro ${resposta.status} ao conversar com a MYA.`
            );

        }


        if (
            !dados ||
            typeof dados.resposta !== "string"
        ) {

            throw new Error(
                "A MYA não retornou uma resposta válida."
            );

        }


        adicionarMensagem(
            dados.resposta,
            "bot"
        );


    } catch (erro) {

        if (
            erro.name === "AbortError"
        ) {

            return;

        }


        console.error(
            "Erro ao conversar com a MYA:",
            erro
        );


        adicionarMensagem(
            erro.message ||
            "Não foi possível falar com a MYA.",
            "error"
        );


        if (
            erro.message.includes(
                "sessão expirou"
            )
        ) {

            setTimeout(
                () => {

                    window.location.href =
                        AUTH_PAGE;

                },
                1200
            );

        }

    } finally {

        if (loading) {
            loading.remove();
        }


        controllerAtual =
            null;

        enviandoMensagem =
            false;


        if (userInput) {
            userInput.disabled =
                false;

            userInput.focus();
        }


        if (botaoEnviar) {
            botaoEnviar.disabled =
                false;
        }

    }

}


// ============================================================
// FORMULÁRIO DO CHAT
// ============================================================

if (chatForm) {

    chatForm.addEventListener(
        "submit",
        evento => {

            evento.preventDefault();


            const mensagem =
                userInput?.value.trim() ||
                "";


            if (!mensagem) {
                return;
            }


            enviarMensagem(
                mensagem
            );

        }
    );

}


// ============================================================
// ENTER / SHIFT + ENTER
// ============================================================

if (userInput) {

    userInput.addEventListener(
        "keydown",
        evento => {

            if (
                evento.key === "Enter" &&
                !evento.shiftKey
            ) {

                evento.preventDefault();


                if (chatForm) {

                    chatForm.requestSubmit();

                }

            }

        }
    );

}


// ============================================================
// CANCELAR REQUISIÇÃO EM ANDAMENTO
// ============================================================

window.addEventListener(
    "beforeunload",
    () => {

        if (controllerAtual) {

            controllerAtual.abort();

        }

    }
);


// ============================================================
// INICIALIZAÇÃO
// ============================================================

async function iniciarMYA() {

    atualizarEstadoMenu();

    await carregarUsuario();

    await carregarContadorNotificacoes();

    if (userInput) {
        userInput.focus();
    }

}


iniciarMYA();