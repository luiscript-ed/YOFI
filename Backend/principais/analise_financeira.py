import sqlite3
from mya import perguntar_mya

def analisar_usuario(usuario_id):

    conn = sqlite3.connect("meu_banco.db")
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT tipo,
               categoria,
               valor,
               descricao
        FROM transacoes
        WHERE usuario_id = ?
        ORDER BY id DESC
        LIMIT 20
        """,
        (usuario_id,)
    )

    transacoes = cursor.fetchall()

    conn.close()

    if not transacoes:

        return "Nenhuma transação encontrada."

    texto = ""

    for t in transacoes:

        texto += (
            f"Tipo: {t[0]}, "
            f"Categoria: {t[1]}, "
            f"Valor: R${t[2]}, "
            f"Descrição: {t[3]}\n"
        )

    prompt = f"""
Analise as últimas transações deste usuário.

{texto}

Forneça:

1. Resumo financeiro
2. Possíveis problemas
3. Dica prática
4. Mensagem curta para notificação
"""

    return perguntar_mya(prompt)