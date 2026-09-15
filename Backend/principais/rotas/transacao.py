from fastapi import HTTPException, Request, APIRouter

from principais.banco import conectar
from principais.schemas.transacao import TransacaoCreate, TransacaoUpdate

from principais.utils.autenticacao import obter_usuario_autenticado
from secundarios.notify import criar_notificacao

router = APIRouter(
    prefix="/transacoes",
    tags=["Transacoes"]
)

@router.post("")
def criar_transacao(
    transacao: TransacaoCreate,
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)

    if transacao.tipo not in ["ganho", "gasto"]:
        raise HTTPException(
            status_code=400,
            detail="Tipo deve ser 'ganho' ou 'gasto'."
        )

    if (transacao.conta_id is None) == (transacao.cartao_id is None):
        raise HTTPException(
            status_code=400,
            detail="Informe uma conta ou um cartão, mas não os dois."
        )

    conn = conectar()
    cursor = conn.cursor()

    try:

        if transacao.conta_id:

            cursor.execute(
                """
                SELECT id
                FROM contas
                WHERE id = %s
                AND usuario_id = %s
                AND ativo = TRUE
                """,
                (transacao.conta_id, usuario_id)
            )

            if not cursor.fetchone():
                raise HTTPException(
                    status_code=404,
                    detail="Conta não encontrada."
                )

        if transacao.cartao_id:

            cursor.execute(
                """
                SELECT id
                FROM cartoes
                WHERE id = %s
                AND usuario_id = %s
                AND ativo = TRUE
                """,
                (transacao.cartao_id, usuario_id)
            )

            if not cursor.fetchone():
                raise HTTPException(
                    status_code=404,
                    detail="Cartão não encontrado."
                )

        cursor.execute(
            """
            INSERT INTO transacoes
            (
                usuario_id,
                cartao_id,
                conta_id,
                tipo,
                categoria,
                valor,
                descricao,
                data
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                usuario_id,
                transacao.cartao_id,
                transacao.conta_id,
                transacao.tipo,
                transacao.categoria,
                transacao.valor,
                transacao.descricao,
                transacao.data
            )
        )

        transacao_id = cursor.fetchone()[0]

        conn.commit()

        criar_notificacao(
            usuario_id,
            "Nova transação",
            f"{transacao.tipo.upper()} de R$ {transacao.valor:.2f} registrada."
        )

        return {
            "mensagem": "Transação criada com sucesso!",
            "id": transacao_id
        }

    except:
        conn.rollback()
        raise

    finally:
        cursor.close()
        conn.close()


@router.get("")
def listar_transacoes(
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)
    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT
                t.id,
                t.tipo,
                t.categoria,
                t.valor,
                t.descricao,
                t.data,
                t.conta_id,
                c.nome,
                t.cartao_id,
                ca.nome
            FROM transacoes t

            LEFT JOIN contas c
                ON c.id = t.conta_id

            LEFT JOIN cartoes ca
                ON ca.id = t.cartao_id

            WHERE t.usuario_id = %s

            ORDER BY t.data DESC, t.id DESC
            """,
            (usuario_id,)
        )

        resultados = cursor.fetchall()

        return [
            {
                "id": t[0],
                "tipo": t[1],
                "categoria": t[2],
                "valor": float(t[3]),
                "descricao": t[4],
                "data": t[5],
                "conta": {
                    "id": t[6],
                    "nome": t[7]
                } if t[6] else None,
                "cartao": {
                    "id": t[8],
                    "nome": t[9]
                } if t[8] else None
            }
            for t in resultados
        ]

    finally:
        cursor.close()
        conn.close()


@router.get("/{transacao_id}")
def obter_transacao(
    transacao_id: int,
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)
    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT
                t.id,
                t.tipo,
                t.categoria,
                t.valor,
                t.descricao,
                t.data,
                t.conta_id,
                t.cartao_id
            FROM transacoes t

            WHERE t.id = %s
            AND t.usuario_id = %s
            """,
            (transacao_id, usuario_id)
        )

        t = cursor.fetchone()

        if not t:
            raise HTTPException(
                status_code=404,
                detail="Transação não encontrada."
            )

        return {
            "id": t[0],
            "tipo": t[1],
            "categoria": t[2],
            "valor": float(t[3]),
            "descricao": t[4],
            "data": t[5],
            "conta_id": t[6],
            "cartao_id": t[7]
        }

    finally:
        cursor.close()
        conn.close()


@router.put("/{transacao_id}")
def atualizar_transacao(
    transacao_id: int,
    transacao: TransacaoUpdate,
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)
    if transacao.tipo not in ["ganho", "gasto"]:
        raise HTTPException(
            status_code=400,
            detail="Tipo inválido."
        )

    if (transacao.conta_id is None) == (transacao.cartao_id is None):
        raise HTTPException(
            status_code=400,
            detail="Informe uma conta ou um cartão."
        )

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT id
            FROM transacoes
            WHERE id = %s
            AND usuario_id = %s
            """,
            (transacao_id, usuario_id)
        )

        if not cursor.fetchone():
            raise HTTPException(
                status_code=404,
                detail="Transação não encontrada."
            )

        if transacao.conta_id:

            cursor.execute(
                """
                SELECT id
                FROM contas
                WHERE id = %s
                AND usuario_id = %s
                """,
                (transacao.conta_id, usuario_id)
            )

            if not cursor.fetchone():
                raise HTTPException(
                    status_code=404,
                    detail="Conta não encontrada."
                )

        if transacao.cartao_id:

            cursor.execute(
                """
                SELECT id
                FROM cartoes
                WHERE id = %s
                AND usuario_id = %s
                """,
                (transacao.cartao_id, usuario_id)
            )

            if not cursor.fetchone():
                raise HTTPException(
                    status_code=404,
                    detail="Cartão não encontrado."
                )

        cursor.execute(
            """
            UPDATE transacoes
            SET conta_id = %s,
                cartao_id = %s,
                tipo = %s,
                categoria = %s,
                valor = %s,
                descricao = %s,
                data = %s
            WHERE id = %s
            AND usuario_id = %s
            """,
            (
                transacao.conta_id,
                transacao.cartao_id,
                transacao.tipo,
                transacao.categoria,
                transacao.valor,
                transacao.descricao,
                transacao.data,
                transacao_id,
                usuario_id
            )
        )

        conn.commit()

        return {
            "mensagem": "Transação atualizada com sucesso!"
        }

    finally:
        cursor.close()
        conn.close()


@router.delete("/{transacao_id}")
def deletar_transacao(
    transacao_id: int,
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            DELETE FROM transacoes
            WHERE id = %s
            AND usuario_id = %s
            RETURNING id
            """,
            (transacao_id, usuario_id)
        )

        resultado = cursor.fetchone()

        if not resultado:
            raise HTTPException(
                status_code=404,
                detail="Transação não encontrada."
            )

        conn.commit()

        return {
            "mensagem": "Transação excluída com sucesso!"
        }

    finally:
        cursor.close()
        conn.close()