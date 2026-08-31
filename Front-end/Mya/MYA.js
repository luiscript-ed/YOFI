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

const buttonUpload =
    document.querySelector(".buttonUpload");

const imageInput =
    document.getElementById("imageInput");

const imagePreview =
    document.getElementById("imagePreview");

const imagePreviewImg =
    document.getElementById("imagePreviewImg");

const imagePreviewName =
    document.getElementById("imagePreviewName");

const removeImageBtn =
    document.getElementById("removeImageBtn");


let imagemSelecionada = null;

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
// APIget
// ============================================================
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
// USUÁRIO
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
// PEGAR DADOS
// ============================================================

const dataAtual = new Date();

const anoAtual = dataAtual.getFullYear();
const mesAtual = dataAtual.getMonth() + 1;

const mesAnterior =
    mesAtual === 1
        ? 12
        : mesAtual - 1;

const anoAnterior =
    mesAtual === 1
        ? anoAtual - 1
        : anoAtual;


// ============================================================
// DADOS FINANCEIROS DO USUÁRIO
// ============================================================

let dadosFinanceirosAnteriores = {

    resumo: {
        saldo: 0,
        ganhos: 0,
        gastos: 0
    },

    economia: {
        receitas: 0,
        despesas: 0,
        valorEconomizado: 0,
        taxa: 0
    },

    ultimasTransacoes: [],

    categorias: [],

    evolucao: [],

    contas: [],

    cartoes: []
};

let dadosFinanceirosAtuais = {

    resumo: {
        saldo: 0,
        ganhos: 0,
        gastos: 0
    },

    economia: {
        receitas: 0,
        despesas: 0,
        valorEconomizado: 0,
        taxa: 0
    },

    ultimasTransacoes: [],

    categorias: [],

    evolucao: [],

    contas: [],

    cartoes: []
};
// ============================================================
// CARREGAR DASHBOARD
// ============================================================

