from fastapi import HTTPException, APIRouter, Request
from principais.banco import conectar
from principais.utils.autenticacao import obter_usuario_autenticado

router = APIRouter(
    tags=["me"]
)

@router.get("/me")
def usuario_atual(
 request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)
    conn = conectar()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT id, nome, email, imagem
            FROM usuarios
            WHERE id = %s
            """,
            (usuario_id,)
        )

        resultado = cursor.fetchone()

        if not resultado:
            raise HTTPException(
                status_code=404,
                detail="Usuário não encontrado."
            )

        return {
            "usuario_id": resultado[0],
            "nome": resultado[1],
            "email": resultado[2],
            "imagem": resultado[3]
        }

    finally:
        cursor.close()
        conn.close()