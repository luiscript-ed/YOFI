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

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

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

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

if not GOOGLE_CLIENT_ID:
    raise RuntimeError("GOOGLE_CLIENT_ID não configurado.")

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
    senha TEXT,
    provedor TEXT NOT NULL DEFAULT 'local',
    google_id TEXT UNIQUE
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

class GoogleLogin(BaseModel):
    credential: str
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
def conversar_mya(
    dados: PerguntaMYA, 
    usuario_id: int = Depends(obter_usuario_autenticado)
):
    resposta = perguntar_mya(
        pergunta=dados.pergunta,
        usuario_id=usuario_id
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

@app.post("/login/google")
def login_google(dados: GoogleLogin, response: Response):


    #  VALIDAR TOKEN DO GOOGLE
  

    try:
        idinfo = id_token.verify_oauth2_token(
            dados.credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )

    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Token do Google inválido ou expirado."
        )

    google_id = idinfo.get("sub")
    email = idinfo.get("email")
    nome = idinfo.get("name")

    if not google_id or not email:
        raise HTTPException(
            status_code=401,
            detail="O Google não forneceu os dados necessários."
        )


    # VERIFICAR E-MAIL


    if not idinfo.get("email_verified"):
        raise HTTPException(
            status_code=401,
            detail="O e-mail da conta Google não foi verificado."
        )


    # PROCURAR USUÁRIO


    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT id, nome, email, provedor, google_id
            FROM usuarios
            WHERE google_id = %s
               OR email = %s
            LIMIT 1
            """,
            (google_id, email)
        )

        usuario = cursor.fetchone()


        # USUÁRIO NÃO EXISTE → CRIAR


        if not usuario:

            cursor.execute(
                """
                INSERT INTO usuarios
                (nome, email, senha, provedor, google_id)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, nome
                """,
                (
                    nome or "Usuário Google",
                    email,
                    None,
                    "google",
                    google_id
                )
            )

            novo_usuario = cursor.fetchone()

            usuario_id = novo_usuario[0]
            nome_usuario = novo_usuario[1]

            conn.commit()


        # USUÁRIO JÁ EXISTE


        else:

            usuario_id = usuario[0]
            nome_usuario = usuario[1]

            # Se a conta já existia por e-mail,
            # vinculamos o Google a ela.

            if usuario[4] is None:

                cursor.execute(
                    """
                    UPDATE usuarios
                    SET google_id = %s,
                        provedor = 'google'
                    WHERE id = %s
                    """,
                    (google_id, usuario_id)
                )

                conn.commit()

    except psycopg2.IntegrityError:

        conn.rollback()

        raise HTTPException(
            status_code=409,
            detail="Não foi possível vincular esta conta Google."
        )

    finally:

        cursor.close()
        conn.close()

    token = criar_token(usuario_id)


    # COOKIE

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=1800
    )

    return {
        "mensagem": "Login com Google realizado com sucesso!",
        "nome": nome_usuario
    }
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