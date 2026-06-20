
// script.js

console.log("YOFI iniciado.");

const cards = document.querySelectorAll(".feature-card");

cards.forEach(card => {

    card.addEventListener("mouseenter", () => {
        card.style.boxShadow = "0 0 25px rgba(192,132,252,0.25)";
    });

    card.addEventListener("mouseleave", () => {
        card.style.boxShadow = "none";
    });

});
