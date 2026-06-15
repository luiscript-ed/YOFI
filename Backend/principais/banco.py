from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
from datetime import datetime
from Backend.principais.mya import perguntar_mya
from Backend.principais.analise_financeira import analisar_usuario 
from Backend.principais.analise_financeira import categorias_principais
from Backend.secundarios.notify import criar_notificacao
from Backend.secundarios.scheduler import scheduler
from principais.analise_financeira import gerar_dicas_economia

app = FastAPI()

# ==========================================
# CORS
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# BANCO DE DADOS
# ==========================================

conn = sqlite3.connect("meu_banco.db", check_same_thread=False)
cursor = conn.cursor()

# Tabela de usuários
cursor.execute("""
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL
)
""")

# Tabela de transações
cursor.execute("""
CREATE TABLE IF NOT EXISTS transacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    categoria TEXT NOT NULL,
    valor REAL NOT NULL,
    descricao TEXT,
    data TEXT NOT NULL,
    
    FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
)
""")

# Tabela de notificações
cursor.execute("""
CREATE TABLE IF NOT EXISTS notificacoes(

    id INTEGER PRIMARY KEY AUTOINCREMENT,

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
    usuario_id: int
    tipo: str  # ganho ou gasto
    categoria: str
    valor: float
    descricao: str

class PerguntaMYA(BaseModel):
    pergunta: str

# ==========================================
# MYA
# ==========================================
@app.get("/categorias/{usuario_id}")
def top_categorias(usuario_id: int):

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

@app.get("/economia/{usuario_id}")
def economia(usuario_id: int):

    return {
        "dicas": gerar_dicas_economia(
            usuario_id
        )
    }

@app.post("/mya")
def conversar_mya(dados: PerguntaMYA):

    resposta = perguntar_mya(
        dados.pergunta
    )

    return {
        "resposta": resposta
    }

@app.get("/analise/{usuario_id}")
def analise(usuario_id: int):

    resultado = analisar_usuario(usuario_id)

    return {
        "analise": resultado
    }

# ==========================================
# CADASTRO
# ==========================================

@app.post("/cadastro")
def cadastrar_usuario(usuario: UsuarioCadastro):

    try:
        cursor.execute(
            """
            INSERT INTO usuarios (nome, email, senha)
            VALUES (?, ?, ?)
            """,
            (usuario.nome, usuario.email, usuario.senha)
        )

        conn.commit()

        return {
            "mensagem": "Usuário cadastrado com sucesso!"
        }

    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=400,
            detail="Este e-mail já está cadastrado."
        )

# ==========================================
# LOGIN
# ==========================================

@app.post("/login")
def login(usuario: UsuarioLogin):

    cursor.execute(
        """
        SELECT id, nome
        FROM usuarios
        WHERE email = ? AND senha = ?
        """,
        (usuario.email, usuario.senha)
    )

    resultado = cursor.fetchone()

    if resultado:

        return {
            "mensagem": "Login realizado com sucesso!",
            "usuario_id": resultado[0],
            "nome": resultado[1]
        }

    raise HTTPException(
        status_code=401,
        detail="E-mail ou senha incorretos."
    )

# ==========================================
# ADICIONAR TRANSAÇÃO
# ==========================================

@app.post("/transacao")
def adicionar_transacao(transacao: Transacao):

    if transacao.tipo not in ["ganho", "gasto"]:
        raise HTTPException(
            status_code=400,
            detail="Tipo deve ser 'ganho' ou 'gasto'"
        )

    data_atual = datetime.now().strftime("%d/%m/%Y")

    criar_notificacao(

    transacao.usuario_id,

    "Nova transação registrada",

    f"{transacao.tipo.upper()} - {transacao.categoria} - R${transacao.valor}"

)
    cursor.execute(
        """
        INSERT INTO transacoes
        (usuario_id, tipo, categoria, valor, descricao, data)

        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            transacao.usuario_id,
            transacao.tipo,
            transacao.categoria,
            transacao.valor,
            transacao.descricao,
            data_atual
        )
    )

    conn.commit()

    return {
        "mensagem": "Transação adicionada com sucesso!"
    }

# ==========================================
# LISTAR TRANSAÇÕES
# ==========================================

@app.get("/transacoes/{usuario_id}")
def listar_transacoes(usuario_id: int):

    conn = sqlite3.connect("meu_banco.db")
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, tipo, categoria, valor, descricao, data
        FROM transacoes
        WHERE usuario_id = ?
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

@app.get("/dashboard/{usuario_id}")
def dashboard(usuario_id: int):

    # Total ganhos
    cursor.execute(
        """
        SELECT SUM(valor)
        FROM transacoes
        WHERE usuario_id = ?
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
        WHERE usuario_id = ?
        AND tipo = 'gasto'
        """,
        (usuario_id,)
    )

    gastos = cursor.fetchone()[0]

    ganhos = ganhos if ganhos else 0
    gastos = gastos if gastos else 0

    saldo = ganhos - gastos

    return {
        "total_ganhos": ganhos,
        "total_gastos": gastos,
        "saldo": saldo
    }

# ==========================================
# GRÁFICO DE CATEGORIAS
# ==========================================

@app.get("/grafico-categorias/{usuario_id}")
def grafico_categorias(usuario_id: int):

    cursor.execute(
        """
        SELECT categoria, SUM(valor)
        FROM transacoes
        WHERE usuario_id = ?
        AND tipo = 'gasto'
        GROUP BY categoria
        """,
        (usuario_id,)
    )

    resultados = cursor.fetchall()

    dados = []

    for item in resultados:
        dados.append({
            "categoria": item[0],
            "total": item[1]
        })

    return dados

@app.get("/notificacoes/{usuario_id}")
def listar_notificacoes(usuario_id: int):

    conn = sqlite3.connect("meu_banco.db")
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id,
               titulo,
               mensagem,
               data,
               lida

        FROM notificacoes

        WHERE usuario_id = ?

        ORDER BY id DESC
        """,
        (usuario_id,)
    )

    resultados = cursor.fetchall()

    conn.close()

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