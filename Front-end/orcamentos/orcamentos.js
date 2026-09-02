const API_URL = "https://yofi-api.onrender.com";

// ============================================================
// ELEMENTOS
// ============================================================

const sidebar = document.getElementById("sidebar");
const app = document.getElementById("app");
const menuBtn = document.getElementById("menuBtn");

const orcamentoForm = document.getElementById("orcamentoForm");
const orcamentoId = document.getElementById("orcamentoId");

const categoriaInput = document.getElementById("categoria");
const limiteInput = document.getElementById("limite");
const mesInput = document.getElementById("mes");
const anoInput = document.getElementById("ano");

const salvarOrcamento =
document.getElementById("salvarOrcamento");

const cancelarEdicao =
document.getElementById("cancelarEdicao");

const formTitulo =
document.getElementById("formTitulo");

const mensagem =
document.getElementById("mensagem");

const orcamentosList =
document.getElementById("orcamentosList");

const totalOrcamentos =
document.getElementById("totalOrcamentos");

const limiteTotal =
document.getElementById("limiteTotal");

const gastoTotal =
document.getElementById("gastoTotal");

const disponivelTotal =
document.getElementById("disponivelTotal");

const usuarioNome =
document.getElementById("usuarioNome");

const usuarioEmail =
document.getElementById("usuarioEmail");

// ============================================================
// ESTADO
// ============================================================

let orcamentos = [];

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


const div = document.createElement("div");

div.textContent = texto ?? "";

return div.innerHTML;


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

menuBtn.addEventListener("click", () => {


if (window.innerWidth <= 800) {

    sidebar.classList.toggle("open");

} else {

    sidebar.classList.toggle("closed");
    app.classList.toggle("sidebar-closed");

}

atualizarMenu();

});

// ============================================================
// FECHAR SIDEBAR NO MOBILE AO CLICAR EM UM LINK
// ============================================================

document.querySelectorAll(".sidebar-link").forEach(link => {


link.addEventListener("click", () => {

    if (window.innerWidth <= 800) {

        sidebar.classList.remove("open");

    }

});


});

// ============================================================
// USUÁRIO
// ============================================================

