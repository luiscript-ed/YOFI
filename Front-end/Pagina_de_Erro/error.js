document.addEventListener('DOMContentLoaded', () => {
    // 1. Seleciona o botão/link de voltar
    const btnHome = document.querySelector('.btn-home');

    // 2. Busca a URL salva no localStorage (usando a mesma chave usada na gravação)
    const urlSalva = localStorage.getItem('urlSalva') || localStorage.getItem('ultimaPaginaVisitada');

    // 3. Se houver uma URL salva, altera o comportamento do botão
    if (urlSalva && btnHome) {
        // Atualiza o texto para fazer mais sentido (opcional)
        btnHome.textContent = 'Voltar para a página anterior';

        // Redireciona o usuário ao clicar no link <a>
        btnHome.addEventListener('click', (event) => {
            event.preventDefault(); // Impede o comportamento padrão do href
            window.location.href = urlSalva;
        });
    }
});