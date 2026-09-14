from fastapi import HTTPException, Request, APIRouter

from principais.schemas.objetivos import ObjetivoCreate, ObjetivoUpdate
from principais.utils.autenticacao import obter_usuario_autenticado

from principais.banco import conectar
from secundarios.notify import criar_notificacao

router = APIRouter(
    prefix="/objetivos",
    tags=["Objetivos"]
)

@router.post("/")
def criar_objetivo(
    objetivo: ObjetivoCreate,
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)
    if objetivo.valor_atual > objetivo.valor_meta:
        raise HTTPException(
            status_code=400,
            detail="O valor atual não pode ser maior que a meta."
        )

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            INSERT INTO objetivos
            (
                usuario_id,
                nome,
                tipo,
                valor_meta,
                valor_atual,
                prazo,
                ativo
            )
            VALUES (%s, %s, %s, %s, %s, %s, TRUE)
            RETURNING id
            """,
            (
                usuario_id,
                objetivo.nome,
                objetivo.tipo,
                objetivo.valor_meta,
                objetivo.valor_atual,
                objetivo.prazo
            )
        )

        objetivo_id = cursor.fetchone()[0]

        conn.commit()

        criar_notificacao(
            usuario_id,
            "Objetivo criado",
            f"O Objetivo '{objetivo.nome}' foi programado até {objetivo.prazo}"
        )

        return {
            "mensagem": "Objetivo criado com sucesso!",
            "id": objetivo_id
        }

    finally:
        cursor.close()
        conn.close()


@router.get("/")
def listar_objetivos(
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
                nome,
                tipo,
                valor_meta,
                valor_atual,
                prazo,
                ativo
            FROM objetivos
            WHERE usuario_id = %s
            ORDER BY id DESC
            """,
            (usuario_id,)
        )

        return [
            {
                "id": o[0],
                "nome": o[1],
                "tipo": o[2],
                "valor_meta": float(o[3]),
                "valor_atual": float(o[4]),
                "prazo": o[5],
                "ativo": o[6],
                "progresso": (
                    (float(o[4]) / float(o[3])) * 100
                    if float(o[3]) > 0
                    else 0
                )
            }
            for o in cursor.fetchall()
        ]

    finally:
        cursor.close()
        conn.close()


@router.get("/{objetivo_id}")
def obter_objetivo(
    objetivo_id: int,
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
                nome,
                tipo,
                valor_meta,
                valor_atual,
                prazo,
                ativo
            FROM objetivos
            WHERE id = %s
            AND usuario_id = %s
            """,
            (objetivo_id, usuario_id)
        )

        o = cursor.fetchone()

        if not o:
            raise HTTPException(
                status_code=404,
                detail="Objetivo não encontrado."
            )

        return {
            "id": o[0],
            "nome": o[1],
            "tipo": o[2],
            "valor_meta": float(o[3]),
            "valor_atual": float(o[4]),
            "prazo": o[5],
            "ativo": o[6]
        }

    finally:
        cursor.close()
        conn.close()


@router.put("/{objetivo_id}")
def atualizar_objetivo(
    objetivo_id: int,
    objetivo: ObjetivoUpdate,
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)
    if objetivo.valor_atual > objetivo.valor_meta:
        raise HTTPException(
            status_code=400,
            detail="O valor atual não pode ser maior que a meta."
        )

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            UPDATE objetivos
            SET nome = %s,
                tipo = %s,
                valor_meta = %s,
                valor_atual = %s,
                prazo = %s,
                ativo = %s
            WHERE id = %s
            AND usuario_id = %s
            RETURNING id
            """,
            (
                objetivo.nome,
                objetivo.tipo,
                objetivo.valor_meta,
                objetivo.valor_atual,
                objetivo.prazo,
                objetivo.ativo,
                objetivo_id,
                usuario_id
            )
        )

        if not cursor.fetchone():
            raise HTTPException(
                status_code=404,
                detail="Objetivo não encontrado."
            )

        conn.commit()

        return {
            "mensagem": "Objetivo atualizado com sucesso!"
        }

    finally:
        cursor.close()
        conn.close()


@router.delete("/{objetivo_id}")
def deletar_objetivo(
    objetivo_id: int,
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)
    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            DELETE FROM objetivos
            WHERE id = %s
            AND usuario_id = %s
            RETURNING id
            """,
            (objetivo_id, usuario_id)
        )

        if not cursor.fetchone():
            raise HTTPException(
                status_code=404,
                detail="Objetivo não encontrado."
            )

        conn.commit()

        return {
            "mensagem": "Objetivo excluído com sucesso!"
        }

    finally:
        cursor.close()
        conn.close()
