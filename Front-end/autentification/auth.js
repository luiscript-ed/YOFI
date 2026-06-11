
// auth.js

const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const mensagem = document.getElementById("mensagem");

// ALTERAR ENTRE LOGIN E CADASTRO

loginBtn.addEventListener("click", () => {

    loginBtn.classList.add("active");
    registerBtn.classList.remove("active");

    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");

});

registerBtn.addEventListener("click", () => {

    registerBtn.classList.add("active");
    loginBtn.classList.remove("active");

    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");

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

        const resposta = await fetch("http://127.0.0.1:8000/cadastro", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(dados)

        });

        const resultado = await resposta.json();

        mensagem.innerText = resultado.mensagem || resultado.detail;

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

    try{

        const resposta = await fetch("http://127.0.0.1:8000/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(dados)

        });

        const resultado = await resposta.json();

        mensagem.innerText = resultado.mensagem || resultado.detail;

        // LOGIN BEM SUCEDIDO
        if(resposta.ok){

            localStorage.setItem("usuario_id", resultado.usuario_id);
            localStorage.setItem("nome", resultado.nome);

            setTimeout(() => {

                window.location.href = "inicial/page";

            }, 1500);

        }

    }catch(error){

        mensagem.innerText = "Erro ao conectar com o servidor.";

    }

})