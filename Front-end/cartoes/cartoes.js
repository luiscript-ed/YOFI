const API_URL =
    "https://yofi-api.onrender.com";


// ============================================================
// ELEMENTOS
// ============================================================

const sidebar =
    document.getElementById("sidebar");

const app =
    document.getElementById("app");

const menuBtn =
    document.getElementById("menuBtn");


const cartaoForm =
    document.getElementById("cartaoForm");

const cartaoId =
    document.getElementById("cartaoId");

const nomeCartao =
    document.getElementById("nomeCartao");

const bancoCartao =
    document.getElementById("bancoCartao");

const limiteCartao =
    document.getElementById("limiteCartao");

const diaFechamento =
    document.getElementById("diaFechamento");

const diaVencimento =
    document.getElementById("diaVencimento");

const salvarCartao =
    document.getElementById("salvarCartao");

const cancelarEdicao =
    document.getElementById("cancelarEdicao");

const formTitulo =
    document.getElementById("formTitulo");

const mensagem =
    document.getElementById("mensagem");

const cartoesList =
    document.getElementById("cartoesList");

const totalCartoes =
    document.getElementById("totalCartoes");

const limiteTotal =
    document.getElementById("limiteTotal");

const utilizadoTotal =
    document.getElementById("utilizadoTotal");

const disponivelTotal =
    document.getElementById("disponivelTotal");

const usuarioNome =
    document.getElementById("usuarioNome");

const usuarioEmail =
    document.getElementById("usuarioEmail");


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
                    "https://luiscript-ed.github.io/YOFI/Front-end/Auth/auth";

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
// CARTÕES
// ============================================================

async function carregarCartoes() {

    cartoesList.innerHTML =
        `<div class="empty-state">
            Carregando cartões...
        </div>`;

    try {

        const resposta =
            await fetch(
                `${API_URL}/cartoes`,
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
                    "https://luiscript-ed.github.io/YOFI/Front-end/Auth/auth";

                return;

            }

            throw new Error(
                "Não foi possível carregar os cartões."
            );

        }

        cartoes =
            await resposta.json();

        renderizarCartoes();

    } catch (erro) {

        console.error(
            "Erro ao carregar cartões:",
            erro
        );

        cartoesList.innerHTML =
            `<div class="empty-state">
                Erro ao carregar os cartões.
            </div>`;

    }

}

function trocarPosicaoCartao(element, event) {
    // Evita alternar se clicar nos botões de ação internos
    if (event.target.closest('.card-actions')) return;
    
    element.classList.toggle('flipped');
}

// ============================================================
// RENDERIZAR
// ============================================================

