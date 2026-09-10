// ============================================================
// CONFIGURAÇÃO
// ============================================================

const API_URL = "https://yofi-api.onrender.com";
const AUTH_PAGE =
    "https://luiscript-ed.github.io/YOFI/Front-end/autentification/autentification";

const HOME_PAGE =
    "https://luiscript-ed.github.io/YOFI/Front-end/Inicial/page";

let usuario = null;
let usuarioId = null;
let dadosFinanceiros = {
    transacoes: [],
    contas: [],
    cartoes: [],
    objetivos: [],
    orcamentos: []
};

// ============================================================
// ELEMENTOS FORMATADOS PARA GANHAR MAIS LINHA
// ============================================================

const fileInput = 
    document.getElementById("fileInput");

const importBtn = 
    document.getElementById("importBtn");

const exportBtn = 
    document.getElementById("exportBtn");

const exportFormat = 
    document.getElementById("exportFormat");

const notificationBtn =
    document.getElementById("notificationBtn");

const notificationPanel =
    document.getElementById("notificationPanel");

const notificationCount =
    document.getElementById("notificationCount");

const notificationList =
    document.getElementById("notificationList");

const usuarioNome =
    document.getElementById("usuarioNome");

const usuarioEmail =
    document.getElementById("usuarioEmail");

const usuarioImagem =   
    document.getElementById("usuarioImagem");

const sidebar =
    document.getElementById("sidebar");

const app =
    document.getElementById("app");

const menuBtn =
    document.getElementById("menuBtn");

// ============================================================
// UTILIDADES
// ============================================================

