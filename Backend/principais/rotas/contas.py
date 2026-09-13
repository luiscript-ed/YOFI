from fastapi import HTTPException, Request, APIRouter

from principais.banco import conectar
from principais.schemas.conta import ContaCriar, ContaUpdate
from principais.utils.autenticacao import obter_usuario_autenticado


router = APIRouter(
    prefix="/contas",
    tags=["Contas"]
)

@router.post("/")
def criar_conta(
    dados: ContaCriar,
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)
    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            INSERT INTO contas
            (usuario_id, nome, tipo, saldo_inicial, ativo)
            VALUES (%s, %s, %s, %s, TRUE)
            RETURNING id, nome, tipo, saldo_inicial, ativo, criado_em
            """,
            (
                usuario_id,
                dados.nome,
                dados.tipo,
                dados.saldo_inicial
            )
        )

        resultado = cursor.fetchone()
        conn.commit()

        criar_notificacao(
            usuario_id,
            "Conta criada",
            f"A conta '{conta.nome}' foi criada com sucesso."
        )

        return {
            "mensagem": "Conta criada com sucesso!",
            "conta": {
                "id": resultado[0],
                "nome": resultado[1],
                "tipo": resultado[2],
                "saldo_inicial": float(resultado[3]),
                "ativo": resultado[4],
                "criado_em": resultado[5]
            }
        }

    except Exception:
        conn.rollback()
        raise

    finally:
        cursor.close()
        conn.close()


@router.get("/")
def listar_contas(
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
                c.tipo,
                c.saldo_inicial,
                c.ativo,
                c.criado_em,
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
                ) AS saldo_atual

            FROM contas c

            LEFT JOIN transacoes t
                ON t.conta_id = c.id
                AND t.usuario_id = %s

            WHERE c.usuario_id = %s

            GROUP BY
                c.id,
                c.nome,
                c.tipo,
                c.saldo_inicial,
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
                "tipo": c[2],
                "saldo_inicial": float(c[3]),
                "ativo": c[4],
                "criado_em": c[5],
                "saldo_atual": float(c[6])
            }
            for c in resultados
        ]

    finally:
        cursor.close()
        conn.close()


@router.post("/{conta_id}")
def obter_conta(
    conta_id: int,
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
                c.tipo,
                c.saldo_inicial,
                c.ativo,
                c.criado_em,
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
                ) AS saldo_atual

            FROM contas c

            LEFT JOIN transacoes t
                ON t.conta_id = c.id

            WHERE c.id = %s
            AND c.usuario_id = %s

            GROUP BY
                c.id,
                c.nome,
                c.tipo,
                c.saldo_inicial,
                c.ativo,
                c.criado_em
            """,
            (conta_id, usuario_id)
        )

        conta = cursor.fetchone()

        if not conta:
            raise HTTPException(
                status_code=404,
                detail="Conta não encontrada."
            )

        return {
            "id": conta[0],
            "nome": conta[1],
            "tipo": conta[2],
            "saldo_inicial": float(conta[3]),
            "ativo": conta[4],
            "criado_em": conta[5],
            "saldo_atual": float(conta[6])
        }

    finally:
        cursor.close()
        conn.close()

@router.put("/{conta_id}")
def atualizar_conta(
    conta_id: int,
    conta: ContaUpdate,
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            UPDATE contas
            SET nome = %s,
                tipo = %s,
                saldo_inicial = %s,
                ativo = %s
            WHERE id = %s
            AND usuario_id = %s
            RETURNING id
            """,
            (
                conta.nome,
                conta.tipo,
                conta.saldo_inicial,
                conta.ativo,
                conta_id,
                usuario_id
            )
        )

        resultado = cursor.fetchone()

        if not resultado:
            raise HTTPException(
                status_code=404,
                detail="Conta não encontrada."
            )

        conn.commit()

        return {
            "mensagem": "Conta atualizada com sucesso!"
        }

    finally:
        cursor.close()
        conn.close()

@router.delete("/{conta_id}")
def deletar_conta(
    conta_id: int,
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
            WHERE conta_id = %s
            AND usuario_id = %s
            LIMIT 1
            """,
            (conta_id, usuario_id)
        )

        if cursor.fetchone():
            raise HTTPException(
                status_code=400,
                detail="Essa conta possui transações e não pode ser excluída."
            )

        cursor.execute(
            """
            DELETE FROM contas
            WHERE id = %s
            AND usuario_id = %s
            RETURNING id
            """,
            (conta_id, usuario_id)
        )

        resultado = cursor.fetchone()

        if not resultado:
            raise HTTPException(
                status_code=404,
                detail="Conta não encontrada."
            )

        conn.commit()

        return {
            "mensagem": "Conta excluída com sucesso!"
        }

    finally:
        cursor.close()
        conn.close()
