from datetime import datetime
import sqlite3

def criar_notificacao(usuario_id, titulo, mensagem):

    conn = sqlite3.connect("meu_banco.db")
    cursor = conn.cursor()

    data = datetime.now().strftime("%d/%m/%Y %H:%M")

    cursor.execute(
        """
        INSERT INTO notificacoes
        (usuario_id, titulo, mensagem, data)

        VALUES (?, ?, ?, ?)
        """,
        (
            usuario_id,
            titulo,
            mensagem,
            data
        )
    )

    conn.commit()
    conn.close()