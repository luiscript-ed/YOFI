from fastapi import FastAPI, HTTPException, Request, Response, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pwdlib import PasswordHash
import jwt

from datetime import datetime, timezone, timedelta
from principais.mya import perguntar_mya
from principais.analise_financeira import analisar_usuario 
from principais.analise_financeira import categorias_principais
from secundarios.notify import criar_notificacao
from secundarios.scheduler import scheduler
from principais.analise_financeira import gerar_dicas_economia

def conectar():
    return psycopg2.connect(
        os.environ["DATABASE_URL"],
        sslmode="require"
    )
app = FastAPI()

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

password_hash = PasswordHash.recommended()

# ==========================================
# BANCO DE DADOS
# ==========================================

import psycopg2
import os

JWT_SECRET = os.getenv("JWT_SECRET")

if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET não configurado.")

def criar_token(usuario_id: int):

    payload = {
        "usuario_id": usuario_id,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=30)
    }

    token = jwt.encode(
        payload,
        JWT_SECRET,
        algorithm="HS256"
    )

    return token

def obter_usuario_autenticado(request: Request):

    token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Usuário não autenticado."
        )

    try:

        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=["HS256"]
        )

        usuario_id = payload.get("usuario_id")

        if not usuario_id:
            raise HTTPException(
                status_code=401,
                detail="Token inválido."
            )

        return int(usuario_id)

    except jwt.ExpiredSignatureError:

        raise HTTPException(
            status_code=401,
            detail="Sessão expirada."
        )

    except jwt.InvalidTokenError:

        raise HTTPException(
            status_code=401,
            detail="Token inválido."
        )
    
conn = conectar()
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS transacoes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    categoria TEXT NOT NULL,
    valor NUMERIC NOT NULL,
    descricao TEXT,
    data TEXT NOT NULL,

    FOREIGN KEY(usuario_id)
    REFERENCES usuarios(id)
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS notificacoes (
    id SERIAL PRIMARY KEY,

    usuario_id INTEGER NOT NULL,

    titulo TEXT NOT NULL,

    mensagem TEXT NOT NULL,

    data TEXT NOT NULL,

    lida INTEGER DEFAULT 0,

    FOREIGN KEY(usuario_id)
    REFERENCES usuarios(id)
)
""")

conn.commit()
cursor.close()
conn.close()

# ==========================================
# MODELOS
# ==========================================

class UsuarioCadastro(BaseModel):
    nome: str
    email: str
    senha: str

class UsuarioLogin(BaseModel):
    email: str
    senha: str

class Transacao(BaseModel):
    tipo: str  # ganho ou gasto
    categoria: str
    valor: float
    descricao: str

class PerguntaMYA(BaseModel):
    pergunta: str

# ==========================================
# MYA
# ==========================================
@app.get("/categorias")
def top_categorias(usuario_id: int = Depends(obter_usuario_autenticado)):

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

@app.get("/economia")
def economia(usuario_id: int = Depends(obter_usuario_autenticado)):

    return {
        "dicas": gerar_dicas_economia(
            usuario_id
        )
    }

@app.post("/mya")
def conversar_mya( dados: PerguntaMYA, usuario_id: int = Depends(obter_usuario_autenticado)):
    resposta = perguntar_mya(
        dados.pergunta
    )

    return {
        "resposta": resposta
    }

@app.get("/analise")
def analise(usuario_id: int = Depends(obter_usuario_autenticado)):

    resultado = analisar_usuario(usuario_id)

    return {
        "analise": resultado
    }

# ==========================================
# CADASTRO
# ==========================================

@app.post("/cadastro")
def cadastrar_usuario(usuario: UsuarioCadastro):
    senha_hash = password_hash.hash(usuario.senha)
    conn = conectar()
    cursor = conn.cursor()

    try:
        
        cursor.execute(
            """
            INSERT INTO usuarios
            (nome, email, senha)

            VALUES (%s, %s, %s)
            """,
            (
                usuario.nome,
                usuario.email,
                senha_hash
            )
        )

        conn.commit()

        return {
            "mensagem": "Usuário cadastrado com sucesso!"
        }

    except psycopg2.IntegrityError:

        conn.rollback()

        raise HTTPException(
            status_code=400,
            detail="Este e-mail já está cadastrado."
        )

    finally:

        cursor.close()
        conn.close()

# ==========================================
# LOGIN
# ==========================================

@app.post("/login")
def login(usuario: UsuarioLogin, response: Response):

    conn = conectar()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, nome, senha
        FROM usuarios

        WHERE email = %s
        """,
        (
            usuario.email,
        )
    )

    resultado = cursor.fetchone()

    cursor.close()
    conn.close()

    if resultado and password_hash.verify(usuario.senha, resultado[2]):
        usuario_id, nome = resultado[0], resultado[1]
        
        token = criar_token(usuario_id)

        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=1800
        )

        return {
            "mensagem": "Login realizado com sucesso!",
            "nome": nome
        }

    raise HTTPException(
        status_code=401,
        detail="E-mail ou senha incorretos."
    )
