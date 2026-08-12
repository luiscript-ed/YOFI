const form = document.getElementById("transacaoForm");

function salvarUrlAtual() {
    const urlAtual = window.location.href;
    localStorage.setItem('urlSalva', urlAtual);
    console.log('URL salva com sucesso:', urlAtual);
}

salvarUrlAtual();

let usuario = null;
let usuarioId = null;

async function verificarLogin() {

    try {

        const resposta = await fetch(
            "https://yofi-api.onrender.com/me",
            {
                method: "GET",
                credentials: "include"
            }
        );

        if (!resposta.ok) {

            window.location.href =
                "../autentification.html";

            return false;
        }

        usuario = await resposta.json();

        console.log("Usuário autenticado:", usuario);

        usuarioId = usuario.usuario_id;

        console.log("ID do usuário:", usuarioId);

        return true;

    } catch (erro) {

        console.error(
            "Erro ao verificar autenticação:",
            erro
        );

        window.location.href =
            "../autentification.html";

        return false;
    }
}


async function iniciar() {

    const autenticado = await verificarLogin();

    if (!autenticado) {
        return;
    }

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const tipo =
            document.getElementById("tipo").value;

        const categoria =
            document.getElementById("categoria").value;

        const valor =
            document.getElementById("valor").value;

        const descricao =
            document.getElementById("descricao").value;

        const dados = {

            tipo: tipo,

            categoria: categoria,

            valor: Number(valor),

            descricao: descricao

        };

        try {

            const resposta = await fetch(
                "https://yofi-api.onrender.com/transacao",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    credentials: "include",

                    body: JSON.stringify(dados)
                }
            );

            const resultado =
                await resposta.json();

            if (resposta.ok) {

                alert(
                    "Transação cadastrada com sucesso!"
                );

                form.reset();

            } else {

                console.error(
                    "Erro HTTP:",
                    resposta.status,
                    resultado
                );

                alert(
                    resultado.detail ||
                    "Erro ao cadastrar transação."
                );
            }

        } catch (erro) {

            console.error(
                "Erro ao enviar transação:",
                erro
            );

            alert(
                "Erro ao conectar com o servidor."
            );
        }

    });

}

iniciar();