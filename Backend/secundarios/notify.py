from datetime import datetime
import psycopg2
import os


def criar_notificacao(usuario_id, titulo, mensagem):

    conn = psycopg2.connect(
        os.getenv("DATABASE_URL")
    )

    cursor = conn.cursor()

    data = datetime.now().strftime("%d/%m/%Y %H:%M")

    cursor.execute(
        """
        INSERT INTO notificacoes
        (usuario_id, titulo, mensagem, data)

        VALUES (%s, %s, %s, %s)
        """,
        (
            usuario_id,
            titulo,
            mensagem,
            data
        )
    )

    conn.commit()

    cursor.close()
    conn.close()
    