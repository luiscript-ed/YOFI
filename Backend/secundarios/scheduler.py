from apscheduler.schedulers.background import BackgroundScheduler

from principais.analise_financeira import analisar_usuario
from secundarios.notify import criar_notificacao

import sqlite3

def executar_analises():

    conn = sqlite3.connect("meu_banco.db")
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id
        FROM usuarios
        """
    )

    usuarios = cursor.fetchall()

    conn.close()

    for usuario in usuarios:

        usuario_id = usuario[0]

        resultado = analisar_usuario(usuario_id)

        criar_notificacao(

            usuario_id,

            "Análise MYA",

            resultado

        )

scheduler = BackgroundScheduler()

scheduler.add_job(
    executar_analises,
    "cron",
    hour=6,
    minute=0
)

scheduler.add_job(
    executar_analises,
    "cron",
    hour=12,
    minute=0
)

scheduler.add_job(
    executar_analises,
    "cron",
    hour=18,
    minute=0
)

scheduler.start()
print("SCHEDULER INICIADO")
