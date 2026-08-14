const API_URL = "https://yofi-api.onrender.com";

const formGastos = document.getElementById("gastosForm");
const formGanhos = document.getElementById("ganhosForm");
const formMovimentacao = document.getElementById("movimentacaoForm");

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");

const notificationBtn = document.getElementById("notificationBtn");
const notificationPanel = document.getElementById("notificationPanel");
const notificationList = document.getElementById("notificationList");
const notificationCount = document.getElementById("notificationCount");

let usuario = null;
let contas = [];
let cartoes = [];
let enviando = false;


// ============================================================
// UTILIDADES
// ============================================================

function salvarUrlAtual() {
    localStorage.setItem(
        "urlSalva",
        window.location.href
    );
}

function escaparHTML(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}

function hojeISO() {
    const agora = new Date();

    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );
}

function mostrarErro(mensagem) {
    console.error(mensagem);
    alert(mensagem);
}

function definirLoading(form, carregando) {

    const botao = form.querySelector(".botao-salvar");

    if (!botao) {
        return;
    }

    if (carregando) {

        botao.dataset.textoOriginal =
            botao.textContent.trim();

        botao.disabled = true;
        botao.textContent = "Salvando...";

    } else {

        botao.disabled = false;

        botao.textContent =
            botao.dataset.textoOriginal ||
            "Confirmar";
    }
}


// ============================================================
// AUTENTICAÇÃO
// ============================================================

