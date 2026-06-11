const abrirIA = document.getElementById("abrirIA");
const fecharIA = document.getElementById("fecharIA");
const painelIA = document.getElementById("painelIA");

abrirIA.addEventListener("click", () => {
    painelIA.classList.add("active");
});

fecharIA.addEventListener("click", () => {
    painelIA.classList.remove("active");
});

const transacoes = [];

const container = document.getElementById("lista-transacoes");

if(transacoes.length > 0){

    container.innerHTML = "";

    transacoes.slice(0,3).forEach(t => {

        container.innerHTML += `
            <div class="transacao">
                <span>${t.descricao}</span>
                <span>R$ ${t.valor}</span>
            </div>
        `;

    });

}