document.addEventListener('DOMContentLoaded', () => {
    const btnHome = document.querySelector('.btn-home');

    const urlSalva = localStorage.getItem('urlSalva') || localStorage.getItem('ultimaPaginaVisitada');


    if (urlSalva && btnHome) {
        btnHome.textContent = 'Voltar para a página anterior';


        btnHome.addEventListener('click', (event) => {
            event.preventDefault();
            window.location.href = urlSalva;
        });
    }
});