function renderizarCartoes() {

    atualizarResumo();


    if (!cartoes.length) {

        cartoesList.innerHTML =
            `<div class="empty-state">
                Você ainda não possui cartões cadastrados.
            </div>`;

        return;

    }




    cartoesList.innerHTML =
        cartoes.map(
            cartao => {

                        let imagemCartao = "None";
                        const nomeCartao = cartao.nome.replace(/\s+/g, "").toUpperCase(); 

                        if (nomeCartao === "ITAUPERSONNALITEBLACK" || nomeCartao === "ITAUPERSONNALITE" || nomeCartao === "ITAUPERSONNALITEMASTERCARDBLACK") {
                            imagemCartao = "itauPersonaliteBlack.png";
                        } else if (nomeCartao === "NUBANKULTRAVIOLETA" || nomeCartao === "NUBANKVIOLETA" || nomeCartao === "NUBANKULTRA" || nomeCartao === "NUULTRAVIOLETA") {
                            imagemCartao = "nubankUltravioleta.png";
                        } else if (nomeCartao === "BRADESCOAETERNUM" || nomeCartao === "AETERNUM" || nomeCartao === "BRADESCOVISAETERNUM" || nomeCartao === "AETERNUMVISAINFINITE") {
                            imagemCartao = "bradescoAeternum.png";
                        } else if (nomeCartao === "SANTANDERUNLIMITED" || nomeCartao === "UNLIMITED" || nomeCartao === "SANTANDERUNLIMITEDBLACK" || nomeCartao === "SANTANDERUNLIMITEDINFINITE") {
                            imagemCartao = "santanderUnlimited.png";
                        } else if (nomeCartao === "BBALTUS" || nomeCartao === "BANCODOBRASILALTUS" || nomeCartao === "ALTUS" || nomeCartao === "ALTUSVISAINFINITE") {
                            imagemCartao = "bbAltus.png";
                        } else if (nomeCartao === "C6CARBON" || nomeCartao === "C6CARBONBLACK" || nomeCartao === "CARBON" || nomeCartao === "CARBONBLACK") {
                            imagemCartao = "c6Carbon.png";
                        } else if (nomeCartao === "BTGULTRABLUE" || nomeCartao === "ULTRABLUE" || nomeCartao === "BTGULTRABLUEWEBP" || nomeCartao === "BTGBLUE") {
                            imagemCartao = "btgUltrablue.webp";
                        } else if (nomeCartao === "BRBDUX" || nomeCartao === "DUX" || nomeCartao === "DUXVISAINFINITE" || nomeCartao === "BRBDUXVISA") {
                            imagemCartao = "brbDux.png";
                        } else if (nomeCartao === "SANTANDERUNIQUE" || nomeCartao === "UNIQUE" || nomeCartao === "SANTANDERUNIQUEBLACK" || nomeCartao === "SANTANDERUNIQUEINFINITE") {
                            imagemCartao = "santanderUnique.png";
                        } else if (nomeCartao === "ITAUSIGNATURE" || nomeCartao === "ITAUNICLASSSIGNATURE" || nomeCartao === "UNICLASSSIGNATURE" || nomeCartao === "ITAUSIGNATUR") {
                            imagemCartao = "itauSignature.png";
                        } else if (nomeCartao === "XPINFINITE" || nomeCartao === "XPVISAINFINITE" || nomeCartao === "XP" || nomeCartao === "CARTAOXP") {
                            imagemCartao = "xpInfinite.png";
                        } else if (nomeCartao === "BRADESCOVISAGOLD" || nomeCartao === "BRADESCOGOLD" || nomeCartao === "VISAGOLDBRADESCO") {
                            imagemCartao = "bradescoVisaGold.png";
                        } else if (nomeCartao === "NUBANKGOLD" || nomeCartao === "NUGOLD" || nomeCartao === "NUBANKMASTERCARDGOLD") {
                            imagemCartao = "nubankGold.png";
                        } else if (nomeCartao === "NUBANKPLATINUM" || nomeCartao === "NUPLATINUM" || nomeCartao === "NUBANKMASTERCARDPLATINUM") {
                            imagemCartao = "nubankPlatinum.png";
                        } else if (nomeCartao === "INTERGOLD" || nomeCartao === "BANCOINTERGOLD" || nomeCartao === "INTERMASTERCARDGOLD") {
                            imagemCartao = "interGold.png";
                        } else if (nomeCartao === "INTERPLATINUM" || nomeCartao === "BANCOINTERPLATINUM" || nomeCartao === "INTERMASTERCARDPLATINUM") {
                            imagemCartao = "interPlatinum.png";
                        } else if (nomeCartao === "SANTANDERSX" || nomeCartao === "SANTANDERSXVISA" || nomeCartao === "SANTANDERSXMASTERCARD" || nomeCartao === "SX") {
                            imagemCartao = "santanderSX.png";
                        } else if (nomeCartao === "ITAUCLICK" || nomeCartao === "CLICK" || nomeCartao === "ITAUCLICKVISA" || nomeCartao === "ITAUCLICKMASTERCARD") {
                            imagemCartao = "itauClick.png";
                        } else if (nomeCartao === "PICPAYPLATINUM" || nomeCartao === "PICPAYCARDPLATINUM" || nomeCartao === "PICPAYPLATINU") {
                            imagemCartao = "picpayPlatinum.png";
                        } else if (nomeCartao === "PICPAYBLACK" || nomeCartao === "PICPAYCARDBLACK" || nomeCartao === "PICPAYBLACK") {
                            imagemCartao = "picpayBlack.webp";
                        } else if (nomeCartao === "PICPAYGOLD" || nomeCartao === "PICPAYCARDGOLD" || nomeCartao === "PICPAYGOLD") {
                            imagemCartao = "picpayGold.webp";
                        } else if (nomeCartao === "MERCADOPAGO" || nomeCartao === "MERCADOLIVRE" || nomeCartao === "CARTAOMERCADOPAGO" || nomeCartao === "MERCADOPAGOVISA") {
                            imagemCartao = "mercadoPago.png";
                        } else if (nomeCartao === "ITAUAZULPLATINUM" || nomeCartao === "AZULPLATINUM" || nomeCartao === "AZULITAUPLATINUM") {
                            imagemCartao = "itauAzulPlatinum.avif";
                        } else if (nomeCartao === "ITAUAZULINFINITE" || nomeCartao === "AZULINFINITE" || nomeCartao === "AZULITAUVISAINFINITE") {
                            imagemCartao = "itauAzulInfinite.avif";
                        } else if (nomeCartao === "NEXTVISAPLATINUM" || nomeCartao === "NEXTPLATINUM" || nomeCartao === "NEXTVISAPLATINUM" || nomeCartao === "NEXT") {
                            imagemCartao = "NextVisaPlatinum.webp";
                        } else if (nomeCartao === "C6YELLOWPINKLOLILOP" || nomeCartao === "C6YELLOWPINK" || nomeCartao === "C6YELLOWLOLIPOP" || nomeCartao === "YELLOWPINK") {
                            imagemCartao = "c6YellowPink&Lolilop.png";
                        } else if (nomeCartao === "C6YELLOWPINEAPLE" || nomeCartao === "C6YELLOWABACAXI" || nomeCartao === "C6YELLOWPINEAPPLE" || nomeCartao === "YELLOWPINEAPLE" || nomeCartao === "C6YELLOW") {
                            imagemCartao = "c6YellowPineaple.png";
                        } else if (nomeCartao === "C6YELLOWBLUECOOLBLUE" || nomeCartao === "C6YELLOWBLUE" || nomeCartao === "C6YELLOWCOOLBLUE" || nomeCartao === "YELLOWBLUE") {
                            imagemCartao = "c6YellowBlue&CoolBlue.png";
                        } else {
                            imagemCartao = "cartaoGenerico.png";
                        }
                        
                const limite =
                    Number(
                        cartao.limite || 0
                    );

                const utilizado =
                    Number(
                        cartao.utilizado || 0
                    );

                const disponivel =
                    Number(
                        cartao.disponivel || 0
                    );

                const percentual =
                    limite > 0
                        ? (
                            utilizado /
                            limite
                        ) * 100
                        : 0;

                const percentualVisual =
                    Math.min(
                        Math.max(
                            percentual,
                            0
                        ),
                        100
                    );


                let classeBarra = "";

                if ( percentual >= 100) {
                    classeBarra =
                        "danger";

                } else if (
                    percentual >= 80
                ) {

                    classeBarra =
                        "warning";

                }


                const classeInativa =
                    cartao.ativo
                        ? ""
                        : "inactive";

                const status =
                    cartao.ativo
                        ? "Ativo"
                        : "Inativo";


return `
    <div class="card-stack" onclick="trocarPosicaoCartao(this, event)">
        
        <div class="card-layer-back">
            <img src="../Imagens-Audios/cartoes/${imagemCartao}" alt="Design do Cartão" />
        </div>

        <article class="card-item card-layer-front ${classeInativa}">
            <div class="card-top">
                <div>
                    <span class="card-bank">${escaparHTML(cartao.banco)}</span>
                    <h3 class="card-name">${escaparHTML(cartao.nome)}</h3>
                </div>
                <span class="card-status">${status}</span>
            </div>

            <div class="card-chip"></div>

            <div class="card-limit-area">
                <div class="card-limit-block">
                    <span>Utilizado</span>
                    <strong>${formatarMoeda(utilizado)}</strong>
                </div>
                <div class="card-limit-block">
                    <span>Disponível</span>
                    <strong>${formatarMoeda(disponivel)}</strong>
                </div>
            </div>

            <div class="card-progress">
                <div class="card-progress-bar">
                    <div class="card-progress-fill ${classeBarra}" style="width: ${percentualVisual}%"></div>
                </div>
                <div class="card-progress-label">
                    <span>${percentual.toFixed(1)}% utilizado</span>
                    <span>Limite: ${formatarMoeda(limite)}</span>
                </div>
            </div>

            <div class="card-dates">
                <span>Fechamento: <strong>dia ${cartao.dia_fechamento}</strong></span>
                <span>Vencimento: <strong>dia ${cartao.dia_vencimento}</strong></span>
            </div>

            <div class="card-actions">
                <button type="button" class="card-action invoice" onclick="abrirFatura(${cartao.id})">Fatura</button>
                <button type="button" class="card-action" onclick="editarCartao(${cartao.id})">Editar</button>
                <button type="button" class="card-action" onclick="alternarCartao(${cartao.id})">${cartao.ativo ? "Desativar" : "Ativar"}</button>
                <button type="button" class="card-action delete" onclick="deletarCartao(${cartao.id})">Excluir</button>
            </div>
        </article>
    </div>
`;
            }
        ).join("");

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
// FORMULÁRIO
// ============================================================

cartaoForm.addEventListener(
    "submit",
    async evento => {

        evento.preventDefault();


        const id =
            cartaoId.value;


        const dados = {

            nome:
                nomeCartao.value.trim(),

            banco:
                bancoCartao.value.trim(),

            limite:
                Number(
                    limiteCartao.value
                ),

            dia_vencimento:
                Number(
                    diaVencimento.value
                ),

            dia_fechamento:
                Number(
                    diaFechamento.value
                ),

            ativo:
                true

        };


        if (
            dados.dia_vencimento < 1 ||
            dados.dia_vencimento > 31
        ) {

            mostrarMensagem(
                "O dia de vencimento deve estar entre 1 e 31.",
                "error"
            );

            return;

        }


        if (
            dados.dia_fechamento < 1 ||
            dados.dia_fechamento > 31
        ) {

            mostrarMensagem(
                "O dia de fechamento deve estar entre 1 e 31.",
                "error"
            );

            return;

        }


        salvarCartao.disabled =
            true;

        salvarCartao.textContent =
            id
                ? "Salvando..."
                : "Adicionando...";

        limparMensagem();


        try {

            const resposta =
                await fetch(

                    id
                        ? `${API_URL}/cartoes/${id}`
                        : `${API_URL}/cartoes`,

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
                    "Não foi possível salvar o cartão."
                );

            }


            mostrarMensagem(
                resultado.mensagem ||
                "Cartão salvo com sucesso!",
                "success"
            );


            limparFormulario();

            await carregarCartoes();

            await carregarContadorNotificacoes();

        } catch (erro) {

            console.error(
                "Erro ao salvar cartão:",
                erro
            );

            mostrarMensagem(
                erro.message ||
                "Erro ao salvar cartão.",
                "error"
            );

        } finally {

            salvarCartao.disabled =
                false;

            salvarCartao.textContent =
                "Adicionar cartão";

        }

    }
);