async function verificarLogin() {

    try {

        const resposta = await fetch(
            `${API_URL}/me`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        if (!resposta.ok) {

            console.error(
                "Usuário não autenticado:",
                resposta.status
            );

            return false;
        }

        usuario = await resposta.json();

        console.log(
            "Usuário autenticado:",
            usuario
        );

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
// USUÁRIO
// ============================================================

function preencherUsuario() {

    const nome =
        document.getElementById("usuarioNome");

    const email =
        document.getElementById("usuarioEmail");

    if (nome) {
        nome.textContent =
            usuario?.nome || "Usuário";
    }

    if (email) {
        email.textContent =
            usuario?.email || "";
    }
}


// ============================================================
// CONTAS E CARTÕES
// ============================================================

async function carregarContas() {

    const resposta = await fetch(
        `${API_URL}/contas`,
        {
            method: "GET",
            credentials: "include"
        }
    );

    if (!resposta.ok) {
        throw new Error(
            "Não foi possível carregar suas contas."
        );
    }

    contas = await resposta.json();

    return contas;
}


async function carregarCartoes() {

    const resposta = await fetch(
        `${API_URL}/cartoes`,
        {
            method: "GET",
            credentials: "include"
        }
    );

    if (!resposta.ok) {
        throw new Error(
            "Não foi possível carregar seus cartões."
        );
    }

    cartoes = await resposta.json();

    return cartoes;
}


// ============================================================
// SELECTS
// ============================================================

function localizarSelect(form, name) {

    if (!form) {
        return null;
    }

    return form.querySelector(
        `[name="${name}"]`
    );
}


function montarOpcoesFinanceiras(select) {

    if (!select) {
        return;
    }

    select.innerHTML = "";

    const primeiraOpcao =
        document.createElement("option");

    primeiraOpcao.value = "";
    primeiraOpcao.textContent =
        "Selecione uma conta ou cartão";

    select.appendChild(
        primeiraOpcao
    );


    if (contas.length) {

        const grupoContas =
            document.createElement("optgroup");

        grupoContas.label =
            "Contas";


        contas
            .filter(conta => conta.ativo)
            .forEach(conta => {

                const option =
                    document.createElement("option");

                option.value =
                    `conta:${conta.id}`;

                option.textContent =
                    `${conta.nome} — ${formatarMoeda(conta.saldo_atual)}`;

                grupoContas.appendChild(
                    option
                );

            });

        select.appendChild(
            grupoContas
        );
    }


    if (cartoes.length) {

        const grupoCartoes =
            document.createElement("optgroup");

        grupoCartoes.label =
            "Cartões";


        cartoes
            .filter(cartao => cartao.ativo)
            .forEach(cartao => {

                const option =
                    document.createElement("option");

                option.value =
                    `cartao:${cartao.id}`;

                option.textContent =
                    `${cartao.nome} — disponível ${formatarMoeda(cartao.disponivel)}`;

                grupoCartoes.appendChild(
                    option
                );

            });

        select.appendChild(
            grupoCartoes
        );
    }
}


function montarSelects() {

    const selectGasto =
        localizarSelect(
            formGastos,
            "conta_cartao"
        );

    const selectGanho =
        localizarSelect(
            formGanhos,
            "conta_cartao"
        );

    const selectOrigem =
        localizarSelect(
            formMovimentacao,
            "origem"
        );

    const selectDestino =
        localizarSelect(
            formMovimentacao,
            "destino"
        );


    montarOpcoesFinanceiras(
        selectGasto
    );

    montarOpcoesFinanceiras(
        selectGanho
    );

    montarOpcoesFinanceiras(
        selectOrigem
    );

    montarOpcoesFinanceiras(
        selectDestino
    );
}


function interpretarOrigem(valor) {

    if (!valor) {
        return null;
    }

    const partes =
        valor.split(":");

    if (
        partes.length !== 2
    ) {
        return null;
    }

    return {
        tipo: partes[0],
        id: Number(partes[1])
    };
}


// ============================================================
// DATA
// ============================================================

function preencherDatas() {

    document
        .querySelectorAll('input[type="date"]')
        .forEach(input => {

            if (!input.value) {
                input.value = hojeISO();
            }

        });
}


// ============================================================
// NOTIFICAÇÕES
// ============================================================

async function atualizarContadorNotificacoes() {

    try {

        const resposta = await fetch(
            `${API_URL}/notificacoes/contador`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        if (!resposta.ok) {
            return;
        }

        const dados =
            await resposta.json();

        if (notificationCount) {

            notificationCount.textContent =
                dados.quantidade || 0;
        }

    } catch (erro) {

        console.error(
            "Erro ao atualizar notificações:",
            erro
        );
    }
}


async function carregarNotificacoes() {

    if (!notificationList) {
        return;
    }

    notificationList.innerHTML =
        `<div class="notification-empty">
            Carregando...
        </div>`;


    try {

        const resposta = await fetch(
            `${API_URL}/notificacoes`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        if (!resposta.ok) {

            notificationList.innerHTML =
                `<div class="notification-empty">
                    Não foi possível carregar as notificações.
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
        await atualizarContadorNotificacoes();

    } catch (erro) {

        console.error(
            "Erro ao excluir notificação:",
            erro
        );
    }
}


window.deletarNotificacao =
    deletarNotificacao;


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
// SIDEBAR
// ============================================================

if (menuBtn && sidebar) {

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
            }
        }
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

                    sidebar?.classList.remove(
                        "open"
                    );
                }
            }
        );

    });


// ============================================================
// TRANSAÇÕES
// ============================================================

async function criarTransacao({
    form,
    tipo,
    categoria,
    valor,
    descricao,
    data,
    origem
}) {

    if (!origem) {

        throw new Error(
            "Selecione uma conta ou cartão."
        );
    }


    if (
        !origem.id ||
        !["conta", "cartao"].includes(
            origem.tipo
        )
    ) {

        throw new Error(
            "A conta ou cartão selecionado é inválido."
        );
    }


    if (
        !Number.isFinite(valor) ||
        valor <= 0
    ) {

        throw new Error(
            "Informe um valor válido."
        );
    }


    if (!categoria) {

        throw new Error(
            "Selecione uma categoria."
        );
    }


    if (!data) {

        throw new Error(
            "Informe a data da transação."
        );
    }


    const dados = {

        tipo: tipo,

        categoria: categoria,

        valor: valor,

        descricao:
            descricao || null,

        data:
            `${data}T12:00:00`

    };


    if (origem.tipo === "conta") {

        dados.conta_id =
            origem.id;

        dados.cartao_id =
            null;

    } else {

        dados.cartao_id =
            origem.id;

        dados.conta_id =
            null;
    }


    const resposta =
        await fetch(
            `${API_URL}/transacoes`,
            {

                method: "POST",

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


    let resultado = {};

    try {

        resultado =
            await resposta.json();

    } catch {

        resultado = {};
    }


    if (!resposta.ok) {

        throw new Error(
            resultado.detail ||
            "Erro ao cadastrar a transação."
        );
    }


    return resultado;
}


// ============================================================
// DESPESAS
// ============================================================

async function processarDespesa(evento) {

    evento.preventDefault();

    if (enviando) {
        return;
    }

    enviando = true;

    definirLoading(
        formGastos,
        true
    );


    try {

        const valorInput =
            formGastos.querySelector(
                '[name="valor"]'
            );

        const categoriaInput =
            formGastos.querySelector(
                '[name="categoria"]'
            );

        const descricaoInput =
            formGastos.querySelector(
                '[name="descricao"]'
            );

        const dataInput =
            formGastos.querySelector(
                '[name="data"]'
            );

        const contaCartaoInput =
            localizarSelect(
                formGastos,
                "conta_cartao"
            );


        const valor =
            Number(
                valorInput?.value
            );

        const categoria =
            categoriaInput?.value
            ?.trim();

        const descricao =
            descricaoInput?.value
            ?.trim();

        const data =
            dataInput?.value;

        const origem =
            interpretarOrigem(
                contaCartaoInput?.value
            );


        const resultado =
            await criarTransacao({

                form: formGastos,

                tipo: "gasto",

                categoria,

                valor,

                descricao,

                data,

                origem
            });


        alert(
            resultado.mensagem ||
            "Despesa registrada com sucesso!"
        );


        formGastos.reset();

        preencherDatas();


        await carregarContas();
        await carregarCartoes();

        montarSelects();

        await atualizarContadorNotificacoes();


    } catch (erro) {

        console.error(
            "Erro ao registrar despesa:",
            erro
        );

        mostrarErro(
            erro.message ||
            "Erro ao registrar despesa."
        );

    } finally {

        enviando = false;

        definirLoading(
            formGastos,
            false
        );
    }
}


// ============================================================
// ENTRADAS
// ============================================================

async function processarEntrada(evento) {

    evento.preventDefault();

    if (enviando) {
        return;
    }

    enviando = true;

    definirLoading(
        formGanhos,
        true
    );


    try {

        const valorInput =
            formGanhos.querySelector(
                '[name="valor"]'
            );

        const categoriaInput =
            formGanhos.querySelector(
                '[name="categoria"]'
            );

        const descricaoInput =
            formGanhos.querySelector(
                '[name="descricao"]'
            );

        const dataInput =
            formGanhos.querySelector(
                '[name="data"]'
            );

        const contaCartaoInput =
            localizarSelect(
                formGanhos,
                "conta_cartao"
            );


        const valor =
            Number(
                valorInput?.value
            );

        const categoria =
            categoriaInput?.value
            ?.trim();

        const descricao =
            descricaoInput?.value
            ?.trim();

        const data =
            dataInput?.value;

        const origem =
            interpretarOrigem(
                contaCartaoInput?.value
            );


        if (
            origem &&
            origem.tipo === "cartao"
        ) {

            throw new Error(
                "Entradas devem ser lançadas em uma conta, não em um cartão."
            );
        }


        const resultado =
            await criarTransacao({

                form: formGanhos,

                tipo: "ganho",

                categoria,

                valor,

                descricao,

                data,

                origem
            });


        alert(
            resultado.mensagem ||
            "Entrada registrada com sucesso!"
        );


        formGanhos.reset();

        preencherDatas();


        await carregarContas();
        await carregarCartoes();

        montarSelects();

        await atualizarContadorNotificacoes();


    } catch (erro) {

        console.error(
            "Erro ao registrar entrada:",
            erro
        );

        mostrarErro(
            erro.message ||
            "Erro ao registrar entrada."
        );

    } finally {

        enviando = false;

        definirLoading(
            formGanhos,
            false
        );
    }
}


// ============================================================
// MOVIMENTAÇÕES
// ============================================================

async function processarMovimentacao(evento) {

    evento.preventDefault();

    const origemInput =
        localizarSelect(
            formMovimentacao,
            "origem"
        );

    const destinoInput =
        localizarSelect(
            formMovimentacao,
            "destino"
        );


    const origem =
        interpretarOrigem(
            origemInput?.value
        );

    const destino =
        interpretarOrigem(
            destinoInput?.value
        );


    if (!origem || !destino) {

        mostrarErro(
            "Selecione a origem e o destino da movimentação."
        );

        return;
    }


    if (
        origem.tipo === destino.tipo &&
        origem.id === destino.id
    ) {

        mostrarErro(
            "A origem e o destino precisam ser diferentes."
        );

        return;
    }


    alert(
        "A estrutura de origem e destino já está preparada, mas a transferência ainda precisa de um endpoint próprio no backend. O /transacoes atual aceita apenas uma conta ou cartão por transação."
    );
}


// ============================================================
// TROCA DE FORMULÁRIOS
// ============================================================

function trocarDisplay(botao) {

    if (!botao) {
        return;
    }

    const idRecebido = botao.dataset.id;

    if (!idRecebido) {
        return;
    }

    const elementos = document.querySelectorAll(
        ".display, .display-on"
    );

    elementos.forEach(elemento => {

        elemento.classList.remove("display-on");
        elemento.classList.add("display");

    });

    const selecionado = document.getElementById(idRecebido);

    if (selecionado) {

        selecionado.classList.remove("display");
        selecionado.classList.add("display-on");

    }

    const botoes = document.querySelectorAll(
        ".categoria-btn"
    );

    botoes.forEach(botaoCategoria => {

        botaoCategoria.classList.remove("ativo");

    });

    botao.classList.add("ativo");
}


/* =========================================================
   NAVEGAÇÃO DOS FORMULÁRIOS
   ========================================================= */

const botoesCategoria = document.querySelectorAll(
    ".categoria-btn"
);

botoesCategoria.forEach(botao => {

    botao.addEventListener("click", () => {

        trocarDisplay(botao);

    });

});

// ============================================================
// EVENTOS
// ============================================================

if (formGastos) {

    formGastos.addEventListener(
        "submit",
        processarDespesa
    );

}

if (formGanhos) {

    formGanhos.addEventListener(
        "submit",
        processarEntrada
    );

}

if (formMovimentacao) {

    formMovimentacao.addEventListener(
        "submit",
        processarMovimentacao
    );

}


// ============================================================
// INICIALIZAÇÃO
// ============================================================

async function iniciar() {

    salvarUrlAtual();


    const autenticado =
        await verificarLogin();


    if (!autenticado) {

        window.location.href =
            "https://luiscript-ed.github.io/YOFI/Front-end/Auth/auth";

        return;
    }


    preencherUsuario();

    preencherDatas();


    try {

        await Promise.all([
            carregarContas(),
            carregarCartoes()
        ]);

        montarSelects();

        await atualizarContadorNotificacoes();

    } catch (erro) {

        console.error(
            "Erro ao inicializar formulário:",
            erro
        );

        mostrarErro(
            erro.message ||
            "Não foi possível carregar suas contas e cartões."
        );
    }
}


iniciar();