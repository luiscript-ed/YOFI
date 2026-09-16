const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const botaoSubmitLogin = loginForm.querySelector(".submit-btn");
const loadingGifLogin = loginForm.querySelector(".loading-gif");
const mensagem = document.getElementById("mensagem");

function salvarUrlAtual() {
  const urlAtual = window.location.href;
  localStorage.setItem('urlSalva', urlAtual);
  console.log('URL salva com sucesso:', urlAtual);
}

salvarUrlAtual();

// Retorna uma Promise que resolve em true (passou) ou false (falhou)
function executarReCAPTCHA() {
  return new Promise((resolve) => {
    const container = document.querySelector('.reCAPTCHA');
    const tempEl = document.getElementById('temporizador');
    const numSorteadoEl = document.getElementById('numero-sorteado');
    const inputEl = document.getElementById('input-numero');
    const formEl = document.getElementById('captcha-form');
    const statusEl = document.getElementById('status-resposta');

    container.classList.add('active');

    let rodadaAtual = 0;
    let acertos = 0;
    let numeroSorteado = null;
    let respondeuRodada = false;

    let intervaloRodada = null;
    let intervaloCronometro = null;

    function proximaRodada() {
      if (rodadaAtual >= 5) {
        finalizarDesafio();
        return;
      }

      rodadaAtual++;
      respondeuRodada = false;
      inputEl.value = '';
      inputEl.disabled = false;
      inputEl.focus();
      statusEl.textContent = `Rodada ${rodadaAtual} de 5`;

      numeroSorteado = Math.floor(Math.random() * 10);
      numSorteadoEl.textContent = numeroSorteado;

      let tempoRestante = 2.9;
      tempEl.textContent = `Temporizador: ${tempoRestante.toFixed(1)}s`;

      clearInterval(intervaloCronometro);
      intervaloCronometro = setInterval(() => {
        tempoRestante -= 0.1;
        if (tempoRestante > 0) {
          tempEl.textContent = `Temporizador: ${tempoRestante.toFixed(1)}s`;
        } else {
          tempEl.textContent = `Temporizador: 0.0s`;
          clearInterval(intervaloCronometro);
        }
      }, 100);
    }

    formEl.onsubmit = function (e) {
      e.preventDefault();
      if (respondeuRodada) return;

      const palpite = parseInt(inputEl.value, 10);

      if (palpite === numeroSorteado) {
        acertos++;
        statusEl.textContent = "Correto!";
        statusEl.style.color = "green";
      } else {
        statusEl.textContent = "Incorreto!";
        statusEl.style.color = "red";
      }

      respondeuRodada = true;
      inputEl.disabled = true;
    };

    function finalizarDesafio() {
      clearInterval(intervaloRodada);
      clearInterval(intervaloCronometro);
      container.classList.remove('active'); // Oculta o reCAPTCHA ao terminar

      const aprovado = acertos >= 3;
      resolve(aprovado);
    }

    proximaRodada();
    intervaloRodada = setInterval(proximaRodada, 2900);
  });
}

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

    if (!resposta.ok) {
      console.log("Nenhuma sessão válida encontrada.");
      return false;
    }

    const usuario = await resposta.json();
    window.location.href =
      "https://luiscript-ed.github.io/YOFI/Front-end/Inicial/page";

    return true;
  } catch (erro) {
    console.error("Erro ao verificar sessão:", erro);
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

// EVENTOS DE LOGIN
loginForm.addEventListener("yofi:login-start", () => {
  botaoSubmitLogin.disabled = true;
  setTimeout(() => {
    botaoSubmitLogin.style.display = "none";
    loadingGifLogin.classList.add("show");
  }, 250);
});

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

  mensagem.innerText = "Complete a verificação do reCAPTCHA...";
  const captchaPassou = await executarReCAPTCHA();

  if (!captchaPassou) {
    mensagem.innerText = "Falha no reCAPTCHA. Tente novamente.";
    return;
  }

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
    mensagem.innerText = resultado.mensagem || resultado.detail;

    if (resposta.ok) {
      login_painel();
    }
  } catch (error) {
    console.error("Erro no cadastro:", error);
    mensagem.innerText = "Erro ao conectar com o servidor.";
  }
});

// ============================================================
// LOGIN NORMAL
// ============================================================

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  mensagem.innerText = "Complete a verificação do reCAPTCHA...";
  const captchaPassou = await executarReCAPTCHA();

  if (!captchaPassou) {
    mensagem.innerText = "Falha no reCAPTCHA. Tente novamente.";
    return;
  }

  loginForm.dispatchEvent(new CustomEvent("yofi:login-start"));

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
    mensagem.innerText = resultado.mensagem || resultado.detail;

    if (resposta.ok) {
      localStorage.setItem("nome", resultado.nome);
      window.location.href =
        "https://luiscript-ed.github.io/YOFI/Front-end/Inicial/page";
    }
  } catch (error) {
    console.error("Erro no login:", error);
    mensagem.innerText = "Erro ao conectar com o servidor.";
  } finally {
    loginForm.dispatchEvent(new CustomEvent("yofi:login-end"));
  }
});

// ============================================================
// LOGIN COM GOOGLE
// ============================================================

function loginComGoogle(response) {
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
    const resultado = await resposta.json();

    if (!resposta.ok) {
      mensagem.innerText =
        resultado.detail || "Não foi possível entrar com o Google.";
      return;
    }

    mensagem.innerText = resultado.mensagem;
    localStorage.setItem("nome", resultado.nome);
    window.location.href =
      "https://luiscript-ed.github.io/YOFI/Front-end/Inicial/page";
  })
  .catch((error) => {
    console.error("Erro no login com Google:", error);
    mensagem.innerText = "Erro ao conectar com o servidor.";
  });
}

function inicializarGoogle() {
  if (
    typeof google === "undefined" ||
    !google.accounts ||
    !google.accounts.id
  ) {
    console.error("Google Identity Services não foi carregado.");
    return;
  }

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: loginComGoogle,
    context: "signin",
    auto_select: false,
    cancel_on_tap_outside: false
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

window.addEventListener("load", () => {
  inicializarGoogle();
});