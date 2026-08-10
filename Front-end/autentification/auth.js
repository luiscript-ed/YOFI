
// auth.js

const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const botaoSubmitLogin = loginForm.querySelector(".submit-btn");

const mensagem = document.getElementById("mensagem");

// ALTERAR ENTRE LOGIN E CADASTRO

loginBtn.addEventListener("click", () => { login_painel() });

registerBtn.addEventListener("click", () => { cadastro_painel() });

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

    botaoSubmitLogin.classList.add("loading");
    botaoSubmitLogin.disabled = true;
});


// LOGIN TERMINOU
loginForm.addEventListener("yofi:login-end", () => {

    botaoSubmitLogin.classList.remove("loading");
    botaoSubmitLogin.disabled = false;
});

// ==============================
// CADASTRO
// ==============================

registerForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const dados = {
        nome: document.getElementById("cadastroNome").value,
        email: document.getElementById("cadastroEmail").value,
        senha: document.getElementById("cadastroSenha").value
    };

    try{

        const resposta = await fetch("https://yofi-api.onrender.com/cadastro", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(dados)

        });

        const resultado = await resposta.json();

        mensagem.innerText = resultado.mensagem || resultado.detail;

        login_painel()


    }catch(error){

        mensagem.innerText = "Erro ao conectar com o servidor.";

    }

});

// ==============================
// LOGIN
// ==============================

loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    //sinalizar que o login começou para o front-end
    const eventoInicio =
        new CustomEvent("yofi:login-start");

    loginForm.dispatchEvent(eventoInicio);

    const dados = {
        email: document.getElementById("loginEmail").value,
        senha: document.getElementById("loginSenha").value
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

        const resultado = await resposta.json();

        console.log("Status:", resposta.status);
        console.log("Resposta:", resultado);

        mensagem.innerText =
            resultado.mensagem || resultado.detail;

        if (resposta.ok) {

            console.log("LOGIN OK");

            localStorage.setItem("nome", resultado.nome);

            window.location.href =
                "https://luiscript-ed.github.io/YOFI/Front-end/Inicial/page";

        } else {

            console.log("LOGIN FALHOU");

        }

    } catch (error) {

        console.error("Erro no login:", error);

        mensagem.innerText =
            "Erro ao conectar com o servidor.";

    }

    // sinalizar que o login terminou para o front-end
    const eventoFim =
        new CustomEvent("yofi:login-end");

    loginForm.dispatchEvent(eventoFim);
            awdaw
});