async function carregarUsuario() {


try {

    const resposta = await fetch(
        `${API_URL}/me`,
        {
            method: "GET",
            credentials: "include"
        }
    );

    if (!resposta.ok) {

        if (resposta.status === 401) {

            window.location.href =
                "https://luiscript-ed.github.io/YOFI/Front-end/autentification/autentification";

        }

        return;

    }

    const dados = await resposta.json();

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
document.getElementById("notificationBtn");

const notificationPanel =
document.getElementById("notificationPanel");

const notificationCount =
document.getElementById("notificationCount");

const notificationList =
document.getElementById("notificationList");

notificationBtn.addEventListener("click", async () => {


notificationPanel.classList.toggle("hidden");

if (
    !notificationPanel.classList.contains("hidden")
) {

    await carregarNotificacoes();

}


});

async function carregarContadorNotificacoes() {


try {

    const resposta = await fetch(
        `${API_URL}/notificacoes/contador`,
        {
            credentials: "include"
        }
    );

    if (!resposta.ok) {
        return;
    }

    const dados = await resposta.json();

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

    const resposta = await fetch(
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

        notificationCount.textContent = "0";

        return;

    }

    notificationList.innerHTML =
        notificacoes.map(notificacao => `

            <div class="notification-item">

                <strong>
                    ${escaparHTML(notificacao.titulo)}
                </strong>

                <p>
                    ${escaparHTML(notificacao.mensagem)}
                </p>

                <button
                    type="button"
                    onclick="deletarNotificacao(${notificacao.id})"
                >
                    Marcar como lida
                </button>

            </div>

        `).join("");

} catch (erro) {

    console.error(
        "Erro ao carregar notificações:",
        erro
    );

}


}

async function deletarNotificacao(id) {


try {

    const resposta = await fetch(
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

// Fecha o painel clicando fora

document.addEventListener("click", (evento) => {

if (
    !notificationPanel.contains(evento.target) &&
    !notificationBtn.contains(evento.target)
) {

    notificationPanel.classList.add("hidden");

}

});

// ============================================================
// CARREGAR ORÇAMENTOS
// ============================================================

async function carregarOrcamentos() {

orcamentosList.innerHTML =
    `<div class="empty-state">
        Carregando orçamentos...
    </div>`;

try {

    const resposta = await fetch(
        `${API_URL}/orcamentos`,
        {
            method: "GET",
            credentials: "include"
        }
    );

    if (!resposta.ok) {

        if (resposta.status === 401) {

            window.location.href =
                "https://luiscript-ed.github.io/YOFI/Front-end/autentification/autentification";

            return;

        }

        throw new Error(
            "Não foi possível carregar os orçamentos."
        );

    }

    orcamentos =
        await resposta.json();

    renderizarOrcamentos();

} catch (erro) {

    console.error(
        "Erro ao carregar orçamentos:",
        erro
    );

    orcamentosList.innerHTML =
        `<div class="empty-state">
            Erro ao carregar os orçamentos.
        </div>`;

}

}

// ============================================================
// RENDERIZAR
// ============================================================

function renderizarOrcamentos() {

atualizarResumo();


if (!orcamentos.length) {

    orcamentosList.innerHTML =
        `<div class="empty-state">
            Nenhum orçamento cadastrado ainda.
        </div>`;

    return;

}


orcamentosList.innerHTML =
    orcamentos.map(orcamento => {

        const limite =
            Number(orcamento.limite || 0);

        const gasto =
            Number(orcamento.gasto || 0);

        const disponivel =
            Number(orcamento.disponivel || 0);

        const percentual =
            Number(orcamento.percentual || 0);

        const percentualVisual =
            Math.min(
                Math.max(percentual, 0),
                100
            );

        let status = "Dentro do limite";
        let classe = "";

        if (percentual >= 100) {

            status = "Limite ultrapassado";
            classe = "danger";

        } else if (percentual >= 80) {

            status = "Próximo do limite";
            classe = "warning";

        }


        return `

            <article class="budget-card">

                <div class="budget-card-header">

                    <div class="budget-card-title">

                        <h3>
                            ${escaparHTML(
                                orcamento.categoria
                            )}
                        </h3>

                        <span>
                            ${nomeMes(orcamento.mes)}
                            /${orcamento.ano}
                        </span>

                    </div>

                    <span class="budget-status">
                        ${status}
                    </span>

                </div>


                <div class="budget-values">

                    <div class="budget-value">

                        <span>
                            Limite
                        </span>

                        <strong>
                            ${formatarMoeda(limite)}
                        </strong>

                    </div>


                    <div class="budget-value">

                        <span>
                            Gasto
                        </span>

                        <strong>
                            ${formatarMoeda(gasto)}
                        </strong>

                    </div>


                    <div class="budget-value">

                        <span>
                            Disponível
                        </span>

                        <strong>
                            ${formatarMoeda(disponivel)}
                        </strong>

                    </div>

                </div>


                <div class="progress-bar">

                    <div
                        class="progress-fill ${classe}"
                        style="width: ${percentualVisual}%"
                    ></div>

                </div>


                <div class="budget-progress-text">

                    <span>
                        ${percentual.toFixed(1)}% utilizado
                    </span>

                    <span>
                        ${nomeMes(orcamento.mes)}/${orcamento.ano}
                    </span>

                </div>


                <div class="budget-actions">

                    <button
                        type="button"
                        class="budget-action"
                        onclick="editarOrcamento(${orcamento.id})"
                    >
                        Editar
                    </button>

                    <button
                        type="button"
                        class="budget-action delete"
                        onclick="deletarOrcamento(${orcamento.id})"
                    >
                        Excluir
                    </button>

                </div>

            </article>

        `;

    }).join("");

}

// ============================================================
// RESUMO
// ============================================================

function atualizarResumo() {


const total =
    orcamentos.length;

const limite =
    orcamentos.reduce(
        (soma, item) =>
            soma + Number(item.limite || 0),
        0
    );

const gasto =
    orcamentos.reduce(
        (soma, item) =>
            soma + Number(item.gasto || 0),
        0
    );

const disponivel =
    limite - gasto;


totalOrcamentos.textContent =
    total;

limiteTotal.textContent =
    formatarMoeda(limite);

gastoTotal.textContent =
    formatarMoeda(gasto);

disponivelTotal.textContent =
    formatarMoeda(disponivel);

}

// ============================================================
// NOME DO MÊS
// ============================================================

function nomeMes(numero) {

const meses = [

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

return meses[
    Number(numero) - 1
] || "Mês inválido";

}

// ============================================================
// FORMULÁRIO
// ============================================================

orcamentoForm.addEventListener(
"submit",
async (evento) => {
    evento.preventDefault();


    const id =
        orcamentoId.value;

    const dados = {

        categoria:
            categoriaInput.value.trim(),

        mes:
            Number(mesInput.value),

        ano:
            Number(anoInput.value),

        limite:
            Number(limiteInput.value)

    };


    salvarOrcamento.disabled = true;


    if (id) {

        salvarOrcamento.textContent =
            "Salvando...";

    } else {

        salvarOrcamento.textContent =
            "Criando...";

    }


    limparMensagem();


    try {

        const resposta = await fetch(

            id
                ? `${API_URL}/orcamentos/${id}`
                : `${API_URL}/orcamentos`,

            {

                method:
                    id
                        ? "PUT"
                        : "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                credentials: "include",

                body:
                    JSON.stringify(dados)

            }

        );


        const resultado =
            await resposta.json();


        if (!resposta.ok) {

            throw new Error(
                resultado.detail ||
                "Não foi possível salvar o orçamento."
            );

        }


        mostrarMensagem(
            resultado.mensagem ||
            "Orçamento salvo com sucesso!",
            "success"
        );


        limparFormulario();

        await carregarOrcamentos();

        await carregarContadorNotificacoes();

    } catch (erro) {

        console.error(
            "Erro ao salvar orçamento:",
            erro
        );

        mostrarMensagem(
            erro.message ||
            "Erro ao salvar orçamento.",
            "error"
        );

    } finally {

        salvarOrcamento.disabled = false;

        salvarOrcamento.textContent =
            "Criar orçamento";

    }

}

);

// ============================================================
// EDITAR
// ============================================================

function editarOrcamento(id) {

const orcamento =
    orcamentos.find(
        item => Number(item.id) === Number(id)
    );

if (!orcamento) {
    return;
}


orcamentoId.value =
    orcamento.id;

categoriaInput.value =
    orcamento.categoria;

limiteInput.value =
    orcamento.limite;

mesInput.value =
    orcamento.mes;

anoInput.value =
    orcamento.ano;


formTitulo.textContent =
    "Editar orçamento";

salvarOrcamento.textContent =
    "Salvar alterações";

cancelarEdicao.classList.remove(
    "hidden"
);


window.scrollTo({
    top: 0,
    behavior: "smooth"
});

}

window.editarOrcamento =
editarOrcamento;

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
// DELETAR
// ============================================================

async function deletarOrcamento(id) {


const confirmar =
    confirm(
        "Tem certeza que deseja excluir este orçamento?"
    );

if (!confirmar) {
    return;
}


try {

    const resposta = await fetch(
        `${API_URL}/orcamentos/${id}`,
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
            "Não foi possível excluir o orçamento."
        );

    }


    mostrarMensagem(
        resultado.mensagem ||
        "Orçamento excluído com sucesso!",
        "success"
    );


    await carregarOrcamentos();

} catch (erro) {

    console.error(
        "Erro ao excluir orçamento:",
        erro
    );

    mostrarMensagem(
        erro.message ||
        "Erro ao excluir orçamento.",
        "error"
    );

}

}

window.deletarOrcamento =
deletarOrcamento;

// ============================================================
// LIMPAR FORMULÁRIO
// ============================================================

function limparFormulario() {


orcamentoId.value = "";

categoriaInput.value = "";

limiteInput.value = "";

formTitulo.textContent =
    "Criar orçamento";

salvarOrcamento.textContent =
    "Criar orçamento";

cancelarEdicao.classList.add(
    "hidden"
);


const agora =
    new Date();

mesInput.value =
    agora.getMonth() + 1;

anoInput.value =
    agora.getFullYear();


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


const agora =
    new Date();

mesInput.value =
    agora.getMonth() + 1;

anoInput.value =
    agora.getFullYear();


await carregarUsuario();

await carregarOrcamentos();

await carregarContadorNotificacoes();


}

iniciarPagina();
