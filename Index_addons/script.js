// script.js
console.log("YOFI inicializado com sucesso!");

const cards = document.querySelectorAll(".feature-card");

// Sistema ultra passado de aumentar o tamanho dos itens pelo js
cards.forEach(card => {

    card.addEventListener("mouseenter", () => {
        card.style.boxShadow = "0 0 25px rgba(192,132,252,0.25)";
    });

    card.addEventListener("mouseleave", () => {
        card.style.boxShadow = "none";
    });

});
