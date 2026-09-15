from fastapi import HTTPException, Request, APIRouter

from principais.schemas.cartoes import CartaoCreate, CartaoUpdate
from principais.utils.autenticacao import obter_usuario_autenticado

from principais.banco import conectar
from secundarios.notify import criar_notificacao

router = APIRouter(
    prefix="/cartoes",
    tags=["Cartoes"]
)

@router.post("")
def criar_cartao(
    cartao: CartaoCreate,
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)
    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            INSERT INTO cartoes
            (usuario_id, nome, banco, limite,
             dia_vencimento, dia_fechamento, ativo)
            VALUES (%s, %s, %s, %s, %s, %s, TRUE)
            RETURNING id, nome, banco, limite,
                      dia_vencimento, dia_fechamento,
                      ativo, criado_em
            """,
            (
                usuario_id,
                cartao.nome,
                cartao.banco,
                cartao.limite,
                cartao.dia_vencimento,
                cartao.dia_fechamento
            )
        )

        resultado = cursor.fetchone()
        conn.commit()

        criar_notificacao(
            usuario_id,
            "Cartão criado",
            f"O cartão '{cartao.nome}' foi cadastrado."
        )

        return {
            "mensagem": "Cartão criado com sucesso!",
            "cartao": {
                "id": resultado[0],
                "nome": resultado[1],
                "banco": resultado[2],
                "limite": float(resultado[3]),
                "dia_vencimento": resultado[4],
                "dia_fechamento": resultado[5],
                "ativo": resultado[6],
                "criado_em": resultado[7]
            }
        }

    finally:
        cursor.close()
        conn.close()


@router.get("")
def listar_cartoes(
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)
    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT
                c.id,
                c.nome,
                c.banco,
                c.limite,
                c.dia_vencimento,
                c.dia_fechamento,
                c.ativo,
                c.criado_em,
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
                AND t.usuario_id = %s

            WHERE c.usuario_id = %s

            GROUP BY
                c.id,
                c.nome,
                c.banco,
                c.limite,
                c.dia_vencimento,
                c.dia_fechamento,
                c.ativo,
                c.criado_em

            ORDER BY c.id DESC
            """,
            (usuario_id, usuario_id)
        )

        resultados = cursor.fetchall()

        return [
            {
                "id": c[0],
                "nome": c[1],
                "banco": c[2],
                "limite": float(c[3]),
                "dia_vencimento": c[4],
                "dia_fechamento": c[5],
                "ativo": c[6],
                "criado_em": c[7],
                "utilizado": float(c[8]),
                "disponivel": float(c[3]) - float(c[8])
            }
            for c in resultados
        ]

    finally:
        cursor.close()
        conn.close()


@router.get("/{cartao_id}")
def obter_cartao(
    cartao_id: int,
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT
                c.id,
                c.nome,
                c.banco,
                c.limite,
                c.dia_vencimento,
                c.dia_fechamento,
                c.ativo,
                c.criado_em,
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

            WHERE c.id = %s
            AND c.usuario_id = %s

            GROUP BY
                c.id,
                c.nome,
                c.banco,
                c.limite,
                c.dia_vencimento,
                c.dia_fechamento,
                c.ativo,
                c.criado_em
            """,
            (cartao_id, usuario_id)
        )

        cartao = cursor.fetchone()

        if not cartao:
            raise HTTPException(
                status_code=404,
                detail="Cartão não encontrado."
            )

        return {
            "id": cartao[0],
            "nome": cartao[1],
            "banco": cartao[2],
            "limite": float(cartao[3]),
            "dia_vencimento": cartao[4],
            "dia_fechamento": cartao[5],
            "ativo": cartao[6],
            "criado_em": cartao[7],
            "utilizado": float(cartao[8]),
            "disponivel": float(cartao[3]) - float(cartao[8])
        }

    finally:
        cursor.close()
        conn.close()


@router.put("/{cartao_id}")
def atualizar_cartao(
    cartao_id: int,
    cartao: CartaoUpdate,
     request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            UPDATE cartoes
            SET nome = %s,
                banco = %s,
                limite = %s,
                dia_vencimento = %s,
                dia_fechamento = %s,
                ativo = %s
            WHERE id = %s
            AND usuario_id = %s
            RETURNING id
            """,
            (
                cartao.nome,
                cartao.banco,
                cartao.limite,
                cartao.dia_vencimento,
                cartao.dia_fechamento,
                cartao.ativo,
                cartao_id,
                usuario_id
            )
        )

        resultado = cursor.fetchone()

        if not resultado:
            raise HTTPException(
                status_code=404,
                detail="Cartão não encontrado."
            )

        conn.commit()

        return {
            "mensagem": "Cartão atualizado com sucesso!"
        }

    finally:
        cursor.close()
        conn.close()


@router.delete("/{cartao_id}")
def deletar_cartao(
    cartao_id: int,
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT id
            FROM transacoes
            WHERE cartao_id = %s
            AND usuario_id = %s
            LIMIT 1
            """,
            (cartao_id, usuario_id)
        )

        if cursor.fetchone():
            raise HTTPException(
                status_code=400,
                detail="Esse cartão possui transações e não pode ser excluído."
            )

        cursor.execute(
            """
            DELETE FROM cartoes
            WHERE id = %s
            AND usuario_id = %s
            RETURNING id
            """,
            (cartao_id, usuario_id)
        )

        resultado = cursor.fetchone()

        if not resultado:
            raise HTTPException(
                status_code=404,
                detail="Cartão não encontrado."
            )

        conn.commit()

        return {
            "mensagem": "Cartão excluído com sucesso!"
        }

    finally:
        cursor.close()
        conn.close()


@router.get("/{cartao_id}/fatura")
def fatura_cartao(
    cartao_id: int,
    mes: int,
    ano: int,
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
                banco,
                limite,
                dia_vencimento,
                dia_fechamento
            FROM cartoes
            WHERE id = %s
            AND usuario_id = %s
            """,
            (cartao_id, usuario_id)
        )

        cartao = cursor.fetchone()

        if not cartao:
            raise HTTPException(
                status_code=404,
                detail="Cartão não encontrado."
            )

        cursor.execute(
            """
            SELECT
                id,
                tipo,
                categoria,
                valor,
                descricao,
                data
            FROM transacoes
            WHERE cartao_id = %s
            AND usuario_id = %s
            AND EXTRACT(MONTH FROM data) = %s
            AND EXTRACT(YEAR FROM data) = %s
            ORDER BY data DESC
            """,
            (cartao_id, usuario_id, mes, ano)
        )

        transacoes = cursor.fetchall()

        total = sum(
            float(t[3])
            for t in transacoes
            if t[1] == "gasto"
        )

        return {
            "cartao": {
                "id": cartao[0],
                "nome": cartao[1],
                "banco": cartao[2],
                "limite": float(cartao[3]),
                "dia_vencimento": cartao[4],
                "dia_fechamento": cartao[5]
            },
            "mes": mes,
            "ano": ano,
            "total": total,
            "transacoes": [
                {
                    "id": t[0],
                    "tipo": t[1],
                    "categoria": t[2],
                    "valor": float(t[3]),
                    "descricao": t[4],
                    "data": t[5]
                }
                for t in transacoes
            ]
        }

    finally:
        cursor.close()
        conn.close()
