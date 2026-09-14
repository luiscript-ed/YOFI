from fastapi import HTTPException, Request, APIRouter

from principais.schemas.orcamentos import OrcamentoCreate, OrcamentoUpdate
from principais.utils.autenticacao import obter_usuario_autenticado

from principais.banco import conectar
from secundarios.notify import criar_notificacao

router = APIRouter(
    prefix="/orcamentos",
    tags=["Orcamentos"]
)

@router.post("/")
def criar_orcamento(
    orcamento: OrcamentoCreate,
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT id
            FROM orcamentos
            WHERE usuario_id = %s
            AND categoria = %s
            AND mes = %s
            AND ano = %s
            """,
            (
                usuario_id,
                orcamento.categoria,
                orcamento.mes,
                orcamento.ano
            )
        )

        if cursor.fetchone():
            raise HTTPException(
                status_code=409,
                detail="Já existe um orçamento para essa categoria neste mês."
            )

        cursor.execute(
            """
            INSERT INTO orcamentos
            (
                usuario_id,
                categoria,
                mes,
                ano,
                limite
            )
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                usuario_id,
                orcamento.categoria,
                orcamento.mes,
                orcamento.ano,
                orcamento.limite
            )
        )

        orcamento_id = cursor.fetchone()[0]

        conn.commit()

        criar_notificacao(
            usuario_id,
            "Orçamento criado",
            f"O Orçamento na categoria '{orcamento.categoria}' foi criado com um limite de {orcamento.limite}."
        )

        return {
            "mensagem": "Orçamento criado com sucesso!",
            "id": orcamento_id
        }

    finally:
        cursor.close()
        conn.close()


@router.get("/")
def listar_orcamentos(
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT
                o.id,
                o.categoria,
                o.mes,
                o.ano,
                o.limite,
                COALESCE(SUM(t.valor), 0) AS gasto

            FROM orcamentos o

            LEFT JOIN transacoes t
                ON t.usuario_id = o.usuario_id
                AND t.categoria = o.categoria
                AND t.tipo = 'gasto'
                AND EXTRACT(MONTH FROM t.data) = o.mes
                AND EXTRACT(YEAR FROM t.data) = o.ano

            WHERE o.usuario_id = %s

            GROUP BY
                o.id,
                o.categoria,
                o.mes,
                o.ano,
                o.limite

            ORDER BY o.ano DESC, o.mes DESC, o.id DESC
            """,
            (usuario_id,)
        )

        return [
            {
                "id": o[0],
                "categoria": o[1],
                "mes": o[2],
                "ano": o[3],
                "limite": float(o[4]),
                "gasto": float(o[5]),
                "disponivel": float(o[4]) - float(o[5]),
                "percentual": (
                    (float(o[5]) / float(o[4])) * 100
                    if float(o[4]) > 0
                    else 0
                )
            }
            for o in cursor.fetchall()
        ]

    finally:
        cursor.close()
        conn.close()


@router.put("/{orcamento_id}")
def atualizar_orcamento(
    orcamento_id: int,
    orcamento: OrcamentoUpdate,
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            UPDATE orcamentos
            SET categoria = %s,
                mes = %s,
                ano = %s,
                limite = %s
            WHERE id = %s
            AND usuario_id = %s
            RETURNING id
            """,
            (
                orcamento.categoria,
                orcamento.mes,
                orcamento.ano,
                orcamento.limite,
                orcamento_id,
                usuario_id
            )
        )

        if not cursor.fetchone():
            raise HTTPException(
                status_code=404,
                detail="Orçamento não encontrado."
            )

        conn.commit()

        return {
            "mensagem": "Orçamento atualizado com sucesso!"
        }

    finally:
        cursor.close()
        conn.close()


@router.delete("/{orcamento_id}")
def deletar_orcamento(
    orcamento_id: int,
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            DELETE FROM orcamentos
            WHERE id = %s
            AND usuario_id = %s
            RETURNING id
            """,
            (orcamento_id, usuario_id)
        )

        if not cursor.fetchone():
            raise HTTPException(
                status_code=404,
                detail="Orçamento não encontrado."
            )

        conn.commit()

        return {
            "mensagem": "Orçamento excluído com sucesso!"
        }

    finally:
        cursor.close()
        conn.close()
