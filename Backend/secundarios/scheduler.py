from apscheduler.schedulers.background import BackgroundScheduler
from principais.analise_financeira import analisar_usuario
from secundarios.notify import criar_notificacao
import psycopg2
import os
import logging

logging.basicConfig(level=logging.INFO)

logger = logging.getLogger(__name__)

def obter_usuarios():
    conn = None
    cursor = None

    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id
            FROM usuarios
            ORDER BY id
        """)

        return cursor.fetchall()

    except Exception as e:
        logger.error(f"Erro ao buscar usuários: {e}")
        return []

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()

def executar_analises():
    logger.info("INICIANDO ANALISES DA MYA")

    usuarios = obter_usuarios()

    if not usuarios:
        logger.info("Nenhum usuário encontrado para análise.")
        return

    for usuario in usuarios:
        usuario_id = usuario[0]

        try:
            resultado = analisar_usuario(usuario_id)

            if resultado:
                criar_notificacao(
                    usuario_id,
                    "Análise MYA",
                    resultado
                )

                logger.info(
                    f"Análise concluída para usuário {usuario_id}"
                )

        except Exception as e:
            logger.error(
                f"Erro na análise do usuário {usuario_id}: {e}"
            )

def executar_programacoes():
    logger.info("INICIANDO PROCESSAMENTO DE TRANSAÇÕES PROGRAMADAS")

    try:
        # Import local para evitar import circular com banco.py
        from principais.banco import processar_transacoes_programadas

        resultado = processar_transacoes_programadas()

        logger.info(
            f"Transações programadas processadas: {resultado}"
        )

    except Exception as e:
        logger.error(
            f"Erro ao processar transações programadas: {e}"
        )

scheduler = BackgroundScheduler(
    timezone="America/Sao_Paulo"
)

# ============================================================
# ANÁLISES AUTOMÁTICAS DA MYA
# ============================================================

scheduler.add_job(
    executar_analises,
    "cron",
    hour=6,
    minute=0,
    id="analises_06",
    replace_existing=True,
    max_instances=1,
    coalesce=True
)

scheduler.add_job(
    executar_analises,
    "cron",
    hour=12,
    minute=0,
    id="analises_12",
    replace_existing=True,
    max_instances=1,
    coalesce=True
)

scheduler.add_job(
    executar_analises,
    "cron",
    hour=18,
    minute=0,
    id="analises_18",
    replace_existing=True,
    max_instances=1,
    coalesce=True
)

# ============================================================
# TRANSAÇÕES RESERVADAS + CUSTOS RECORRENTES
# ============================================================
# Executamos a cada 10 minutos.
# Isso é proposital:
# - não depende de acertar exatamente meia-noite;
# - se o servidor ficar alguns minutos offline, ao voltar
# o processamento verifica tudo que ficou pendente;
# - a função processar_transacoes_programadas() já deve
# verificar datas anteriores e evitar duplicações.
# ============================================================

scheduler.add_job(
    executar_programacoes,
    "interval",
    minutes=10,
    id="programacoes_financeiras",
    replace_existing=True,
    max_instances=1,
    coalesce=True
)

# ============================================================
# INICIAR SCHEDULER
# ============================================================

scheduler.start()

logger.info("SCHEDULER INICIADO")
logger.info("Analises MYA: 06:00, 12:00 e 18:00")
logger.info("Programacoes financeiras: a cada 10 minutos")