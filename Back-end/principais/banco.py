from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3

app = FastAPI()

# Permite que o front-end acesse o back-end mesmo estando em portas diferentes (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos de dados que o front-end deve enviar
class UsuarioCadastro(BaseModel):
    nome: str
    email: str
    senha: str  # Em produção, use criptografia (ex: bcrypt)

class UsuarioLogin(BaseModel):
    email: str
    senha: str

# ROTA DE CADASTRO
@app.post("/cadastro")
def cadastrar_usuario(usuario: UsuarioCadastro):
    conn = sqlite3.connect("meu_banco.db")
    cursor = conn.cursor()
    
    # Cria a tabela caso não exista (agora incluindo o campo senha)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL
    )
    """)
    
    try:
        cursor.execute(
            "INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)",
            (usuario.nome, usuario.email, usuario.senha)
        )
        conn.commit()
        return {"mensagem": "Usuário cadastrado com sucesso!"}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Este e-mail já está cadastrado.")
    finally:
        conn.close()

# ROTA DE LOGIN
@app.post("/login")
def logar_usuario(usuario: UsuarioLogin):
    conn = sqlite3.connect("meu_banco.db")
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT nome FROM usuarios WHERE email = ? AND senha = ?",
        (usuario.email, usuario.senha)
    )
    resultado = cursor.fetchone()
    conn.close()
    
    if resultado:
        return {"mensagem": f"Login realizado com sucesso! Bem-vindo {resultado[0]}."}
    else:
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos.")
