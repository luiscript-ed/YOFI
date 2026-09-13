import os
from fastapi import FastAPI, HTTPException, Request, Response, Depends, UploadFile, File, Form
from pwdlib import PasswordHash
import jwt

JWT_SECRET = os.getenv("JWT_SECRET")

if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET não configurado.")

def obter_usuario_autenticado(request: Request):

    token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Usuário não autenticado."
        )

    try:

        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=["HS256"]
        )

        usuario_id = payload.get("usuario_id")

        if not usuario_id:
            raise HTTPException(
                status_code=401,
                detail="Token inválido."
            )

        return int(usuario_id)

    except jwt.ExpiredSignatureError:

        raise HTTPException(
            status_code=401,
            detail="Sessão expirada."
        )

    except jwt.InvalidTokenError:

        raise HTTPException(
            status_code=401,
            detail="Token inválido."
        )
  