async function carregarDashboardAnterior() {

    try {

        const { resposta, dados } =
            await apiGet(
                `/dashboard?mes=${mesAnterior}&ano=${anoAnterior}`
            );


        if (!resposta.ok) {

            console.error(
                "Erro no dashboard:",
                resposta.status,
                dados
            );

            dadosFinanceirosAnteriores = {
                resumo: {
                    saldo: 0,
                    ganhos: 0,
                    gastos: 0
                },

                economia: {
                    receitas: 0,
                    despesas: 0,
                    valorEconomizado: 0,
                    taxa: 0
                },

                ultimasTransacoes: [],
                categorias: [],
                evolucao: [],
                contas: [],
                cartoes: []
            };

            return null;
        }

        organizarDadosFinanceirosAnterior(dados);

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
// ORGANIZAR DADOS FINANCEIROS
// ============================================================

function organizarDadosFinanceirosAnterior(dados) {

    const resumo =
        dados?.resumo || {};

    const economia =
        dados?.economia || {};


    dadosFinanceirosAnteriores = {

        // ----------------------------------------------------
        // RESUMO
        // ----------------------------------------------------

        resumo: {

            saldo:
                Number(
                    resumo.saldo
                ) || 0,

            ganhos:
                Number(
                    resumo.ganhos
                ) || 0,

            gastos:
                Number(
                    resumo.gastos
                ) || 0
        },


        // ----------------------------------------------------
        // ECONOMIA
        // ----------------------------------------------------

        economia: {

            receitas:
                Number(
                    economia.receitas
                ) || 0,

            despesas:
                Number(
                    economia.despesas
                ) || 0,

            valorEconomizado:
                Math.max(
                    0,
                    Number(
                        economia.valor_economizado
                    ) || 0
                ),

            taxa:
                Math.max(
                    0,
                    Math.min(
                        100,
                        Number(
                            economia.taxa
                        ) || 0
                    )
                )
        },


        // ----------------------------------------------------
        // TRANSAÇÕES
        // ----------------------------------------------------

        ultimasTransacoes:
            Array.isArray(
                dados?.ultimas_transacoes
            )
                ? dados.ultimas_transacoes
                : [],


        // ----------------------------------------------------
        // CATEGORIAS
        // ----------------------------------------------------

        categorias:
            Array.isArray(
                dados?.categorias
            )
                ? dados.categorias
                : [],


        // ----------------------------------------------------
        // EVOLUÇÃO
        // ----------------------------------------------------

        evolucao:
            Array.isArray(
                dados?.evolucao
            )
                ? dados.evolucao
                : [],


        // ----------------------------------------------------
        // CONTAS
        // ----------------------------------------------------

        contas:
            Array.isArray(
                dados?.contas
            )
                ? dados.contas
                : [],


        // ----------------------------------------------------
        // CARTÕES
        // ----------------------------------------------------

        cartoes:
            Array.isArray(
                dados?.cartoes
            )
                ? dados.cartoes
                : []
    };


    console.log(
        "Dados financeiros Anteriores:",
        dadosFinanceirosAnteriores
    );
}

async function carregarDashboardAtual() {

    try {

        const { resposta, dados } =
            await apiGet(
                `/dashboard?mes=${mesAtual}&ano=${anoAtual}`
            );


        if (!resposta.ok) {

            console.error(
                "Erro no dashboard:",
                resposta.status,
                dados
            );

            dadosFinanceirosAtuais = {
                resumo: {
                    saldo: 0,
                    ganhos: 0,
                    gastos: 0
                },

                economia: {
                    receitas: 0,
                    despesas: 0,
                    valorEconomizado: 0,
                    taxa: 0
                },

                ultimasTransacoes: [],
                categorias: [],
                evolucao: [],
                contas: [],
                cartoes: []
            };

            return null;
        }

        organizarDadosFinanceirosAtual(dados);

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
// ORGANIZAR DADOS FINANCEIROS
// ============================================================

function organizarDadosFinanceirosAtual(dados) {

    const resumo =
        dados?.resumo || {};

    const economia =
        dados?.economia || {};


    dadosFinanceirosAtuais = {

        // ----------------------------------------------------
        // RESUMO
        // ----------------------------------------------------

        resumo: {

            saldo:
                Number(
                    resumo.saldo
                ) || 0,

            ganhos:
                Number(
                    resumo.ganhos
                ) || 0,

            gastos:
                Number(
                    resumo.gastos
                ) || 0
        },


        // ----------------------------------------------------
        // ECONOMIA
        // ----------------------------------------------------

        economia: {

            receitas:
                Number(
                    economia.receitas
                ) || 0,

            despesas:
                Number(
                    economia.despesas
                ) || 0,

            valorEconomizado:
                Math.max(
                    0,
                    Number(
                        economia.valor_economizado
                    ) || 0
                ),

            taxa:
                Math.max(
                    0,
                    Math.min(
                        100,
                        Number(
                            economia.taxa
                        ) || 0
                    )
                )
        },


        // ----------------------------------------------------
        // TRANSAÇÕES
        // ----------------------------------------------------

        ultimasTransacoes:
            Array.isArray(
                dados?.ultimas_transacoes
            )
                ? dados.ultimas_transacoes
                : [],


        // ----------------------------------------------------
        // CATEGORIAS
        // ----------------------------------------------------

        categorias:
            Array.isArray(
                dados?.categorias
            )
                ? dados.categorias
                : [],


        // ----------------------------------------------------
        // EVOLUÇÃO
        // ----------------------------------------------------

        evolucao:
            Array.isArray(
                dados?.evolucao
            )
                ? dados.evolucao
                : [],


        // ----------------------------------------------------
        // CONTAS
        // ----------------------------------------------------

        contas:
            Array.isArray(
                dados?.contas
            )
                ? dados.contas
                : [],


        // ----------------------------------------------------
        // CARTÕES
        // ----------------------------------------------------

        cartoes:
            Array.isArray(
                dados?.cartoes
            )
                ? dados.cartoes
                : []
    };


    console.log(
        "Dados financeiros Atuais",
        dadosFinanceirosAtuais
    );
}

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

mensagemErroMYAcansada = " A MYA está temporariamente com alta demanda. Aguarde alguns segundos e tente novamente. "

async function enviarMensagem(mensagem) {

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
            ".buttonMya"
        );

    if (botaoEnviar) {
        botaoEnviar.disabled = true;
    }

    const imagemAtual =
        imagemSelecionada || null;

    if (imagemAtual) {

        adicionarMensagem(
            `${mensagem}\n📎 ${imagemAtual.name}`,
            "user"
        );

    } else {

        adicionarMensagem(
            mensagem,
            "user"
        );

    }

    if (userInput) {
        userInput.value = "";
    }

    const loading =
        criarLoading();

    controllerAtual =
        new AbortController();

    try {

        const contextoFinanceiro = {
            mes_anterior:
                dadosFinanceirosAnteriores,

            mes_atual:
                dadosFinanceirosAtuais
        };

        const formData =
            new FormData();

        formData.append(
            "pergunta",
            mensagem
        );

        formData.append(
            "contexto_financeiro",
            JSON.stringify(
                contextoFinanceiro
            )
        );

        if (imagemAtual) {

            formData.append(
                "imagem",
                imagemAtual
            );

        }

        const resposta =
            await fetch(
                `${API_URL}/mya`,
                {
                    method: "POST",

                    credentials:
                        "include",

                    signal:
                        controllerAtual.signal,

                    body:
                        formData
                }
            );

        if (resposta.status === 401) {
            throw new Error(
                "Sua sessão expirou. Faça login novamente."
            );};

        if (resposta.status === 429) {
            adicionarMensagem(
                mensagemErroMYAcansada,
                "error"
            );

            throw new Error(
                "A MYA está sobrecarregada. Tente novamente mais tarde."
            );};

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

        imagemSelecionada = null;


        if (imageInput) {
            imageInput.value = "";
        }

        if (imagePreviewImg) {
            URL.revokeObjectURL(
            imagePreviewImg.src
        );

        imagePreviewImg.src = "";
        }

        if (imagePreview) {
            imagePreview.classList.add(
            "hidden"
            );
        }

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
            erro.message &&
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

if (buttonUpload && imageInput) {

    buttonUpload.addEventListener(
        "click",
        () => {
            imageInput.click();
        }
    );

    imageInput.addEventListener(
        "change",
        () => {

            const arquivo =
                imageInput.files?.[0];

            if (!arquivo) {
                return;
            }

            const tiposPermitidos = [
                "image/png",
                "image/jpeg",
                "image/webp",
                "image/gif"
            ];

            if (
                !tiposPermitidos.includes(
                    arquivo.type
                )
            ) {

                alert(
                    "Formato de imagem não permitido."
                );

                imageInput.value = "";
                imagemSelecionada = null;

                return;
            }

            const tamanhoMaximo =
                5 * 1024 * 1024;

            if (
                arquivo.size >
                tamanhoMaximo
            ) {

                alert(
                    "A imagem deve ter no máximo 5 MB."
                );

                imageInput.value = "";
                imagemSelecionada = null;

                return;
            }

            imagemSelecionada =
                arquivo;

            imagePreviewName.textContent =
                arquivo.name;

            imagePreviewImg.src =
                URL.createObjectURL(
                    arquivo
                );

            imagePreview.classList.remove(
                "hidden"
            );

            console.log(
                "Imagem selecionada:",
                arquivo.name
            );
        }
    );
}

if (removeImageBtn) {

    removeImageBtn.addEventListener(
        "click",
        () => {

            imagemSelecionada = null;

            if (imageInput) {
                imageInput.value = "";
            }

            if (imagePreviewImg) {
                URL.revokeObjectURL(
                    imagePreviewImg.src
                );

                imagePreviewImg.src = "";
            }

            if (imagePreview) {
                imagePreview.classList.add(
                    "hidden"
                );
            }

            if (imagePreviewName) {
                imagePreviewName.textContent =
                    "Imagem selecionada";
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

    const autenticado = await verificarLogin();

    if (!autenticado) {
        return;
    }

    await carregarContadorNotificacoes();

    await carregarDashboardAnterior();
    await carregarDashboardAtual();

    if (userInput) {
        userInput.focus();
    }

}



iniciarMYA();