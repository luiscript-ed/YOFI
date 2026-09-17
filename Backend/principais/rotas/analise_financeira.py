import psycopg2
import os
from principais.rotas.mya import perguntar_mya
from principais.schemas.mya import PerguntaMYA
from fastapi import Request, APIRouter

from principais.utils.autenticacao import obter_usuario_autenticado

router = APIRouter(
    tags=["variados"]
)

def analisar_usuario(usuario_id):

    conn = psycopg2.connect(
    os.environ["DATABASE_URL"],
    sslmode="require"
    )
    
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT tipo,
               categoria,
               valor,
               descricao

        FROM transacoes

        WHERE usuario_id = %s

        ORDER BY id DESC

        LIMIT 20
        """,
        (usuario_id,)
    )

    transacoes = cursor.fetchall()

    conn.close()

    if not transacoes:
        return "Nenhuma transação encontrada."

    resumo = ""

    total_gastos = 0
    total_ganhos = 0

    for t in transacoes:

        tipo = t[0]
        categoria = t[1]
        valor = t[2]

        resumo += f"{tipo} | {categoria} | R${valor}\n"

        if tipo == "gasto":
            total_gastos += valor

        if tipo == "ganho":
            total_ganhos += valor

    prompt = f"""
    Analise os dados financeiros abaixo.

    Transações:

    {resumo}

    Total de ganhos:
    R${total_ganhos}

    Total de gastos:
    R${total_gastos}

    Forneça Uma mensagem curta para notificação com as seguintes informações:
    1. Resumo financeiro
    2. Possível problema
    3. Sugestão prática
    tente ser o mais breve possivel, não use negrito, pense que voce está enviando somente o corpo de uma notificação, ao fim da notificação, não adicione uma pergunta, como "Voce quer que faça tal coisa?", seja breve.
    """

    return perguntar_mya(
        pergunta=prompt,
        contexto_financeiro={},
        imagem = {},
        usuario_id=usuario_id,
    )

def categorias_principais(usuario_id):

    conn = psycopg2.connect(
    os.environ["DATABASE_URL"],
    sslmode="require"
    )

    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT categoria,
               SUM(valor)

        FROM transacoes

        WHERE usuario_id = %s
        AND tipo = 'gasto'

        GROUP BY categoria

        ORDER BY SUM(valor) DESC

        LIMIT 3
        """,
        (usuario_id,)
    )

    resultado = cursor.fetchall()

    conn.close()

    return resultado

# ROTAS PARA ABA DE CATEGORIAS

def categorias_receitas(usuario_id):

    conn = psycopg2.connect(
    os.environ["DATABASE_URL"],
    sslmode="require"
    )

    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT categoria,
               SUM(valor)

        FROM transacoes

        WHERE usuario_id = %s
        AND tipo = 'ganho'

        GROUP BY categoria

        """,
        (usuario_id,)
    )

    resultado = cursor.fetchall()

    conn.close()

    return resultado

def categorias_despesas(usuario_id):

    conn = psycopg2.connect(
    os.environ["DATABASE_URL"],
    sslmode="require"
    )

    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT categoria,
               SUM(valor)

        FROM transacoes

        WHERE usuario_id = %s
        AND tipo = 'gasto'

        GROUP BY categoria

        """,
        (usuario_id,)
    )

    resultado = cursor.fetchall()

    conn.close()

    return resultado


async def gerar_dicas_economia(usuario_id):

    conn = psycopg2.connect(
    os.environ["DATABASE_URL"],
    sslmode="require"
    )
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT categoria,
               valor

        FROM transacoes

        WHERE usuario_id = %s
        AND tipo = 'gasto'
        """,
        (usuario_id,)
    )

    gastos = cursor.fetchall()

    conn.close()

    if not gastos:

        return "Ainda não existem gastos registrados."

    texto = ""

    total = 0

    for gasto in gastos:

        texto += (
            f"{gasto[0]} - "
            f"R${gasto[1]}\n"
        )

        total += gasto[1]

    prompt = f"""
    Analise os gastos abaixo.

    {texto}

    Total gasto:
    R${total}

    Dê 3 dicas práticas para economizar.
    Responda em português.
    """

    return await perguntar_mya(
        pergunta=prompt,
        contexto_financeiro={},
        imagem = {},
        usuario_id=usuario_id,
)


@router.get("/categorias/receitas")
def receitas_categorias(
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)

    categoriasReceitas = categorias_receitas(usuario_id)

    return {
        "categorias": [
            {
                "categoria": c[0],
                "valor": c[1]
            }
            for c in categoriasReceitas
        ]
    }

@router.get("/categorias/despesas")
def despesas_categorias(
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)

    categoriasDespesas = categorias_despesas(usuario_id)

    return {
        "categorias": [
            {
                "categoria": c[0],
                "valor": c[1]
            }
            for c in categoriasDespesas
        ]
    }

@router.get("/categorias")
def top_categorias(
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)

    categorias = categorias_principais(usuario_id)

    return {
        "categorias": [
            {
                "categoria": c[0],
                "valor": c[1]
            }
            for c in categorias
        ]
    }

@router.get("/economia")
def economia(
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)

    return {
        "dicas": gerar_dicas_economia(
            usuario_id
        )
    }

@router.get("/analise")
async def analise(
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)

    resultado = analisar_usuario(usuario_id)

    return {
        "analise": resultado
    }

@router.post("/mya")
async def conversar_mya(
    dados: PerguntaMYA,
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)
    resposta = await perguntar_mya(dados.pergunta)

    return {
        "resposta": resposta
    }