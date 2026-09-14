from fastapi import HTTPException, Request, APIRouter

from principais.banco import conectar
from principais.utils.autenticacao import obter_usuario_autenticado

router = APIRouter(
    prefix="/notificacoes",
    tags=["Notificacoes"]
)

@router.get("/")
def listar_notificacoes(
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)
    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT
                id,
                titulo,
                mensagem,
                data
            FROM notificacoes
            WHERE usuario_id = %s
            ORDER BY id DESC
            """,
            (usuario_id,)
        )

        return [
            {
                "id": n[0],
                "titulo": n[1],
                "mensagem": n[2],
                "data": n[3]
            }
            for n in cursor.fetchall()
        ]

    finally:
        cursor.close()
        conn.close()


@router.get("/contador")
def contar_notificacoes(
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)
    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT COUNT(*)
            FROM notificacoes
            WHERE usuario_id = %s
            """,
            (usuario_id,)
        )

        quantidade = cursor.fetchone()[0]

        return {
            "quantidade": quantidade
        }

    finally:
        cursor.close()
        conn.close()


@router.delete("/{notificacao_id}")
def deletar_notificacao(
    notificacao_id: int,
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)
    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            DELETE FROM notificacoes
            WHERE id = %s
            AND usuario_id = %s
            RETURNING id
            """,
            (notificacao_id, usuario_id)
        )

        resultado = cursor.fetchone()

        if not resultado:
            raise HTTPException(
                status_code=404,
                detail="Notificação não encontrada."
            )

        conn.commit()

        return {
            "mensagem": "Notificação removida."
        }

    finally:
        cursor.close()
        conn.close()


@router.delete("/")
def deletar_todas_notificacoes(
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)
    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            DELETE FROM notificacoes
            WHERE usuario_id = %s
            """,
            (usuario_id,)
        )

        quantidade = cursor.rowcount

        conn.commit()

        return {
            "mensagem": "Notificações removidas.",
            "quantidade": quantidade
        }

    finally:
        cursor.close()
        conn.close()
