// auth.js

const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const botaoSubmitLogin = loginForm.querySelector(".submit-btn");

const mensagem = document.getElementById("mensagem");

// ============================================================
// GOOGLE
// ============================================================

// Client ID do Google Cloud
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




loginForm.addEventListener("yofi:login-start", () => {


botaoSubmitLogin.classList.add("loading");
botaoSubmitLogin.disabled = true;


});



loginForm.addEventListener("yofi:login-end", () => {


botaoSubmitLogin.classList.remove("loading");
botaoSubmitLogin.disabled = false;


});

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

window.onload = function () {


if (
    typeof google === "undefined" ||
    !google.accounts
) {

    console.error(
        "Google Identity Services não foi carregado."
    );

    return;

}


google.accounts.id.initialize({

    client_id:
        GOOGLE_CLIENT_ID,

    callback:
        loginComGoogle

});


google.accounts.id.renderButton(

    document.getElementById(
        "googleButton"
    ),

    {

        theme: "outline",

        size: "large",

        text: "continue_with",

        shape: "rectangular",

        width: 300

    }

);

};
