const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const botaoSubmitLogin =
    loginForm.querySelector(".submit-btn");

const loadingGifLogin =
    loginForm.querySelector(".loading-gif");

const mensagem =
    document.getElementById("mensagem");


// ============================================================
// GOOGLE
// ============================================================

const GOOGLE_CLIENT_ID =
    "105535642997-gvdf8prusufi8453kghrkh41mke2bsqc.apps.googleusercontent.com";

// ============================================================
// ALTERAR ENTRE LOGIN E CADASTRO
// ============================================================

loginBtn.addEventListener("click", () => {
login_painel();
});

registerBtn.addEventListener("click", () => {
cadastro_painel();
});

// =========================
// VERIFICAR LOGIN EXISTENTE
// =========================

async function verificarLogin() {

    console.log("Verificando se existe uma sessão...");

    try {

        const resposta = await fetch(
            "https://yofi-api.onrender.com/me",
            {
                method: "GET",
                credentials: "include"
            }
        );

        console.log(
            "Status da verificação:",
            resposta.status
        );

        // Não existe token/sessão válida
        if (!resposta.ok) {

            console.log(
                "Nenhuma sessão válida encontrada."
            );

            return false;
        }

        const usuario = await resposta.json();

        console.log(
            "Sessão encontrada!",
            usuario
        );

        console.log(
            "Usuário:",
            usuario.nome
        );

        console.log(
            "ID:",
            usuario.usuario_id
        );

        // Usuário já está logado
        window.location.href =
            "https://luiscript-ed.github.io/YOFI/Front-end/Inicial/page";

        return true;

    } catch (erro) {

        console.error(
            "Erro ao verificar sessão:",
            erro
        );

        return false;
    }
}


verificarLogin();

function login_painel() {

loginBtn.classList.add("active");
registerBtn.classList.remove("active");

loginForm.classList.remove("hidden");
registerForm.classList.add("hidden");

}

function cadastro_painel() {

registerBtn.classList.add("active");
loginBtn.classList.remove("active");

registerForm.classList.remove("hidden");
loginForm.classList.add("hidden");

}

// ============================================================
// ANIMAÇÃO DO BOTÃO DE LOGIN
// ============================================================

// LOGIN COMEÇOU

loginForm.addEventListener("yofi:login-start", () => {

    botaoSubmitLogin.disabled = true;

    setTimeout(() => {

        botaoSubmitLogin.style.display = "none";

        loadingGifLogin.classList.add("show");

    }, 250);

});


// LOGIN TERMINOU

loginForm.addEventListener("yofi:login-end", () => {

    botaoSubmitLogin.disabled = false;

    botaoSubmitLogin.style.display = "block";

    loadingGifLogin.classList.remove("show");

});

// ============================================================
// CADASTRO
// ============================================================

registerForm.addEventListener("submit", async (e) => {

e.preventDefault();

const dados = {

    nome: document.getElementById("cadastroNome").value,

    email: document.getElementById("cadastroEmail").value,

    senha: document.getElementById("cadastroSenha").value

};


try {

    const resposta = await fetch(
        "https://yofi-api.onrender.com/cadastro",
        {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(dados)

        }
    );


    const resultado = await resposta.json();


    mensagem.innerText =
        resultado.mensagem || resultado.detail;


    if (resposta.ok) {

        login_painel();

    }


} catch (error) {

    console.error("Erro no cadastro:", error);

    mensagem.innerText =
        "Erro ao conectar com o servidor.";

}

});

// ============================================================
// LOGIN NORMAL
// ============================================================

loginForm.addEventListener("submit", async (e) => {

e.preventDefault();


// Sinalizar que o login começou

const eventoInicio =
    new CustomEvent("yofi:login-start");

loginForm.dispatchEvent(eventoInicio);


const dados = {

    email:
        document.getElementById("loginEmail").value,

    senha:
        document.getElementById("loginSenha").value

};


try {

    const resposta = await fetch(
        "https://yofi-api.onrender.com/login",
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


    console.log(
        "Status:",
        resposta.status
    );

    console.log(
        "Resposta:",
        resultado
    );


    mensagem.innerText =
        resultado.mensagem ||
        resultado.detail;


    if (resposta.ok) {

        console.log("LOGIN OK");


        localStorage.setItem(
            "nome",
            resultado.nome
        );


        window.location.href =
            "https://luiscript-ed.github.io/YOFI/Front-end/Inicial/page";

    } else {

        console.log("LOGIN FALHOU");

    }


} catch (error) {

    console.error(
        "Erro no login:",
        error
    );


    mensagem.innerText =
        "Erro ao conectar com o servidor.";

}


// Sinalizar que o login terminou

const eventoFim =
    new CustomEvent("yofi:login-end");

loginForm.dispatchEvent(eventoFim);

});

// ============================================================
// LOGIN COM GOOGLE
// ============================================================

function loginComGoogle(response) {

console.log(
    "Token recebido do Google."
);


fetch(
    "https://yofi-api.onrender.com/login/google",
    {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        credentials: "include",

        body: JSON.stringify({

            credential: response.credential

        })

    }
)

.then(async (resposta) => {

    const resultado =
        await resposta.json();


    console.log(
        "Status Google:",
        resposta.status
    );

    console.log(
        "Resposta Google:",
        resultado
    );


    if (!resposta.ok) {

        mensagem.innerText =
            resultado.detail ||
            "Não foi possível entrar com o Google.";

        return;

    }


    // Login realizado

    mensagem.innerText =
        resultado.mensagem;


    localStorage.setItem(
        "nome",
        resultado.nome
    );


    window.location.href =
        "https://luiscript-ed.github.io/YOFI/Front-end/Inicial/page";

})


.catch((error) => {

    console.error(
        "Erro no login com Google:",
        error
    );


    mensagem.innerText =
        "Erro ao conectar com o servidor.";

});

}

// ============================================================
// INICIALIZAR GOOGLE IDENTITY SERVICES
// ============================================================

function inicializarGoogle() {

    if (
        typeof google === "undefined" ||
        !google.accounts ||
        !google.accounts.id
    ) {

        console.error(
            "Google Identity Services não foi carregado."
        );

        return;
    }

    google.accounts.id.initialize({

        client_id: GOOGLE_CLIENT_ID,

        callback: loginComGoogle

    });

google.accounts.id.renderButton(
    document.getElementById("googleButton"),
    {
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: 300
    }
);


}


// Espera o carregamento da página

window.addEventListener("load", () => {

    inicializarGoogle();

});
