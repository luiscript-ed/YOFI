from fastapi import Request, APIRouter

from principais.banco import conectar
from principais.utils.autenticacao import obter_usuario_autenticado

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

@router.get("/")
def dashboard(
    mes: int,
    ano: int,
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)

    conn = conectar()
    cursor = conn.cursor()

    try:

        # ------------------------------------------
        # RESUMO DO MÊS
        # ------------------------------------------

        cursor.execute(
            """
            SELECT
                COALESCE(SUM(
                    CASE WHEN tipo = 'ganho'
                    THEN valor ELSE 0 END
                ), 0),

                COALESCE(SUM(
                    CASE WHEN tipo = 'gasto'
                    THEN valor ELSE 0 END
                ), 0)

            FROM transacoes

            WHERE usuario_id = %s
            AND EXTRACT(MONTH FROM data) = %s
            AND EXTRACT(YEAR FROM data) = %s
            """,
            (usuario_id, mes, ano)
        )

        ganhos, gastos = cursor.fetchone()

        ganhos = float(ganhos)
        gastos = float(gastos)

        saldo = ganhos - gastos
        economia = ganhos - gastos

        taxa_economia = (
            (economia / ganhos) * 100
            if ganhos > 0
            else 0
        )

        # ------------------------------------------
        # CONTAS
        # ------------------------------------------

        cursor.execute(
            """
            SELECT
                c.id,
                c.nome,
                c.tipo,
                c.saldo_inicial,

                COALESCE(
                    c.saldo_inicial +
                    SUM(
                        CASE
                            WHEN t.tipo = 'ganho' THEN t.valor
                            WHEN t.tipo = 'gasto' THEN -t.valor
                            ELSE 0
                        END
                    ),
                    c.saldo_inicial
                ) AS saldo

            FROM contas c

            LEFT JOIN transacoes t
                ON t.conta_id = c.id

            WHERE c.usuario_id = %s
            AND c.ativo = TRUE

            GROUP BY
                c.id,
                c.nome,
                c.tipo,
                c.saldo_inicial

            ORDER BY c.id
            """,
            (usuario_id,)
        )

        contas = [
            {
                "id": c[0],
                "nome": c[1],
                "tipo": c[2],
                "saldo": float(c[4])
            }
            for c in cursor.fetchall()
        ]

        # ------------------------------------------
        # CARTÕES
        # ------------------------------------------

        cursor.execute(
            """
            SELECT
                c.id,
                c.nome,
                c.banco,
                c.limite,

                COALESCE(
                    SUM(
                        CASE
                            WHEN t.tipo = 'gasto' THEN t.valor
                            WHEN t.tipo = 'ganho' THEN -t.valor
                            ELSE 0
                        END
                    ),
                    0
                ) AS utilizado

            FROM cartoes c

            LEFT JOIN transacoes t
                ON t.cartao_id = c.id

            WHERE c.usuario_id = %s
            AND c.ativo = TRUE

            GROUP BY
                c.id,
                c.nome,
                c.banco,
                c.limite

            ORDER BY c.id
            """,
            (usuario_id,)
        )

        cartoes = [
            {
                "id": c[0],
                "nome": c[1],
                "banco": c[2],
                "limite": float(c[3]),
                "utilizado": float(c[4]),
                "disponivel": float(c[3]) - float(c[4])
            }
            for c in cursor.fetchall()
        ]

        # ------------------------------------------
        # GASTOS POR CATEGORIA
        # ------------------------------------------

        cursor.execute(
            """
            SELECT
                categoria,
                SUM(valor)

            FROM transacoes

            WHERE usuario_id = %s
            AND tipo = 'gasto'
            AND EXTRACT(MONTH FROM data) = %s
            AND EXTRACT(YEAR FROM data) = %s

            GROUP BY categoria
            ORDER BY SUM(valor) DESC
            """,
            (usuario_id, mes, ano)
        )

        categorias = [
            {
                "categoria": c[0],
                "total": float(c[1])
            }
            for c in cursor.fetchall()
        ]

        # ------------------------------------------
        # EVOLUÇÃO DIÁRIA
        # ------------------------------------------

        cursor.execute(
            """
            SELECT
                data::date,
                SUM(valor)

            FROM transacoes

            WHERE usuario_id = %s
            AND tipo = 'gasto'
            AND EXTRACT(MONTH FROM data) = %s
            AND EXTRACT(YEAR FROM data) = %s

            GROUP BY data::date
            ORDER BY data::date
            """,
            (usuario_id, mes, ano)
        )

        evolucao = [
            {
                "data": e[0],
                "total": float(e[1])
            }
            for e in cursor.fetchall()
        ]

        # ------------------------------------------
        # ÚLTIMAS TRANSAÇÕES
        # ------------------------------------------

        cursor.execute(
            """
            SELECT
                t.id,
                t.tipo,
                t.categoria,
                t.valor,
                t.descricao,
                t.data,
                c.nome,
                ca.nome

            FROM transacoes t

            LEFT JOIN contas c
                ON c.id = t.conta_id

            LEFT JOIN cartoes ca
                ON ca.id = t.cartao_id

            WHERE t.usuario_id = %s

            ORDER BY t.data DESC, t.id DESC
            LIMIT 10
            """,
            (usuario_id,)
        )

        ultimas_transacoes = [
            {
                "id": t[0],
                "tipo": t[1],
                "categoria": t[2],
                "valor": float(t[3]),
                "descricao": t[4],
                "data": t[5],
                "conta": t[6],
                "cartao": t[7]
            }
            for t in cursor.fetchall()
        ]

        # ------------------------------------------
        # NOTIFICAÇÕES
        # ------------------------------------------

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

        notificacoes = [
            {
                "id": n[0],
                "titulo": n[1],
                "mensagem": n[2],
                "data": n[3]
            }
            for n in cursor.fetchall()
        ]

        return {
            "mes": mes,
            "ano": ano,

            "resumo": {
                "saldo": saldo,
                "ganhos": ganhos,
                "gastos": gastos
            },

            "economia": {
                "receitas": ganhos,
                "despesas": gastos,
                "valor_economizado": economia,
                "taxa": taxa_economia
            },

            "contas": contas,
            "cartoes": cartoes,
            "categorias": categorias,
            "evolucao": evolucao,
            "ultimas_transacoes": ultimas_transacoes,

            "notificacoes": notificacoes,
            "notificacoes_quantidade": len(notificacoes)
        }

    finally:
        cursor.close()
        conn.close()