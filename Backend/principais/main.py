from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Rotas

from principais.rotas.cadastro import router as cadastro_router
from principais.rotas.login import router as login_router
from principais.rotas.logout import router as logout_router

from principais.rotas.analise_financeira import router as analise_financeira_router
from principais.rotas.contas import router as contas_router
from principais.rotas.cartoes import router as cartoes_router

from principais.rotas.transacao import router as transacoes_router
from principais.rotas.objetivos import router as objetivos_router
from principais.rotas.orcamentos import router as orcamentos_router

from principais.rotas.dashboard import router as dashboard_router
from principais.rotas.reservas import router as reservas_router

from principais.rotas.custos import router as custos_router
from principais.rotas.historico import router as historico_router
from principais.rotas.movimentacoes import router as movimentacoes_router

from principais.rotas.notificacao import router as notificacao_router
from principais.rotas.me import router as me_router

app = FastAPI(
    title="YOFI API",
    description="API do sistema financeiro YOFI",
    version="1.0.0"
)

# ==========================================
# CORS
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://luiscript-ed.github.io"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# ROTAS
# =========================

app.include_router(cadastro_router)
app.include_router(login_router)
app.include_router(logout_router)

app.include_router(contas_router)
app.include_router(cartoes_router)
app.include_router(transacoes_router)

app.include_router(objetivos_router)
app.include_router(orcamentos_router)
app.include_router(analise_financeira_router)

app.include_router(dashboard_router)
app.include_router(me_router)
app.include_router(reservas_router)

app.include_router(custos_router)
app.include_router(historico_router)
app.include_router(movimentacoes_router)

app.include_router(notificacao_router)

@app.get("/")
def inicio():
    return {
        "mensagem": "YOFI API funcionando!"
    }