function escaparHTML(valor) {
    if (valor === null || valor === undefined) {
        return "";
    }

    return String(valor)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


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


async function apiRequest(endpoint, opcoes = {}) {
    const resposta = await fetch(
        `${API_URL}${endpoint}`,
        {
            credentials: "include",
            ...opcoes,
            headers: {
                "Accept": "application/json",
                ...(opcoes.body instanceof FormData
                    ? {}
                    : {
                        "Content-Type": "application/json"
                    }),
                ...(opcoes.headers || {})
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
// EVENTOS DE SIDEBAR
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
// AUTENTICAÇÃO
// ============================================================

async function verificarLogin() {
    try {
        const { resposta, dados } = await apiRequest("/me");

        if (!resposta.ok) {
            console.warn(
                "Usuário não autenticado:",
                resposta.status,
                dados
            );

            return false;
        }

        usuario = dados;
        usuarioId = usuario?.usuario_id;

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

        if (usuarioImagem) {
            if (usuario.imagem) {
                usuarioImagem.src = usuario.imagem;
                usuarioImagem.alt = usuario.nome || "Foto do usuário";
            } else {
                usuarioImagem.src = "../Imagens-Audios/404/usuarioGenerico.png";
                usuarioImagem.alt = "Usuário";
            }
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
// DADOS FINANCEIROS
// ============================================================

async function carregarDadosFinanceiros() {
    try {
        const endpoints = [
            ["transacoes", "/transacoes"],
            ["contas", "/contas"],
            ["cartoes", "/cartoes"],
            ["objetivos", "/objetivos"],
            ["orcamentos", "/orcamentos"]
        ];

        const resultados = await Promise.all(
            endpoints.map(async ([chave, endpoint]) => {
                const { resposta, dados } =
                    await apiRequest(endpoint);

                if (!resposta.ok) {
                    console.error(
                        `Erro em ${endpoint}:`,
                        resposta.status,
                        dados
                    );

                    return [
                        chave,
                        Array.isArray(dados) ? dados : []
                    ];
                }

                return [
                    chave,
                    Array.isArray(dados)
                        ? dados
                        : (
                            dados?.[chave] ||
                            dados?.data ||
                            []
                        )
                ];
            })
        );

        resultados.forEach(([chave, dados]) => {
            dadosFinanceiros[chave] = dados;
        });

        console.log(
            "Dados financeiros carregados:",
            dadosFinanceiros
        );

        return dadosFinanceiros;

    } catch (erro) {
        console.error(
            "Erro ao carregar dados financeiros:",
            erro
        );

        return dadosFinanceiros;
    }
}

// ============================================================
// NOTIFICAÇÔES
// ============================================================


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
// PARTE DA IMPORTAÇÃO
// ============================================================

let arquivoSelecionado = null;
let importacoesPendentes = [];

function criarAreaPreview() {
    let preview = document.getElementById(
        "importPreview"
    );

    if (preview) {
        return preview;
    }

    preview = document.createElement("div");
    preview.id = "importPreview";
    preview.className = "import-preview";
    preview.style.display = "none";

    const cardImportar =
        document.querySelector(".sections .card-section");

    if (cardImportar) {
        cardImportar.appendChild(preview);
    } else {
        document.body.appendChild(preview);
    }

    return preview;
}


function detectarTipoArquivo(arquivo) {
    const nome =
        String(arquivo?.name || "").toLowerCase();

    if (nome.endsWith(".csv")) {
        return "csv";
    }

    if (nome.endsWith(".ofx")) {
        return "ofx";
    }

    return null;
}


async function lerArquivo(arquivo) {
    if (!arquivo) {
        throw new Error(
            "Nenhum arquivo selecionado."
        );
    }

    const tipo = detectarTipoArquivo(arquivo);

    if (!tipo) {
        throw new Error(
            "Formato não suportado. Use CSV ou OFX."
        );
    }

    const texto = await arquivo.text();

    if (!texto.trim()) {
        throw new Error(
            "O arquivo está vazio."
        );
    }

    if (tipo === "csv") {
        return lerCSV(texto);
    }

    return lerOFX(texto);
}


function detectarDelimitador(linha) {
    const opcoes = [",", ";", "\t"];

    let melhor = ",";
    let maior = 0;

    opcoes.forEach(delimitador => {
        let quantidade = 0;
        let dentroAspas = false;

        for (let i = 0; i < linha.length; i++) {
            const caractere = linha[i];

            if (caractere === '"') {
                if (
                    dentroAspas &&
                    linha[i + 1] === '"'
                ) {
                    i++;
                    continue;
                }

                dentroAspas = !dentroAspas;
                continue;
            }

            if (
                caractere === delimitador &&
                !dentroAspas
            ) {
                quantidade++;
            }
        }

        if (quantidade > maior) {
            maior = quantidade;
            melhor = delimitador;
        }
    });

    return melhor;
}


function separarLinhaCSV(linha, delimitador) {
    const valores = [];
    let atual = "";
    let dentroAspas = false;

    for (let i = 0; i < linha.length; i++) {
        const caractere = linha[i];

        if (caractere === '"') {
            if (
                dentroAspas &&
                linha[i + 1] === '"'
            ) {
                atual += '"';
                i++;
                continue;
            }

            dentroAspas = !dentroAspas;
            continue;
        }

        if (
            caractere === delimitador &&
            !dentroAspas
        ) {
            valores.push(atual.trim());
            atual = "";
            continue;
        }

        atual += caractere;
    }

    valores.push(atual.trim());

    return valores;
}


function normalizarNomeCampo(nome) {
    return String(nome || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}


function encontrarCampo(objeto, nomes) {
    const chaves = Object.keys(objeto);

    for (const nome of nomes) {
        const procurado =
            normalizarNomeCampo(nome);

        const chave = chaves.find(
            item =>
                normalizarNomeCampo(item) ===
                procurado
        );

        if (chave) {
            return objeto[chave];
        }
    }

    return null;
}


function converterValor(valor) {
    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {
        return 0;
    }

    if (typeof valor === "number") {
        return valor;
    }

    let texto = String(valor)
        .trim()
        .replace(/\s/g, "");

    if (
        texto.includes(",") &&
        texto.includes(".")
    ) {
        if (
            texto.lastIndexOf(",") >
            texto.lastIndexOf(".")
        ) {
            texto = texto
                .replace(/\./g, "")
                .replace(",", ".");
        } else {
            texto = texto.replace(/,/g, "");
        }
    } else if (texto.includes(",")) {
        texto = texto.replace(",", ".");
    }

    texto = texto.replace(/[^\d.-]/g, "");

    const numero = Number(texto);

    return Number.isFinite(numero)
        ? numero
        : 0;
}


function normalizarData(valor) {
    if (!valor) {
        return null;
    }

    const texto = String(valor).trim();

    let resultado = null;

    if (
        /^\d{4}-\d{2}-\d{2}$/.test(texto)
    ) {
        resultado = texto;
    }

    if (
        /^\d{2}\/\d{2}\/\d{4}$/.test(texto)
    ) {
        const [dia, mes, ano] =
            texto.split("/");

        resultado =
            `${ano}-${mes}-${dia}`;
    }

    if (
        /^\d{2}-\d{2}-\d{4}$/.test(texto)
    ) {
        const [dia, mes, ano] =
            texto.split("-");

        resultado =
            `${ano}-${mes}-${dia}`;
    }

    if (!resultado) {
        const data = new Date(texto);

        if (!Number.isNaN(data.getTime())) {
            resultado =
                `${data.getFullYear()}-${String(
                    data.getMonth() + 1
                ).padStart(2, "0")}-${String(
                    data.getDate()
                ).padStart(2, "0")}`;
        }
    }

    return resultado;
}


function normalizarTipo(valor, valorNumerico = 0) {
    const tipo = normalizarNomeCampo(valor);

    if (
        tipo === "ganho" ||
        tipo === "receita" ||
        tipo === "credito" ||
        tipo === "credit"
    ) {
        return "ganho";
    }

    if (
        tipo === "gasto" ||
        tipo === "despesa" ||
        tipo === "debito" ||
        tipo === "debit"
    ) {
        return "gasto";
    }

    return valorNumerico < 0
        ? "gasto"
        : "ganho";
}


function normalizarTransacao(objeto) {
    let valorOriginal =
        encontrarCampo(
            objeto,
            [
                "valor",
                "amount",
                "value",
                "quantia"
            ]
        );

    let valor = converterValor(
        valorOriginal
    );

    const tipoOriginal =
        encontrarCampo(
            objeto,
            [
                "tipo",
                "type",
                "transactionType"
            ]
        );

    const data =
        normalizarData(
            encontrarCampo(
                objeto,
                [
                    "data",
                    "date",
                    "transactionDate",
                    "dataTransacao"
                ]
            )
        );

    const descricao =
        encontrarCampo(
            objeto,
            [
                "descricao",
                "description",
                "memo",
                "histórico",
                "historico",
                "nome"
            ]
        );

    const categoria =
        encontrarCampo(
            objeto,
            [
                "categoria",
                "category"
            ]
        );

    const tipo =
        normalizarTipo(
            tipoOriginal,
            valor
        );

    if (valor < 0) {
        valor = Math.abs(valor);
    }

    return {
        tipo,
        categoria:
            String(
                categoria || "Importado"
            ).trim(),
        valor,
        descricao:
            String(
                descricao || "Transação importada"
            ).trim(),
        data
    };
}


function lerCSV(texto) {
    const linhas = texto
        .replace(/^\uFEFF/, "")
        .split(/\r?\n/)
        .filter(linha => linha.trim() !== "");

    if (linhas.length < 2) {
        throw new Error(
            "O CSV precisa possuir cabeçalho e pelo menos uma linha."
        );
    }

    const delimitador =
        detectarDelimitador(linhas[0]);

    const cabecalhos =
        separarLinhaCSV(
            linhas[0],
            delimitador
        );

    const transacoes = [];

    for (let i = 1; i < linhas.length; i++) {
        const valores =
            separarLinhaCSV(
                linhas[i],
                delimitador
            );

        if (
            valores.length === 1 &&
            !valores[0]
        ) {
            continue;
        }

        const objeto = {};

        cabecalhos.forEach(
            (cabecalho, indice) => {
                objeto[cabecalho] =
                    valores[indice] ?? "";
            }
        );

        transacoes.push(
            normalizarTransacao(objeto)
        );
    }

    return transacoes;
}


function obterTagOFX(texto, tag) {
    const regex = new RegExp(
        `<${tag}>([^<\\r\\n]*)`,
        "i"
    );

    const resultado =
        texto.match(regex);

    return resultado
        ? resultado[1].trim()
        : null;
}


function lerOFX(texto) {
    const transacoes = [];

    const blocos =
        texto.match(
            /<STMTTRN>[\s\S]*?<\/STMTTRN>/gi
        ) || [];

    blocos.forEach(bloco => {
        const valor =
            converterValor(
                obterTagOFX(
                    bloco,
                    "TRNAMT"
                )
            );

        const dataRaw =
            obterTagOFX(
                bloco,
                "DTPOSTED"
            );

        let data = null;

        if (dataRaw) {
            const match =
                dataRaw.match(
                    /^(\d{4})(\d{2})(\d{2})/
                );

            if (match) {
                data =
                    `${match[1]}-${match[2]}-${match[3]}`;
            }
        }

        const nome =
            obterTagOFX(
                bloco,
                "NAME"
            );

        const memo =
            obterTagOFX(
                bloco,
                "MEMO"
            );

        const categoria =
            obterTagOFX(
                bloco,
                "CATEGORY"
            );

        const valorOriginal =
            converterValor(
                obterTagOFX(
                    bloco,
                    "TRNAMT"
                )
            );

        transacoes.push({
            tipo:
                valorOriginal < 0
                    ? "gasto"
                    : "ganho",

            categoria:
                categoria ||
                "Importado",

            valor: Math.abs(valor),

            descricao:
                nome ||
                memo ||
                "Transação OFX",

            data
        });
    });

    if (!transacoes.length) {
        throw new Error(
            "Nenhuma transação foi encontrada no arquivo OFX."
        );
    }

    return transacoes;
}


function validarTransacoes(transacoes) {
    const validas = [];
    const erros = [];

    transacoes.forEach(
        (transacao, indice) => {
            const linha =
                indice + 1;

            if (
                !transacao.data ||
                !/^\d{4}-\d{2}-\d{2}$/.test(
                    transacao.data
                )
            ) {
                erros.push(
                    `Linha ${linha}: data inválida.`
                );
                return;
            }

            if (
                !Number.isFinite(
                    Number(transacao.valor)
                ) ||
                Number(transacao.valor) <= 0
            ) {
                erros.push(
                    `Linha ${linha}: valor inválido.`
                );
                return;
            }

            if (
                !["ganho", "gasto"]
                    .includes(transacao.tipo)
            ) {
                erros.push(
                    `Linha ${linha}: tipo inválido.`
                );
                return;
            }

            validas.push({
                ...transacao,
                valor:
                    Number(transacao.valor)
            });
        }
    );

    return {
        validas,
        erros
    };
}


// ============================================================
// DESTINO DA IMPORTAÇÃO
// ============================================================

function criarSeletorDestino() {
    let area =
        document.getElementById(
            "importDestination"
        );

    if (area) {
        return area;
    }

    area = document.createElement("div");
    area.id = "importDestination";
    area.className = "import-destination";

    const titulo =
        document.createElement("label");

    titulo.textContent =
        "Destino das transações:";

    const select =
        document.createElement("select");

    select.id = "importDestinationSelect";
    select.className = "custom-select";

    const vazio =
        document.createElement("option");

    vazio.value = "";
    vazio.textContent =
        "Selecione uma conta ou cartão";

    select.appendChild(vazio);

    dadosFinanceiros.contas.forEach(
        conta => {
            const option =
                document.createElement("option");

            option.value =
                `conta:${conta.id}`;

            option.textContent =
                `Conta: ${
                    conta.nome ||
                    `Conta ${conta.id}`
                }`;

            select.appendChild(option);
        }
    );

    dadosFinanceiros.cartoes.forEach(
        cartao => {
            const option =
                document.createElement("option");

            option.value =
                `cartao:${cartao.id}`;

            option.textContent =
                `Cartão: ${
                    cartao.nome ||
                    cartao.banco ||
                    `Cartão ${cartao.id}`
                }`;

            select.appendChild(option);
        }
    );

    area.appendChild(titulo);
    area.appendChild(select);

    const preview =
        criarAreaPreview();

    preview.before(area);

    return area;
}


// ============================================================
// PREVIEW
// ============================================================

function montarPreview(transacoes, erros = []) {
    const preview =
        criarAreaPreview();

    preview.style.display =
        "block";

    let html = `
        <div class="import-preview-header">
            <h3>Pré-visualização da importação</h3>
            <p>
                ${transacoes.length}
                transação(ões) válida(s) encontrada(s).
            </p>
        </div>
    `;

    if (erros.length) {
        html += `
            <div class="import-errors">
                <strong>
                    ${erros.length} item(ns) ignorado(s)
                </strong>
                ${erros
                    .slice(0, 10)
                    .map(
                        erro =>
                            `<p>${escaparHTML(erro)}</p>`
                    )
                    .join("")}
            </div>
        `;
    }

    html += `
        <div class="import-preview-table">
            <div class="import-preview-row import-preview-head">
                <span>Data</span>
                <span>Descrição</span>
                <span>Categoria</span>
                <span>Tipo</span>
                <span>Valor</span>
            </div>
    `;

    transacoes
        .slice(0, 100)
        .forEach(transacao => {
            html += `
                <div class="import-preview-row">
                    <span>
                        ${escaparHTML(
                            transacao.data
                        )}
                    </span>
                    <span>
                        ${escaparHTML(
                            transacao.descricao
                        )}
                    </span>
                    <span>
                        ${escaparHTML(
                            transacao.categoria
                        )}
                    </span>
                    <span>
                        ${escaparHTML(
                            transacao.tipo
                        )}
                    </span>
                    <span>
                        R$ ${Number(
                            transacao.valor
                        ).toFixed(2)}
                    </span>
                </div>
            `;
        });

    html += `
        </div>

        ${
            transacoes.length > 100
                ? `
                    <small>
                        Exibindo as primeiras 100
                        transações.
                    </small>
                `
                : ""
        }

        <div class="import-preview-actions">
            <button
                type="button"
                id="cancelImportBtn"
                class="btn"
            >
                Cancelar
            </button>

            <button
                type="button"
                id="confirmImportBtn"
                class="btn btn-purple"
            >
                Importar ${transacoes.length}
            </button>
        </div>
    `;

    preview.innerHTML = html;

    const cancelar =
        document.getElementById(
            "cancelImportBtn"
        );

    const confirmar =
        document.getElementById(
            "confirmImportBtn"
        );

    if (cancelar) {
        cancelar.addEventListener(
            "click",
            cancelarImportacao
        );
    }

    if (confirmar) {
        confirmar.addEventListener(
            "click",
            () => importarTransacoes(
                transacoes
            )
        );
    }
}


function cancelarImportacao() {
    importacoesPendentes = [];

    const preview =
        document.getElementById(
            "importPreview"
        );

    const destino =
        document.getElementById(
            "importDestination"
        );

    if (preview) {
        preview.style.display =
            "none";
        preview.innerHTML = "";
    }

    if (destino) {
        destino.remove();
    }

    if (fileInput) {
        fileInput.value = "";
    }

    arquivoSelecionado = null;
}


async function prepararImportacao() {
    if (!arquivoSelecionado) {
        alert(
            "Selecione um arquivo CSV ou OFX."
        );
        return;
    }

    try {
        importBtn.disabled = true;
        importBtn.textContent =
            "Lendo arquivo...";

        await carregarDadosFinanceiros();

        const transacoes =
            await lerArquivo(
                arquivoSelecionado
            );

        const resultado =
            validarTransacoes(
                transacoes
            );

        if (!resultado.validas.length) {
            throw new Error(
                "Nenhuma transação válida foi encontrada."
            );
        }

        importacoesPendentes =
            resultado.validas;

        criarSeletorDestino();

        montarPreview(
            resultado.validas,
            resultado.erros
        );

        importBtn.textContent =
            "Importação preparada";

    } catch (erro) {
        console.error(
            "Erro ao preparar importação:",
            erro
        );

        alert(
            erro.message ||
            "Não foi possível processar o arquivo."
        );

        importBtn.textContent =
            "Importar dados";

    } finally {
        importBtn.disabled = false;
    }
}


// ============================================================
// ENVIO PARA /transacoes
// ============================================================

async function importarTransacoes(
    transacoes
    ) {
    const destino =
        document.getElementById(
            "importDestinationSelect"
        );

    if (!destino?.value) {
        alert(
            "Selecione a conta ou cartão de destino."
        );
        return;
    }

    const [tipoDestino, idDestino] =
        destino.value.split(":");

    if (!idDestino) {
        return;
    }

    const botao =
        document.getElementById(
            "confirmImportBtn"
        );

    if (botao) {
        botao.disabled = true;
        botao.textContent =
            "Importando...";
    }

    let sucesso = 0;
    let falhas = 0;

    try {
        for (const transacao of transacoes) {
            const corpo = {
                tipo: transacao.tipo,
                categoria:
                    transacao.categoria,
                valor:
                    Number(transacao.valor),
                descricao:
                    transacao.descricao,
                data:
                    transacao.data
            };

            if (tipoDestino === "conta") {
                corpo.conta_id =
                    Number(idDestino);
                corpo.cartao_id = null;
            }

            if (tipoDestino === "cartao") {
                corpo.cartao_id =
                    Number(idDestino);
                corpo.conta_id = null;
            }

            const { resposta, dados } =
                await apiRequest(
                    "/transacoes",
                    {
                        method: "POST",
                        body: JSON.stringify(
                            corpo
                        )
                    }
                );

            if (resposta.ok) {
                sucesso++;
            } else {
                falhas++;

                console.error(
                    "Falha ao importar transação:",
                    dados
                );
            }
        }

        await registrarImportacao({
            arquivo:
                arquivoSelecionado?.name ||
                "arquivo",
            formato:
                detectarTipoArquivo(
                    arquivoSelecionado
                ),
            total:
                transacoes.length,
            sucesso,
            falhas
        });

        if (falhas === 0) {
            alert(
                `${sucesso} transação(ões) importada(s) com sucesso.`
            );
        } else {
            alert(
                `${sucesso} importada(s) e ${falhas} com erro.`
            );
        }

        cancelarImportacao();

        await carregarDadosFinanceiros();
        await carregarHistorico();

    } catch (erro) {
        console.error(
            "Erro durante importação:",
            erro
        );

        alert(
            "Ocorreu um erro durante a importação."
        );

    } finally {
        if (botao) {
            botao.disabled = false;
            botao.textContent =
                "Importar";
        }
    }
}



async function registrarImportacao(dados) {
    try {
        const corpo = {
            nome_arquivo: dados.arquivo,
            formato: dados.formato,
            quantidade_registros: dados.total,
            quantidade_importada: dados.sucesso,
            quantidade_ignorados: dados.falhas,
            status: dados.falhas === 0 ? "sucesso" : "parcial",
            mensagem: `${dados.sucesso} importados, ${dados.falhas} ignorados`
        };

        await apiRequest("/historico/importacoes", {
            method: "POST",
            body: JSON.stringify(corpo)
        });
    } catch (erro) {
        console.warn("Erro ao registrar importação:", erro);
    }
}

async function registrarExportacao(dados) {
    try {
        const corpo = {
            formato: dados.formato,
            dados_exportados: Array.isArray(dados.dados) ? dados.dados.join(",") : String(dados.dados),
            quantidade_registros: dados.quantidade
        };

        await apiRequest("/historico/exportacoes", {
            method: "POST",
            body: JSON.stringify(corpo)
        });
    } catch (erro) {
        console.warn("Erro ao registrar exportação:", erro);
    }
}


// ============================================================
// EXPORTAÇÃO
// ============================================================

function obterDadosSelecionados() {
    const checkboxes =
        document.querySelectorAll(
            ".checkbox-group input[type='checkbox']"
        );

    const mapa = [
        "transacoes",
        "contas",
        "cartoes",
        "objetivos",
        "orcamentos"
    ];

    const selecionados = {};

    checkboxes.forEach(
        (checkbox, indice) => {
            selecionados[
                mapa[indice]
            ] = checkbox.checked;
        }
    );

    return selecionados;
}


async function carregarDadosParaExportacao() {
    return await carregarDadosFinanceiros();
}


function gerarCSV(dados) {
    const blocos = [];

    Object.entries(dados)
        .forEach(([nome, lista]) => {
            if (!Array.isArray(lista)) {
                return;
            }

            blocos.push(
                `### ${nome.toUpperCase()}`
            );

            if (!lista.length) {
                blocos.push(
                    "Nenhum registro"
                );
                blocos.push("");
                return;
            }

            const chaves = [
                ...new Set(
                    lista.flatMap(
                        item =>
                            Object.keys(
                                item || {}
                            )
                    )
                )
            ];

            const escaparCSV = valor => {
                if (
                    valor === null ||
                    valor === undefined
                ) {
                    return "";
                }

                let texto;

                if (
                    typeof valor === "object"
                ) {
                    texto =
                        JSON.stringify(
                            valor
                        );
                } else {
                    texto =
                        String(valor);
                }

                if (
                    texto.includes('"') ||
                    texto.includes(",") ||
                    texto.includes("\n")
                ) {
                    return `"${texto.replace(
                        /"/g,
                        '""'
                    )}"`;
                }

                return texto;
            };

            blocos.push(
                chaves
                    .map(escaparCSV)
                    .join(",")
            );

            lista.forEach(item => {
                blocos.push(
                    chaves
                        .map(
                            chave =>
                                escaparCSV(
                                    item?.[chave]
                                )
                        )
                        .join(",")
                );
            });

            blocos.push("");
        });

    return "\uFEFF" +
        blocos.join("\n");
}


function gerarJSON(dados) {
    return JSON.stringify(
        dados,
        null,
        2
    );
}


function gerarOFX(dados) {
    const transacoes =
        Array.isArray(
            dados.transacoes
        )
            ? dados.transacoes
            : [];

    const formatarDataOFX = data => {
        const texto =
            normalizarData(data);

        if (!texto) {
            return "";
        }

        return texto.replaceAll("-", "") +
            "120000";
    };

    let linhas = [];

    linhas.push(
        '<?xml version="1.0" encoding="UTF-8" standalone="no"?>'
    );

    linhas.push(
        '<OFX>'
    );

    linhas.push(
        "<OFXHEADER>100</OFXHEADER>"
    );

    linhas.push(
        "<DATA>OFXSGML</DATA>"
    );

    linhas.push(
        "<VERSION>220</VERSION>"
    );

    linhas.push(
        "<SECURITY>NONE</SECURITY>"
    );

    linhas.push(
        "<ENCODING>UTF-8</ENCODING>"
    );

    linhas.push(
        "<CHARSET>UTF-8</CHARSET>"
    );

    linhas.push(
        "<COMPRESSION>NONE</COMPRESSION>"
    );

    linhas.push(
        "<OLDFILEUID>NONE</OLDFILEUID>"
    );

    linhas.push(
        "<NEWFILEUID>NONE</NEWFILEUID>"
    );

    linhas.push(
        "<BODY>"
    );

    linhas.push(
        "<STMTTRNRS>"
    );

    linhas.push(
        "<STMTRS>"
    );

    linhas.push(
        "<CURDEF>BRL</CURDEF>"
    );

    linhas.push(
        "<BANKTRANLIST>"
    );

    transacoes.forEach(
        (transacao, indice) => {
            const valor =
                transacao.tipo === "gasto"
                    ? -Math.abs(
                        Number(
                            transacao.valor
                        ) || 0
                    )
                    : Math.abs(
                        Number(
                            transacao.valor
                        ) || 0
                    );

            linhas.push(
                "<STMTTRN>"
            );

            linhas.push(
                `<TRNTYPE>${
                    transacao.tipo === "gasto"
                        ? "DEBIT"
                        : "CREDIT"
                }</TRNTYPE>`
            );

            linhas.push(
                `<DTPOSTED>${
                    formatarDataOFX(
                        transacao.data
                    )
                }</DTPOSTED>`
            );

            linhas.push(
                `<TRNAMT>${
                    valor.toFixed(2)
                }</TRNAMT>`
            );

            linhas.push(
                `<FITID>YOFI-${indice + 1}</FITID>`
            );

            linhas.push(
                `<NAME>${
                    escaparOFX(
                        transacao.categoria ||
                        "YOFI"
                    )
                }</NAME>`
            );

            linhas.push(
                `<MEMO>${
                    escaparOFX(
                        transacao.descricao ||
                        ""
                    )
                }</MEMO>`
            );

            linhas.push(
                "</STMTTRN>"
            );
        }
    );

    linhas.push(
        "</BANKTRANLIST>"
    );

    linhas.push(
        "</STMTRS>"
    );

    linhas.push(
        "</STMTTRNRS>"
    );

    linhas.push(
        "</BODY>"
    );

    linhas.push(
        "</OFX>"
    );

    return linhas.join("\n");
}


function escaparOFX(valor) {
    return String(valor || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");
}


function criarDownload(
    conteudo,
    nomeArquivo,
    tipo
    ) {
    const blob =
        new Blob(
            [conteudo],
            {
                type: tipo
            }
        );

    const url =
        URL.createObjectURL(
            blob
        );

    const link =
        document.createElement("a");

    link.href = url;
    link.download =
        nomeArquivo;

    document.body.appendChild(
        link
    );

    link.click();

    link.remove();

    URL.revokeObjectURL(
        url
    );
}


async function exportarDados() {
    try {
        if (exportBtn) {
            exportBtn.disabled = true;
            exportBtn.textContent =
                "Preparando...";
        }

        const selecionados =
            obterDadosSelecionados();

        const algumSelecionado =
            Object.values(
                selecionados
            ).some(Boolean);

        if (!algumSelecionado) {
            alert(
                "Selecione pelo menos um tipo de dado."
            );
            return;
        }

        const dados =
            await carregarDadosParaExportacao();

        const escolhidos = {};

        Object.entries(
            selecionados
        ).forEach(
            ([chave, selecionado]) => {
                if (selecionado) {
                    escolhidos[chave] =
                        dadosFinanceiros[
                            chave
                        ] || [];
                }
            }
        );

        const formato =
            exportFormat?.value ||
            "csv";

        let conteudo;
        let nomeArquivo;
        let mimeType;

        if (formato === "json") {
            conteudo =
                gerarJSON(
                    escolhidos
                );

            nomeArquivo =
                "yofi-exportacao.json";

            mimeType =
                "application/json;charset=utf-8";
        }

        if (formato === "csv") {
            conteudo =
                gerarCSV(
                    escolhidos
                );

            nomeArquivo =
                "yofi-exportacao.csv";

            mimeType =
                "text/csv;charset=utf-8";
        }

        if (formato === "ofx") {
            if (
                !escolhidos.transacoes
            ) {
                alert(
                    "A exportação OFX precisa incluir as transações."
                );
                return;
            }

            conteudo =
                gerarOFX(
                    escolhidos
                );

            nomeArquivo =
                "yofi-exportacao.ofx";

            mimeType =
                "application/x-ofx";
        }

        criarDownload(
            conteudo,
            nomeArquivo,
            mimeType
        );

        await registrarExportacao({
            formato,
            dados:
                Object.keys(
                    escolhidos
                ),
            quantidade:
                Object.values(
                    escolhidos
                ).reduce(
                    (
                        total,
                        lista
                    ) =>
                        total +
                        (
                            Array.isArray(
                                lista
                            )
                                ? lista.length
                                : 0
                        ),
                    0
                )
        });

        await carregarHistorico();

    } catch (erro) {
        console.error(
            "Erro ao exportar dados:",
            erro
        );

        alert(
            "Não foi possível exportar os dados."
        );

    } finally {
        if (exportBtn) {
            exportBtn.disabled = false;
            exportBtn.textContent =
                "Exportar dados";
        }
    }
}


// ============================================================
// HISTÓRICO
// ============================================================

function formatarDataHistorico(data) {
    if (!data) {
        return "";
    }

    const valor =
        new Date(data);

    if (
        Number.isNaN(
            valor.getTime()
        )
    ) {
        return String(data);
    }

    return valor.toLocaleDateString(
        "pt-BR"
    );
}


function renderizarHistorico(
    itens
    ) {
    const container =
        document.querySelector(
            ".history-card"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (
        !Array.isArray(itens) ||
        !itens.length
    ) {
        container.innerHTML = `
            <div class="history-item">
                <span class="date">—</span>
                <span class="type">
                    Nenhuma operação registrada.
                </span>
                <span class="badge success">
                    —
                </span>
            </div>
        `;

        return;
    }

    itens.forEach(item => {
        const operacao =
            String(
                item.tipo ||
                item.operacao ||
                ""
            ).toLowerCase();

        const importacao =
            operacao.includes(
                "import"
            );

        const formato =
            String(
                item.formato ||
                "CSV"
            ).toUpperCase();

        const data =
            formatarDataHistorico(
                item.data ||
                item.criado_em ||
                item.criadoEm
            );

        const sucesso =
            item.status ||
            "Concluída";

        container.innerHTML += `
            <div class="history-item">
                <span class="date">
                    ${escaparHTML(data)}
                </span>

                <span class="type">
                    ${
                        importacao
                            ? "Importação"
                            : "Exportação"
                    }
                    ${escaparHTML(formato)}
                </span>

                <span class="badge success">
                    ✓ ${escaparHTML(
                        sucesso
                    )}
                </span>
            </div>
        `;
    });
}


async function carregarHistorico() {
    try {
        const [importacoes, exportacoes] = await Promise.all([
            apiRequest("/historico/importacoes"),
            apiRequest("/historico/exportacoes")
        ]);

        const listaImportacoes = importacoes.resposta.ok && Array.isArray(importacoes.dados) 
            ? importacoes.dados 
            : [];

        const listaExportacoes = exportacoes.resposta.ok && Array.isArray(exportacoes.dados) 
            ? exportacoes.dados 
            : [];

        const historico = [
            ...listaImportacoes.map(item => ({ ...item, tipo: "Importação" })),
            ...listaExportacoes.map(item => ({ ...item, tipo: "Exportação" }))
        ]
        .sort((a, b) => new Date(b.criado_em || 0) - new Date(a.criado_em || 0))
        .slice(0, 20);

        renderizarHistorico(historico);
    } catch (erro) {
        console.warn("Não foi possível carregar o histórico:", erro);
    }
}

// ============================================================
// EVENTOS
// ============================================================

if (fileInput) {
    fileInput.addEventListener(
        "change",
        () => {
            arquivoSelecionado =
                fileInput.files?.[0] ||
                null;

            const label =
                document.querySelector(
                    ".file-label span:last-child"
                );

            if (label) {
                label.textContent =
                    arquivoSelecionado
                        ? arquivoSelecionado.name
                        : "Escolher arquivo";
            }

            const destino =
                document.getElementById(
                    "importDestination"
                );

            if (destino) {
                destino.remove();
            }

            const preview =
                document.getElementById(
                    "importPreview"
                );

            if (preview) {
                preview.style.display =
                    "none";
                preview.innerHTML = "";
            }
        }
    );
}


if (importBtn) {
    importBtn.addEventListener(
        "click",
        prepararImportacao
    );
}


if (exportBtn) {
    exportBtn.addEventListener(
        "click",
        exportarDados
    );
}


// ============================================================
// INICIALIZAÇÃO
// ============================================================

async function iniciarPagina() {
    console.log(
        "🚀 Iniciando página de importação/exportação..."
    );

    const autenticado =
        await verificarLogin();

    if (!autenticado) {
        return;
    }

    await carregarDadosFinanceiros();
    await carregarHistorico();

    console.log(
        "✅ Página de importação/exportação carregada."
    );
}


iniciarPagina();