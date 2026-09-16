const menubtn = getElementById('menu-btn');
const mesAnterior = getElementById('mes-anterior');
const proximoMes = getElementById('proximo-mes');

const notificacaoBtn = querySelector('.notificacao-btn');

const botoesCategoria = querySelectorAll('.categoria-btn');
botoesCategoria.forEach((botao) => {
    botao.addEventListener("click", () => {
        const categoria = botao.dataset.categoria;
        console.log("Categoria selecionada: ${categoria}");
    });
});