# ==========================================
# ADICIONAR TRANSAÇÃO
# ==========================================

@app.post("/transacao")
def adicionar_transacao(
    transacao: Transacao,
    usuario_id: int = Depends(obter_usuario_autenticado)
):

    if transacao.tipo not in ["ganho", "gasto"]:
        raise HTTPException(
            status_code=400,
            detail="Tipo deve ser 'ganho' ou 'gasto'"
        )

    data_atual = datetime.now().strftime("%d/%m/%Y")

    criar_notificacao(
        usuario_id,
        "Nova transação registrada",
        f"{transacao.tipo.upper()} - {transacao.categoria} - R${transacao.valor}"
    )

    conn = conectar()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO transacoes
        (usuario_id, tipo, categoria, valor, descricao, data)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (
            usuario_id,
            transacao.tipo,
            transacao.categoria,
            transacao.valor,
            transacao.descricao,
            data_atual
        )
    )

    conn.commit()

    cursor.close()
    conn.close()

    return {
        "mensagem": "Transação adicionada com sucesso!"
    }

# ==========================================
# LISTAR TRANSAÇÕES
# ==========================================

@app.get("/transacoes")
def listar_transacoes(usuario_id: int = Depends(obter_usuario_autenticado)):

    conn = conectar()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, tipo, categoria, valor, descricao, data
        FROM transacoes
        WHERE usuario_id = %s
        ORDER BY id DESC
        """,
        (usuario_id,)
    )

    resultados = cursor.fetchall()

    conn.close()

    transacoes = []

    for transacao in resultados:

        transacoes.append({
            "id": transacao[0],
            "tipo": transacao[1],
            "categoria": transacao[2],
            "valor": transacao[3],
            "descricao": transacao[4],
            "data": transacao[5]
        })

    return transacoes

# ==========================================
# DASHBOARD FINANCEIRO
# ==========================================

@app.get("/dashboard")
def dashboard(usuario_id: int = Depends(obter_usuario_autenticado)):

    conn = conectar()
    cursor = conn.cursor()

    # Total ganhos
    cursor.execute(
        """
        SELECT SUM(valor)
        FROM transacoes
        WHERE usuario_id = %s
        AND tipo = 'ganho'
        """,
        (usuario_id,)
    )

    ganhos = cursor.fetchone()[0]

    # Total gastos
    cursor.execute(
        """
        SELECT SUM(valor)
        FROM transacoes
        WHERE usuario_id = %s
        AND tipo = 'gasto'
        """,
        (usuario_id,)
    )

    gastos = cursor.fetchone()[0]

    ganhos = ganhos if ganhos else 0
    gastos = gastos if gastos else 0

    saldo = ganhos - gastos

    conn.close()
    cursor.close()
    return {
        "total_ganhos": ganhos,
        "total_gastos": gastos,
        "saldo": saldo
    }

# ==========================================
# GRÁFICO DE CATEGORIAS
# ==========================================

@app.get("/grafico-categorias")
def grafico_categorias(usuario_id: int = Depends(obter_usuario_autenticado)):

    conn = conectar()
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

    resultados = cursor.fetchall()

    conn.close()
    cursor.close()

    return [
        {
            "categoria": item[0],
            "total": item[1]
        }
        for item in resultados
    ]

@app.get("/notificacoes")
def listar_notificacoes(usuario_id: int = Depends(obter_usuario_autenticado)):

    conn = conectar()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id,
               titulo,
               mensagem,
               data,
               lida

        FROM notificacoes

        WHERE usuario_id = %s

        ORDER BY id DESC
        """,
        (usuario_id,)
    )

    resultados = cursor.fetchall()

    conn.close()
    cursor.close()

    notificacoes = []

    for n in resultados:

        notificacoes.append({

            "id": n[0],
            "titulo": n[1],
            "mensagem": n[2],
            "data": n[3],
            "lida": n[4]

        })

    return notificacoes

@app.get("/me")
def usuario_atual(
    usuario_id: int = Depends(obter_usuario_autenticado)
):

    conn = conectar()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, nome, email
        FROM usuarios
        WHERE id = %s
        """,
        (usuario_id,)
    )

    resultado = cursor.fetchone()

    cursor.close()
    conn.close()

    if not resultado:

        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado."
        )

    return {
        "usuario_id": resultado[0],
        "nome": resultado[1],
        "email": resultado[2]
    }