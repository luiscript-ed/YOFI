from fastapi import HTTPException, Request, APIRouter

from principais.banco import conectar
from principais.schemas.transacao import MovimentacaoCreate
from principais.utils.autenticacao import obter_usuario_autenticado
from principais.utils.notificacao import criar_notificacao
from secundarios.notify import criar_notificacao

router = APIRouter(
    prefix="/movimentacoes",
    tags=["Movimentacoes"]
)

@router.post("/")
def criar_movimentacao(
    movimentacao: MovimentacaoCreate,
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)
    if movimentacao.origem_conta_id == movimentacao.destino_conta_id:
        raise HTTPException(
            status_code=400,
            detail="A origem e o destino devem ser diferentes."
        )

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT id
            FROM contas
            WHERE id = %s
            AND usuario_id = %s
            AND ativo = TRUE
            """,
            (
                movimentacao.origem_conta_id,
                usuario_id
            )
        )

        if not cursor.fetchone():
            raise HTTPException(
                status_code=404,
                detail="Conta de origem não encontrada."
            )


        cursor.execute(
            """
            SELECT id
            FROM contas
            WHERE id = %s
            AND usuario_id = %s
            AND ativo = TRUE
            """,
            (
                movimentacao.destino_conta_id,
                usuario_id
            )
        )

        if not cursor.fetchone():
            raise HTTPException(
                status_code=404,
                detail="Conta de destino não encontrada."
            )


        cursor.execute(
            """
            SELECT
                saldo_inicial +
                COALESCE(
                    SUM(
                        CASE
                            WHEN tipo = 'ganho'
                                THEN valor
                            WHEN tipo = 'gasto'
                                THEN -valor
                            ELSE 0
                        END
                    ),
                    0
                ) AS saldo
            FROM contas
            LEFT JOIN transacoes
                ON transacoes.conta_id = contas.id
                AND transacoes.usuario_id = %s
            WHERE contas.id = %s
            GROUP BY contas.id, contas.saldo_inicial
            """,
            (
                usuario_id,
                movimentacao.origem_conta_id
            )
        )

        saldo_origem = cursor.fetchone()

        if not saldo_origem:
            raise HTTPException(
                status_code=404,
                detail="Conta de origem não encontrada."
            )

        saldo_atual = float(saldo_origem[0])

        if saldo_atual < movimentacao.valor:
            raise HTTPException(
                status_code=400,
                detail="Saldo insuficiente na conta de origem."
            )


        cursor.execute(
            """
            INSERT INTO movimentacoes
            (
                usuario_id,
                origem_conta_id,
                destino_conta_id,
                valor,
                descricao,
                data
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                usuario_id,
                movimentacao.origem_conta_id,
                movimentacao.destino_conta_id,
                movimentacao.valor,
                movimentacao.descricao,
                movimentacao.data
            )
        )

        movimentacao_id = cursor.fetchone()[0]

        conn.commit()

        criar_notificacao(
            usuario_id,
            "Movimentação realizada",
            f"Transferência de R$ {movimentacao.valor:.2f} realizada com sucesso."
        )

        return {
            "mensagem": "Movimentação realizada com sucesso!",
            "id": movimentacao_id
        }

    except HTTPException:
        conn.rollback()
        raise

    except Exception:
        conn.rollback()
        raise

    finally:
        cursor.close()
        conn.close()
