from principais.utils.autenticacao import criar_token
from pwdlib import PasswordHash

import os
import psycopg2

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from fastapi import HTTPException, APIRouter, Response

from principais.banco import conectar
from principais.schemas.usuario import UsuarioLogin, GoogleLogin

router = APIRouter(
    prefix="/login",
    tags=["Login"]
)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

if not GOOGLE_CLIENT_ID:
    raise RuntimeError("GOOGLE_CLIENT_ID não configurado.")


@router.post("/")
def login(usuario: UsuarioLogin, response: Response):

    conn = conectar()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, nome, senha
        FROM usuarios

        WHERE email = %s
        """,
        (
            usuario.email,
        )
    )

    resultado = cursor.fetchone()

    cursor.close()
    conn.close()

    password_hash = PasswordHash.recommended()
    if resultado and password_hash.verify(usuario.senha, resultado[2]):
        usuario_id, nome = resultado[0], resultado[1]
        
        token = criar_token(usuario_id)

        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=1800
        )

        return {
            "mensagem": "Login realizado com sucesso!",
            "nome": nome
        }

    raise HTTPException(
        status_code=401,
        detail="E-mail ou senha incorretos."
    )

@router.post("/google")
def login_google(dados: GoogleLogin, response: Response):

    #  VALIDAR TOKEN DO GOOGLE
  
    try:
        idinfo = id_token.verify_oauth2_token(
            dados.credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )

    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Token do Google inválido ou expirado."
        )

    google_id = idinfo.get("sub")
    email = idinfo.get("email")
    nome = idinfo.get("name")
    imagem = idinfo.get("picture")

    if not google_id or not email:
        raise HTTPException(
            status_code=401,
            detail="O Google não forneceu os dados necessários."
        )


    # VERIFICAR E-MAIL


    if not idinfo.get("email_verified"):
        raise HTTPException(
            status_code=401,
            detail="O e-mail da conta Google não foi verificado."
        )


    # PROCURAR USUÁRIO


    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT id, nome, email, provedor, google_id, imagem
            FROM usuarios
            WHERE google_id = %s
               OR email = %s
            LIMIT 1
            """,
            (google_id, email)
        )

        usuario = cursor.fetchone()


        # USUÁRIO NÃO EXISTE → CRIAR


        if not usuario:

            cursor.execute(
                """
                INSERT INTO usuarios
                (nome, email, senha, provedor, google_id, imagem)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id, nome
                """,
                (
                    nome or "Usuário Google",
                    email,
                    None,
                    "google",
                    google_id,
                    imagem
                )
            )

            novo_usuario = cursor.fetchone()

            usuario_id = novo_usuario[0]
            nome_usuario = novo_usuario[1]

            conn.commit()


        # USUÁRIO JÁ EXISTE


        else:

            usuario_id = usuario[0]
            nome_usuario = usuario[1]



            if usuario[4] is None or not usuario[5]:

                cursor.execute(
                    """
                    UPDATE usuarios
                    SET google_id = %s,
                        provedor = 'google',
                        imagem = %s
                    WHERE id = %s
                    """,
                    (google_id, imagem, usuario_id)
                )

                conn.commit()

    except psycopg2.IntegrityError:

        conn.rollback()

        raise HTTPException(
            status_code=409,
            detail="Não foi possível vincular esta conta Google."
        )

    finally:

        cursor.close()
        conn.close()

    token = criar_token(usuario_id)


    # COOKIE

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=1800
    )

    return {
        "mensagem": "Login com Google realizado com sucesso!",
        "nome": nome_usuario
    }
