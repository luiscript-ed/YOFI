from fastapi import HTTPException, Request, APIRouter
from datetime import datetime, timezone, date
import calendar

from principais.banco import conectar
from principais.schemas.custos import CustoRecorrenteCreate
from principais.utils.autenticacao import obter_usuario_autenticado
from principais.utils.notificacao import criar_notificacoes
from secundarios.notify import criar_notificacao

router = APIRouter(
    prefix="/custos-recorrentes",
    tags=["Custos"]
)

def ultimo_dia_mes(ano: int, mes: int) -> int:
    return calendar.monthrange(ano, mes)[1]

def gerar_datas_recorrentes(custo, inicio: date, fim: date):
    datas = []

    if custo["frequencia"] == "mensal":
        ano = inicio.year
        mes = inicio.month

        while (ano, mes) <= (fim.year, fim.month):
            ultimo_dia = ultimo_dia_mes(ano, mes)

            for dia in custo["dias"]:
                dia_real = min(dia, ultimo_dia)

                data_ocorrencia = date(
                    ano,
                    mes,
                    dia_real
                )

                if inicio <= data_ocorrencia <= fim:
                    datas.append(data_ocorrencia)

            if mes == 12:
                mes = 1
                ano += 1
            else:
                mes += 1

    elif custo["frequencia"] == "anual":
        if not custo["data_anual"]:
            return datas

        ano = inicio.year

        while ano <= fim.year:
            try:
                data_ocorrencia = date(
                    ano,
                    custo["data_anual"].month,
                    custo["data_anual"].day
                )
            except ValueError:
                ultimo_dia = ultimo_dia_mes(
                    ano,
                    custo["data_anual"].month
                )

                data_ocorrencia = date(
                    ano,
                    custo["data_anual"].month,
                    ultimo_dia
                )

            if inicio <= data_ocorrencia <= fim:
                datas.append(data_ocorrencia)

            ano += 1

    return sorted(set(datas))

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


@router.post("/")
def criar_custo_recorrente(
    custo: CustoRecorrenteCreate,
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)
    if (custo.conta_id is None) == (custo.cartao_id is None):
        raise HTTPException(
            status_code=400,
            detail="Informe uma conta ou um cartão, mas não os dois."
        )

    if custo.frequencia not in ["mensal", "anual"]:
        raise HTTPException(
            status_code=400,
            detail="A frequência deve ser 'mensal' ou 'anual'."
        )

    if custo.data_fim and custo.data_fim < custo.data_inicio:
        raise HTTPException(
            status_code=400,
            detail="A data final não pode ser anterior à data inicial."
        )

    dias = sorted(set(custo.dias))

    if custo.frequencia == "mensal":
        if not dias:
            raise HTTPException(
                status_code=400,
                detail="Informe pelo menos um dia para a cobrança mensal."
            )

        if len(dias) > 5:
            raise HTTPException(
                status_code=400,
                detail="Um custo pode ter no máximo 5 cobranças por mês."
            )

        if any(dia < 1 or dia > 31 for dia in dias):
            raise HTTPException(
                status_code=400,
                detail="Os dias devem estar entre 1 e 31."
            )

        data_anual = None

    else:
        if not custo.data_anual:
            raise HTTPException(
                status_code=400,
                detail="Informe a data anual da cobrança."
            )

        dias = []
        data_anual = custo.data_anual

    conn = conectar()
    cursor = conn.cursor()

    try:
        validar_destino_financeiro(
            cursor,
            usuario_id,
            custo.conta_id,
            custo.cartao_id
        )

        cursor.execute(
            """
            INSERT INTO custos_recorrentes
            (
                usuario_id,
                conta_id,
                cartao_id,
                tipo,
                categoria,
                valor,
                descricao,
                frequencia,
                dias,
                data_anual,
                data_inicio,
                data_fim,
                ativo
            )
            VALUES (
                %s, %s, %s, 'gasto', %s, %s, %s, %s,
                %s, %s, %s, %s, TRUE
            )
            RETURNING id
            """,
            (
                usuario_id,
                custo.conta_id,
                custo.cartao_id,
                custo.categoria,
                custo.valor,
                custo.descricao,
                custo.frequencia,
                dias,
                data_anual,
                custo.data_inicio,
                custo.data_fim
            )
        )

        custo_id = cursor.fetchone()[0]

        conn.commit()

        criar_notificacao(
            usuario_id,
            "Custo recorrente criado",
            f"O custo '{custo.descricao or custo.categoria}' foi programado."
        )

        return {
            "mensagem": "Custo recorrente criado com sucesso!",
            "id": custo_id
        }

    except Exception:
        conn.rollback()
        raise

    finally:
        cursor.close()
        conn.close()

@router.get("/")
def listar_custos_recorrentes(
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)
    conn = conectar()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT
                cr.id,
                cr.categoria,
                cr.valor,
                cr.descricao,
                cr.frequencia,
                cr.dias,
                cr.data_anual,
                cr.data_inicio,
                cr.data_fim,
                cr.ativo,
                cr.conta_id,
                c.nome,
                cr.cartao_id,
                ca.nome
            FROM custos_recorrentes cr

            LEFT JOIN contas c
                ON c.id = cr.conta_id

            LEFT JOIN cartoes ca
                ON ca.id = cr.cartao_id

            WHERE cr.usuario_id = %s

            ORDER BY cr.data_inicio ASC, cr.id ASC
            """,
            (usuario_id,)
        )

        custos = cursor.fetchall()
        hoje = datetime.now(timezone.utc).date()

        resultado = []

        for custo in custos:
            (
                custo_id,
                categoria,
                valor,
                descricao,
                frequencia,
                dias,
                data_anual,
                data_inicio,
                data_fim,
                ativo,
                conta_id,
                conta_nome,
                cartao_id,
                cartao_nome
            ) = custo

            proxima_data = None

            if ativo:
                inicio_calculo = max(
                    data_inicio,
                    hoje
                )

                fim_calculo = (
                    data_fim
                    if data_fim
                    else hoje.replace(
                        year=hoje.year + 5
                    )
                )

                datas = gerar_datas_recorrentes(
                    {
                        "frequencia": frequencia,
                        "dias": dias or [],
                        "data_anual": data_anual
                    },
                    inicio_calculo,
                    fim_calculo
                )

                if datas:
                    cursor.execute(
                        """
                        SELECT data_execucao
                        FROM execucoes_custos
                        WHERE custo_id = %s
                        ORDER BY data_execucao DESC
                        LIMIT 1
                        """,
                        (custo_id,)
                    )

                    ultima = cursor.fetchone()
                    ultima_data = ultima[0] if ultima else None

                    for data in datas:
                        if (
                            ultima_data is None
                            or data > ultima_data
                        ):
                            proxima_data = data
                            break

            resultado.append(
                {
                    "id": custo_id,
                    "categoria": categoria,
                    "valor": float(valor),
                    "descricao": descricao,
                    "frequencia": frequencia,
                    "dias": dias or [],
                    "data_anual": data_anual,
                    "data_inicio": data_inicio,
                    "data_fim": data_fim,
                    "ativo": ativo,
                    "proxima_data": proxima_data,
                    "conta": {
                        "id": conta_id,
                        "nome": conta_nome
                    } if conta_id else None,
                    "cartao": {
                        "id": cartao_id,
                        "nome": cartao_nome
                    } if cartao_id else None
                }
            )

        return resultado

    finally:
        cursor.close()
        conn.close()
