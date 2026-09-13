from pwdlib import PasswordHash


# Instância recomendada pelo pwdlib
password_hash = PasswordHash.recommended()


def gerar_hash_senha(senha: str) -> str:
    """
    Transforma uma senha normal em um hash seguro.
    """

    return password_hash.hash(senha)


def verificar_senha(
    senha: str,
    senha_hash: str
) -> bool:
    """
    Verifica se a senha informada corresponde ao hash armazenado.
    """

    return password_hash.verify(
        senha,
        senha_hash
    )