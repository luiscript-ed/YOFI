
// auth.js

const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

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

    const dados = {

        email: document.getElementById("loginEmail").value,
        senha: document.getElementById("loginSenha").value

    };

    console.log("=== DADOS ENVIADOS ===");
    console.log(dados);

    try{

        const resposta = await fetch("https://yofi-api.onrender.com/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(dados)

        });

        console.log("=== STATUS ===");
        console.log(resposta.status);

        const resultado = await resposta.json();

        console.log("=== RESPOSTA DA API ===");
        console.log(resultado);

        mensagem.innerText = resultado.mensagem || resultado.detail;

        if(resposta.ok){

            console.log("LOGIN OK");

            localStorage.setItem("usuario_id", resultado.usuario_id);
            localStorage.setItem("nome", resultado.nome);
            localStorage.setItem("login", "true");

           

        }else{

            console.log("LOGIN FALHOU");
            localStorage.setItem("login", "false");
        }

    }catch(error){

        console.log("=== ERRO ===");
        console.error(error);

        mensagem.innerText = "Erro ao conectar com o servidor.";

    }

});