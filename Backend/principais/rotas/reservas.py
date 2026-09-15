from fastapi import HTTPException, Request, APIRouter
from datetime import datetime

from principais.banco import conectar
from principais.schemas.reservas import TransacaoReservadaCreate
from principais.utils.autenticacao import obter_usuario_autenticado
from secundarios.notify import criar_notificacao

router = APIRouter(
    prefix="/transacoes-reservadas",
    tags=["transacoes-reservadas"]
)

def validar_destino_financeiro(
    cursor,
    usuario_id: int,
    conta_id: int | None,
    cartao_id: int | None,
    exigir_ativo: bool = True
    ):
    if (conta_id is None) == (cartao_id is None):
        raise HTTPException(
            status_code=400,
            detail="Informe uma conta ou um cartão, mas não os dois."
        )

    if conta_id is not None:
        query = """
            SELECT id
            FROM contas
            WHERE id = %s
            AND usuario_id = %s
        """

        params = [conta_id, usuario_id]

        if exigir_ativo:
            query += " AND ativo = TRUE"

        cursor.execute(query, tuple(params))

        if not cursor.fetchone():
            raise HTTPException(
                status_code=404,
                detail="Conta não encontrada."
            )

    if cartao_id is not None:
        query = """
            SELECT id
            FROM cartoes
            WHERE id = %s
            AND usuario_id = %s
        """

        params = [cartao_id, usuario_id]

        if exigir_ativo:
            query += " AND ativo = TRUE"

        cursor.execute(query, tuple(params))

        if not cursor.fetchone():
            raise HTTPException(
                status_code=404,
                detail="Cartão não encontrado."
            )


@router.post("")
def criar_transacao_reservada(
    transacao: TransacaoReservadaCreate,
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)
    if transacao.tipo not in ["ganho", "gasto"]:
        raise HTTPException(
            status_code=400,
            detail="Tipo deve ser 'ganho' ou 'gasto'."
        )

    if transacao.data <= datetime.now():
        raise HTTPException(
            status_code=400,
            detail="A data da transação reservada deve ser futura."
        )

    conn = conectar()
    cursor = conn.cursor()

    try:
        validar_destino_financeiro(
            cursor,
            usuario_id,
            transacao.conta_id,
            transacao.cartao_id
        )

        cursor.execute(
            """
            INSERT INTO transacoes_reservadas
            (
                usuario_id,
                conta_id,
                cartao_id,
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
                transacao.conta_id,
                transacao.cartao_id,
                transacao.tipo,
                transacao.categoria,
                transacao.valor,
                transacao.descricao,
                transacao.data
            )
        )

        reservado_id = cursor.fetchone()[0]

        conn.commit()

        criar_notificacao(
            usuario_id,
            "Transação reservada",
            f"{transacao.tipo.upper()} de R$ {transacao.valor:.2f} programada para {transacao.data.strftime('%d/%m/%Y')}."
        )

        return {
            "mensagem": "Transação reservada com sucesso!",
            "id": reservado_id
        }

    except Exception:
        conn.rollback()
        raise

    finally:
        cursor.close()
        conn.close()

@router.get("")
def listar_transacoes_reservadas(
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)
    conn = conectar()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT
                r.id,
                r.tipo,
                r.categoria,
                r.valor,
                r.descricao,
                r.data,
                r.executada,
                r.transacao_id,
                r.conta_id,
                c.nome,
                r.cartao_id,
                ca.nome
            FROM transacoes_reservadas r

            LEFT JOIN contas c
                ON c.id = r.conta_id

            LEFT JOIN cartoes ca
                ON ca.id = r.cartao_id

            WHERE r.usuario_id = %s

            ORDER BY r.data ASC, r.id ASC
            """,
            (usuario_id,)
        )

        return [
            {
                "id": r[0],
                "tipo": r[1],
                "categoria": r[2],
                "valor": float(r[3]),
                "descricao": r[4],
                "data": r[5],
                "executada": r[6],
                "transacao_id": r[7],
                "conta": {
                    "id": r[8],
                    "nome": r[9]
                } if r[8] else None,
                "cartao": {
                    "id": r[10],
                    "nome": r[11]
                } if r[10] else None
            }
            for r in cursor.fetchall()
        ]

    finally:
        cursor.close()
        conn.close()
