const notificacaoBtn = querySelector('.notificacao-btn');

const botoesCategoria = querySelectorAll('.categoria-btn');
botoesCategoria.forEach((botao) => {
    botao.addEventListener("click", () => {
        const categoria = botao.dataset.categoria;
        console.log("Categoria selecionada: ${categoria}");
    });
});

const API_URL =
    "https://yofi-api.onrender.com";


// ============================================================
// ELEMENTOS
// ============================================================

const sidebar = document.getElementById("sidebar");

const app = document.getElementById("app");

const menuBtn = document.getElementById("menuBtn");

const formTitulo = document.getElementById("formTitulo");

const mensagem = document.getElementById("mensagem");

const usuarioNome = document.getElementById("usuarioNome");

const usuarioEmail = document.getElementById("usuarioEmail");

const usuarioImagem = document.getElementById("usuarioImagem");

const valores = document.querySelectorAll('.valor-categoria');

const totalDespesas = valores[0];
const alimentacao = valores[1];
const transporte = valores[2];
const moradia = valores[3];
const lazer = valores[4];
const saude = valores[5];
const educacao = valores[6];
const compras = valores[7];
const assinaturas = valores[8];
const outrasDespesas = valores[9];

const totalReceitas = valores[10];
const salario = valores[11];
const freelance = valores[12];
const investimentos = valores[13];
const presente = valores[14];
const reembolso = valores[15];
const beneficios = valores[16];
const vendas = valores[17];
const servicos = valores[18];
const outrasReceitas = valores[19];

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
                    "https://luiscript-ed.github.io/YOFI/Front-end/autentification/autentification";

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

            if (usuarioImagem) {
                if (dados.imagem) {
                    usuarioImagem.src = dados.imagem;
                    usuarioImagem.alt = dados.nome || "Foto do usuário";
                } else {
                    usuarioImagem.src = "../Imagens-Audios/404/usuarioGenerico.png";
                    usuarioImagem.alt = "Usuário";
                }
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
// CATEGORIAS
// ============================================================

async function carregarCategoriasReceitas() {

    try {

        const resposta =
            await fetch(
                `${API_URL}/categorias/receitas`,
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
                "Não foi possível carregar as categorias de receita."
            );

        }

        categoriasReceitas =
            await resposta.json();

        renderizarCategoriasReceitas();

    } catch (erro) {

        console.error(
            "Erro ao carregar as categorias de receita:",
            erro
        );
    }

}

async function carregarCategoriasDespesas() {

    try {

        const resposta =
            await fetch(
                `${API_URL}/categorias/despesas`,
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
                "Não foi possível carregar as categorias de despesas."
            );

        }

        categoriasReceitas =
            await resposta.json();

        renderizarCategoriasDespesas();

    } catch (erro) {

        console.error(
            "Erro ao carregar as categorias do tipo despesas:",
            erro
        );
    }

}
// ============================================================
// RENDERIZAR
// ============================================================

function renderizarCategoriasReceitas() {

    atualizarResumo();


    if (
        !categoriasReceitas.length
    ) {

       console.log("Voce não têm nehuma transação")

        return;

    }

    const ganhosTotais = null

    categoriasReceitas.map(
        categoriaGanho => {

            const categoriaAtual = categoriaGanho.categoria || 0
        
            const valorAtual =
                Number(
                    categoriaGanho.valor || 0
                );

                ganhosTotais += valorAtual

            if (categoriaAtual == "salario") {
                salario.textContent = `R$ ${valorAtual}`
            } else if (categoriaAtual == "freelance") {
                freelance.textContent = `R$ ${valorAtual}`
            } else if (categoriaAtual == "investimentos") {
                investimentos.textContent = `R$ ${valorAtual}`
            } else if (categoriaAtual == "presente") {
                presente.textContent = `R$ ${valorAtual}`
            } else if (categoriaAtual == "reembolso") {
                reembolso.textContent = `R$ ${valorAtual}`
            } else if (categoriaAtual == "beneficios") {
                beneficios.textContent = `R$ ${valorAtual}`
            } else if (categoriaAtual == "vendas") {
                vendas.textContent = `R$ ${valorAtual}`
            } else if (categoriaAtual == "servicos") {
                servicos.textContent = `R$ ${valorAtual}`
            } else if (categoriaAtual == "outros-receitas") {
                outrasReceitas.textContent = `R$ ${valorAtual}`
            }

        }
    ).join("");

    totalReceitas.textContent = `R$ ${ganhosTotais}`
}

function renderizarCategoriasDespesas() {

    atualizarResumo();


    if (
        !categorias.length
    ) {

       console.log("Voce não têm nehuma transação")

        return;

    }
    const gastosTotais = null
        
    categoriasReceitas.map(
            categoriaReceita => {

                const categoriaAtual = categoriaReceita.categoria || 0

                const valorAtual =
                    Number(
                        categoria.valor || 0
                    );

            gastosTotais += valorAtual

            if (categoriaAtual == "alimentacao") {
                alimentacao.textContent = `R$ ${valorAtual}`
            } else if (categoriaAtual == "transporte") {
                transporte.textContent = `R$ ${valorAtual}`
            } else if (categoriaAtual == "moradia") {
                moradia.textContent = `R$ ${valorAtual}`
            } else if (categoriaAtual == "lazer") {
                lazer.textContent = `R$ ${valorAtual}`
            } else if (categoriaAtual == "saude") {
                saude.textContent = `R$ ${valorAtual}`
            } else if (categoriaAtual == "educacao") {
                educacao.textContent = `R$ ${valorAtual}`
            } else if (categoriaAtual == "compras") {
                compras.textContent = `R$ ${valorAtual}`
            } else if (categoriaAtual == "assinaturas") {
                assinaturas.textContent = `R$ ${valorAtual}`
            } else if (categoriaAtual == "outros-despesas") {
                outrasDespesas.textContent = `R$ ${valorAtual}`
            }

        }
        ).join("");

        totalDespesas.textContent = `R$ ${gastosTotais}`
}

// ============================================================
// ALTERAR VISUALIZAÇÃO
// ============================================================

const alterarModo = document.getElementById("alterarModo");

function aplicarModoSalvo() {

    const modo = localStorage.getItem("modoYofi");

    if (modo === "claro") {
        document.body.classList.add("modo-claro");
    }

}

aplicarModoSalvo();


alterarModo?.addEventListener("click", () => {

    document.body.classList.toggle("modo-claro");

    const modoClaro =
        document.body.classList.contains("modo-claro");

    localStorage.setItem(
        "modoYofi",
        modoClaro ? "claro" : "escuro"
    );

});

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

    await carregarCategoriasDespesas();
    await carregarCategoriasReceitas();

    await carregarContadorNotificacoes();

}


iniciarPagina();
