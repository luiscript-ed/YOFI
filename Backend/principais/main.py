from fastapi import FastAPI

# Rotas
from principais.rotas.cadastro import router as cadastro_router
from principais.rotas.login import router as login_router
from principais.rotas.logout import router as logout_router
from principais.rotas.contas import router as contas_router
from principais.rotas.cartoes import router as cartoes_router
from principais.rotas.transacoes import router as transacoes_router
from principais.rotas.objetivos import router as objetivos_router
from principais.rotas.orcamentos import router as orcamentos_router
from principais.rotas.dashboard import router as dashboard_router
from principais.rotas.mya import router as mya_router


app = FastAPI(
    title="YOFI API",
    description="API do sistema financeiro YOFI",
    version="1.0.0"
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

app.include_router(dashboard_router)
app.include_router(mya_router)


@app.get("/")
def inicio():
    return {
        "mensagem": "YOFI API funcionando!"
    }