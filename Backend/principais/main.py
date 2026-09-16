from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

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
# MIDDLEWARE DE SEGURANÇA GLOBAL
# ==========================================

@app.middleware("http")
async def add_security_headers_and_force_https(request: Request, call_next):

    host = request.headers.get("host", "")
    if "localhost" not in host and "127.0.0.1" not in host:
        if request.url.scheme == "http" or request.headers.get("x-forwarded-proto") == "http":
            url = request.url.replace(scheme="https")
            return RedirectResponse(url, status_code=307)

    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    
    if "localhost" not in host and "127.0.0.1" not in host:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
    response.headers["X-Content-Type-Options"] = "nosniff"
    
    return response

# CORS (Processado logo após as validações de segurança)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://luiscript-ed.github.io"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
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
