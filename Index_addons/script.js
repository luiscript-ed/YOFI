
// script.js
console.log("YOFI inicializado com sucesso!");

const cards = document.querySelectorAll(".feature-card");

// Biblioteca de cookie
import Cookies from "js-cookie";

// Sistema de Login automatico, para facilitar a vida dos usuários
// Criação do cook e seu tempo até a pessoa ter que fazer outro login
const fez_login = Cookies.set()("login", "true",{
    expires: 30 
        });

// Verificação do login
if (Cookies.get("login") === "true") {
    window.open("https://luiscript-ed.github.io/YOFI/Front-end/Inicial/page", "_blank");;
}
// Sistema ultra passado de aumentar o tamanho dos itens pelo js
cards.forEach(card => {

    card.addEventListener("mouseenter", () => {
        card.style.boxShadow = "0 0 25px rgba(192,132,252,0.25)";
    });

    card.addEventListener("mouseleave", () => {
        card.style.boxShadow = "none";
    });

});
