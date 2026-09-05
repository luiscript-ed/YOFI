const API_URL = "https://yofi-api.onrender.com";

const formGastos = document.getElementById("gastosForm");
const formGanhos = document.getElementById("ganhosForm");
const formMovimentacao = document.getElementById("movimentacaoForm");

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const app = document.querySelector(".app");

const notificationBtn = document.getElementById("notificationBtn");
const notificationPanel = document.getElementById("notificationPanel");
const notificationList = document.getElementById("notificationList");
const notificationCount = document.getElementById("notificationCount");
const usuarioImagem = document.getElementById("usuarioImagem");

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

    if (usuarioImagem) {
    if (usuario.imagem) {
        usuarioImagem.src = usuario.imagem;
        usuarioImagem.alt = usuario.nome || "Foto do usuário";
    } else {
        usuarioImagem.src = "../Imagens-Audios/404/usuarioGenerico.png";
        usuarioImagem.alt = "Usuário";
    }
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

    const selectCusto =
        localizarSelect(
        formCustos,
        "conta_cartao"
        );

    const selectReservado =
        localizarSelect(
        formReservados,
        "conta_cartao"
        );

    montarOpcoesFinanceiras(
        selectGasto
    );

    montarOpcoesFinanceiras(
        selectGanho
    );

    montarOpcoesFinanceiras(
        selectCusto
    );

    montarOpcoesFinanceiras(
        selectReservado
    );

    const montarContas = select => {

        if (!select) {
            return;
        }

        select.innerHTML = "";

        const primeiraOpcao =
            document.createElement("option");

        primeiraOpcao.value = "";
        primeiraOpcao.textContent =
            "Selecione uma conta";

        select.appendChild(
            primeiraOpcao
        );


        contas
            .filter(conta => conta.ativo)
            .forEach(conta => {

                const option =
                    document.createElement("option");

                option.value =
                    `conta:${conta.id}`;

                option.textContent =
                    `${conta.nome} — ${formatarMoeda(conta.saldo_atual)}`;

                select.appendChild(
                    option
                );
            });
    };


    montarContas(selectOrigem);
    montarContas(selectDestino);
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
                app.classList.toggle(
                    ""
                );

            } else {

                sidebar.classList.toggle(
                    "closed"
                );

                app.classList.toggle(
                    "sidebar-closed"
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
// CUSTOS RECORRENTES
// ============================================================
async function criarCustoRecorrente({
  valor,
  categoria,
  origem,
  descricao,
  frequencia,
  dias,
  dataAnual,
  dataInicio,
  dataFim
}) {
  if (!origem) {
    throw new Error("Selecione uma conta ou cartão.");
  }
  
  if (!origem.id || !["conta", "cartao"].includes(origem.tipo)) {
    throw new Error("A conta ou cartão selecionado é inválido.");
  }

  if (!Number.isFinite(valor) || valor <= 0) {
    throw new Error("Informe um valor válido.");
  }

  if (!categoria) {
    throw new Error("Selecione uma categoria.");
  }

  if (!frequencia) {
    throw new Error("Selecione uma frequência.");
  }

  if (!dataInicio) {
    throw new Error("Informe a data de início.");
  }

  if (dataFim && dataFim < dataInicio) {
    throw new Error("A data final não pode ser anterior à data inicial.");
  }

  if (frequencia === "mensal" && (!dias || dias.length === 0)) {
    throw new Error("Informe pelo menos um dia de cobrança.");
  }

  if (frequencia === "mensal" && dias.length > 5) {
    throw new Error("Você pode cadastrar no máximo 5 dias por mês.");
  }

  if (frequencia === "anual" && !dataAnual) {
    throw new Error("Informe a data da cobrança anual.");
  }

  const dados = {
    categoria,
    valor,
    descricao: descricao || null,
    frequencia,
    dias: frequencia === "mensal" ? dias : [],
    data_anual: frequencia === "anual" ? dataAnual : null,
    data_inicio: dataInicio,
    data_fim: dataFim || null
  };

  if (origem.tipo === "conta") {
    dados.conta_id = origem.id;
    dados.cartao_id = null;
  } else {
    dados.cartao_id = origem.id;
    dados.conta_id = null;
  }

  const resposta = await fetch(`${API_URL}/custos-recorrentes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify(dados)
  });

  let resultado = {};

  try {
    resultado = await resposta.json();
  } catch {
    resultado = {};
  }

  if (!resposta.ok) {
    throw new Error(
      resultado.detail || "Erro ao cadastrar o custo recorrente."
    );
  }

  return resultado;
}

// ============================================================
// PROCESSAR CUSTO RECORRENTE
// ============================================================
async function processarCusto(evento) {
  evento.preventDefault();
  
  if (enviando) {
    return;
  }

  enviando = true;
  definirLoading(formCustos, true);

  try {
    const valorInput = formCustos.querySelector('[name="valor"]');
    const categoriaInput = formCustos.querySelector('[name="categoria"]');
    const contaCartaoInput = localizarSelect(formCustos, "conta_cartao");
    const descricaoInput = formCustos.querySelector('[name="descricao"]');
    const frequenciaInput = formCustos.querySelector('[name="frequencia"]');
    const diasInputs = formCustos.querySelectorAll('[name="dias[]"]');
    const dataAnualInput = formCustos.querySelector('[name="data_anual"]');
    const dataInicioInput = formCustos.querySelector('[name="data_inicio"]');
    const dataFimInput = formCustos.querySelector('[name="data_fim"]');

    const valor = Number(valorInput?.value);
    const categoria = categoriaInput?.value?.trim();
    const origem = interpretarOrigem(contaCartaoInput?.value);
    const descricao = descricaoInput?.value?.trim();
    const frequencia = frequenciaInput?.value;
    const dias = Array.from(diasInputs)
      .map(input => Number(input.value))
      .filter(dia => Number.isInteger(dia) && dia >= 1 && dia <= 31);
    const dataAnual = dataAnualInput?.value || null;
    const dataInicio = dataInicioInput?.value;
    const dataFim = dataFimInput?.value || null;

    const resultado = await criarCustoRecorrente({
      valor,
      categoria,
      origem,
      descricao,
      frequencia,
      dias,
      dataAnual,
      dataInicio,
      dataFim
    });

    alert(resultado.mensagem || "Custo recorrente cadastrado com sucesso!");

    formCustos.reset();

    // O formulário volta a usar a data atual
    const inicio = formCustos.querySelector('[name="data_inicio"]');
    if (inicio) {
      inicio.value = hojeISO();
    }

    const select = localizarSelect(formCustos, "conta_cartao");
    if (select) {
      select.value = "";
    }

    await carregarContas();
    await carregarCartoes();
    montarSelects();
    await atualizarContadorNotificacoes();

  } catch (erro) {
    console.error("Erro ao cadastrar custo recorrente:", erro);
    mostrarErro(erro.message || "Erro ao cadastrar custo recorrente.");

  } finally {
    enviando = false;
    definirLoading(formCustos, false);
  }
}

// ============================================================
// TRANSAÇÕES RESERVADAS
// ============================================================
async function criarTransacaoReservada({
  tipo,
  valor,
  categoria,
  origem,
  descricao,
  data
}) {
  if (!origem) {
    throw new Error("Selecione uma conta ou cartão.");
  }

  if (!origem.id || !["conta", "cartao"].includes(origem.tipo)) {
    throw new Error("A conta ou cartão selecionado é inválido.");
  }

  if (!["gasto", "ganho"].includes(tipo)) {
    throw new Error("Selecione um tipo de transação válido.");
  }

  if (!Number.isFinite(valor) || valor <= 0) {
    throw new Error("Informe um valor válido.");
  }

  if (!categoria) {
    throw new Error("Selecione uma categoria.");
  }

  if (!data) {
    throw new Error("Informe a data da transação.");
  }

  const dados = {
    tipo,
    categoria,
    valor,
    descricao: descricao || null,
    data: `${data}T12:00:00`
  };

  if (origem.tipo === "conta") {
    dados.conta_id = origem.id;
    dados.cartao_id = null;
  } else {
    dados.cartao_id = origem.id;
    dados.conta_id = null;
  }

  const resposta = await fetch(`${API_URL}/transacoes-reservadas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify(dados)
  });

  let resultado = {};

  try {
    resultado = await resposta.json();
  } catch {
    resultado = {};
  }

  if (!resposta.ok) {
    throw new Error(
      resultado.detail || "Erro ao reservar a transação."
    );
  }

  return resultado;
}

// ============================================================
// PROCESSAR TRANSAÇÃO RESERVADA
// ============================================================
async function processarReservado(evento) {
  evento.preventDefault();

  if (enviando) {
    return;
  }

  enviando = true;
  definirLoading(formReservados, true);

  try {
    const tipoInput = formReservados.querySelector('[name="tipo"]');
    const valorInput = formReservados.querySelector('[name="valor"]');
    const categoriaInput = formReservados.querySelector('[name="categoria"]');
    const contaCartaoInput = localizarSelect(formReservados, "conta_cartao");
    const descricaoInput = formReservados.querySelector('[name="descricao"]');
    const dataInput = formReservados.querySelector('[name="data"]');

    const tipo = tipoInput?.value;
    const valor = Number(valorInput?.value);
    const categoria = categoriaInput?.value?.trim();
    const origem = interpretarOrigem(contaCartaoInput?.value);
    const descricao = descricaoInput?.value?.trim();
    const data = dataInput?.value;

    if (tipo === "ganho" && origem && origem.tipo === "cartao") {
      throw new Error(
        "Entradas devem ser reservadas em uma conta, não em um cartão."
      );
    }

    const resultado = await criarTransacaoReservada({
      tipo,
      valor,
      categoria,
      origem,
      descricao,
      data
    });

    alert(resultado.mensagem || "Transação reservada com sucesso!");

    formReservados.reset();

    const dataReservado = formReservados.querySelector('[name="data"]');
    if (dataReservado) {
      dataReservado.value = hojeISO();
    }

    const select = localizarSelect(formReservados, "conta_cartao");
    if (select) {
      select.value = "";
    }

    await carregarContas();
    await carregarCartoes();
    montarSelects();
    await atualizarContadorNotificacoes();

  } catch (erro) {
    console.error("Erro ao reservar transação:", erro);
    mostrarErro(erro.message || "Erro ao reservar transação.");

  } finally {
    enviando = false;
    definirLoading(formReservados, false);
  }
}

// ============================================================
// MOVIMENTAÇÕES
// ============================================================

async function criarMovimentacao({
    origem,
    destino,
    valor,
    descricao,
    data
}) {

    if (!origem || !destino) {
        throw new Error(
            "Selecione a origem e o destino."
        );
    }

    if (
        origem.tipo !== "conta" ||
        destino.tipo !== "conta"
    ) {
        throw new Error(
            "Movimentações devem ser feitas entre contas."
        );
    }

    if (
        origem.id === destino.id
    ) {
        throw new Error(
            "A origem e o destino precisam ser diferentes."
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

    if (!data) {
        throw new Error(
            "Informe a data da movimentação."
        );
    }

    const dados = {
        origem_conta_id: origem.id,
        destino_conta_id: destino.id,
        valor,
        descricao: descricao || null,
        data: `${data}T12:00:00`
    };

    const resposta = await fetch(
        `${API_URL}/movimentacoes`,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            credentials: "include",

            body: JSON.stringify(dados)
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
            "Erro ao registrar a movimentação."
        );
    }

    return resultado;
}

async function processarMovimentacao(evento) {

    evento.preventDefault();

    if (enviando) {
        return;
    }

    enviando = true;

    definirLoading(
        formMovimentacao,
        true
    );

    try {

        const valorInput =
            formMovimentacao.querySelector(
                '[name="valor"]'
            );

        const descricaoInput =
            formMovimentacao.querySelector(
                '[name="descricao"]'
            );

        const dataInput =
            formMovimentacao.querySelector(
                '[name="data"]'
            );

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


        const valor =
            Number(
                valorInput?.value
            );

        const descricao =
            descricaoInput?.value
                ?.trim();

        const data =
            dataInput?.value;

        const origem =
            interpretarOrigem(
                origemInput?.value
            );

        const destino =
            interpretarOrigem(
                destinoInput?.value
            );


        const resultado =
            await criarMovimentacao({
                origem,
                destino,
                valor,
                descricao,
                data
            });


        alert(
            resultado.mensagem ||
            "Movimentação realizada com sucesso!"
        );


        formMovimentacao.reset();

        preencherDatas();


        await carregarContas();
        await carregarCartoes();

        montarSelects();


        await atualizarContadorNotificacoes();

    } catch (erro) {

        console.error(
            "Erro ao registrar movimentação:",
            erro
        );

        mostrarErro(
            erro.message ||
            "Erro ao registrar movimentação."
        );

    } finally {

        enviando = false;

        definirLoading(
            formMovimentacao,
            false
        );
    }
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

if (formCustos) {
    formCustos.addEventListener(
    "submit",
    processarCusto
);
}

if (formReservados) {
    formReservados.addEventListener(
    "submit",
    processarReservado
    );
}

const frequenciaCusto =
document.getElementById(
"frequenciaCusto"
);

const datasMensaisCusto =
document.getElementById(
"datasMensaisCusto"
);

const dataAnualCusto =
document.getElementById(
"dataAnualCusto"
);

if (frequenciaCusto) {
frequenciaCusto.addEventListener(
"change",
() => {
const frequencia =
frequenciaCusto.value;

        if (frequencia === "mensal") {
            if (datasMensaisCusto) {
                datasMensaisCusto.style.display =
                    "block";
            }

            if (dataAnualCusto) {
                dataAnualCusto.style.display =
                    "none";
            }
        }

        if (frequencia === "anual") {
            if (datasMensaisCusto) {
                datasMensaisCusto.style.display =
                    "none";
            }

            if (dataAnualCusto) {
                dataAnualCusto.style.display =
                    "block";
            }
        }
    }
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