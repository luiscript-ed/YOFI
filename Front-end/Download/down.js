function salvarUrlAtual() {
    const urlAtual = window.location.href;
    localStorage.setItem('urlSalva', urlAtual);
    console.log('URL salva com sucesso:', urlAtual);
}

salvarUrlAtual();