// ============================================================
// EDITAR
// ============================================================

function editarCartao(id) {

    const cartao =
        cartoes.find(
            item =>
                Number(item.id) ===
                Number(id)
        );

    if (!cartao) {
        return;
    }


    cartaoId.value =
        cartao.id;

    nomeCartao.value =
        cartao.nome;

    bancoCartao.value =
        cartao.banco;

    limiteCartao.value =
        cartao.limite;

    diaFechamento.value =
        cartao.dia_fechamento;

    diaVencimento.value =
        cartao.dia_vencimento;


    formTitulo.textContent =
        "Editar cartão";

    salvarCartao.textContent =
        "Salvar alterações";

    cancelarEdicao.classList.remove(
        "hidden"
    );


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


window.editarCartao =
    editarCartao;


// ============================================================
// ATIVAR / DESATIVAR
// ============================================================

async function alternarCartao(id) {

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
// EXCLUIR
// ============================================================

async function deletarCartao(id) {

    const confirmar =
        confirm(
            "Tem certeza que deseja excluir este cartão?"
        );

    if (!confirmar) {
        return;
    }


    try {

        const resposta =
            await fetch(
                `${API_URL}/cartoes/${id}`,
                {
                    method: "DELETE",
                    credentials:
                        "include"
                }
            );


        const resultado =
            await resposta.json();


        if (!resposta.ok) {

            throw new Error(
                resultado.detail ||
                "Não foi possível excluir o cartão."
            );

        }


        mostrarMensagem(
            resultado.mensagem ||
            "Cartão excluído com sucesso!",
            "success"
        );


        await carregarCartoes();

    } catch (erro) {

        console.error(
            "Erro ao excluir cartão:",
            erro
        );

        mostrarMensagem(
            erro.message ||
            "Erro ao excluir o cartão.",
            "error"
        );

    }

}


window.deletarCartao =
    deletarCartao;


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


window.abrirFatura =
    abrirFatura;


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
// LIMPAR FORMULÁRIO
// ============================================================

function limparFormulario() {

    cartaoId.value = "";

    nomeCartao.value = "";

    bancoCartao.value = "";

    limiteCartao.value = "0";

    diaFechamento.value = "";

    diaVencimento.value = "";

    formTitulo.textContent =
        "Adicionar cartão";

    salvarCartao.textContent =
        "Adicionar cartão";

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


iniciarPagina();