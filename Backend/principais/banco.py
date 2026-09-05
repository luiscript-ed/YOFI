from fastapi import FastAPI, HTTPException, Request, Response, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pwdlib import PasswordHash
import jwt
import json

import calendar
from datetime import datetime, timezone, timedelta, date, time

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
    google_id TEXT UNIQUE,
    imagem TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW()
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS contas (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    usuario_id INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    saldo_inicial NUMERIC NOT NULL DEFAULT 0,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
               
    FOREIGN KEY(usuario_id)
    REFERENCES usuarios(id)
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS cartoes (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    usuario_id INTEGER NOT NULL,
    banco TEXT NOT NULL,
    limite NUMERIC NOT NULL DEFAULT 0,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    dia_vencimento INTEGER NOT NULL,
    dia_fechamento INTEGER NOT NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
               
    FOREIGN KEY(usuario_id)
    REFERENCES usuarios(id)
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS objetivos (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    usuario_id INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    valor_meta NUMERIC NOT NULL DEFAULT 0,
    valor_atual NUMERIC NOT NULL DEFAULT 0,
    prazo DATE NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
               
    FOREIGN KEY(usuario_id)
    REFERENCES usuarios(id)
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS orcamentos (
    id SERIAL PRIMARY KEY,
    categoria TEXT NOT NULL,
    usuario_id INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    ano INTEGER NOT NULL,
    limite NUMERIC NOT NULL DEFAULT 0,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
               
    FOREIGN KEY(usuario_id)
    REFERENCES usuarios(id)
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS movimentacoes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    origem_conta_id INTEGER NOT NULL,
    destino_conta_id INTEGER NOT NULL,
    valor NUMERIC NOT NULL,
    descricao TEXT,
    data TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    criado_em TIMESTAMPTZ DEFAULT NOW(),

    FOREIGN KEY(usuario_id)
        REFERENCES usuarios(id),

    FOREIGN KEY(origem_conta_id)
        REFERENCES contas(id),

    FOREIGN KEY(destino_conta_id)
        REFERENCES contas(id)
)
""")


cursor.execute("""
CREATE TABLE IF NOT EXISTS transacoes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    cartao_id INTEGER,
    conta_id INTEGER,
    tipo TEXT NOT NULL,
    categoria TEXT NOT NULL,
    valor NUMERIC NOT NULL,
    descricao TEXT,
    data TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    criado_em TIMESTAMPTZ DEFAULT NOW(),

    FOREIGN KEY(usuario_id)
    REFERENCES usuarios(id),
               
    FOREIGN KEY(cartao_id)
    REFERENCES cartoes(id),
               
    FOREIGN KEY(conta_id)
    REFERENCES contas(id)
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS notificacoes (
    id SERIAL PRIMARY KEY,

    usuario_id INTEGER NOT NULL,

    titulo TEXT NOT NULL,

    mensagem TEXT NOT NULL,

    data DATE NOT NULL,

    lida BOOLEAN DEFAULT FALSE,

    FOREIGN KEY(usuario_id)
    REFERENCES usuarios(id)
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS transacoes_reservadas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    conta_id INTEGER,
    cartao_id INTEGER,
    tipo TEXT NOT NULL,
    categoria TEXT NOT NULL,
    valor NUMERIC NOT NULL,
    descricao TEXT,
    data TIMESTAMPTZ NOT NULL,
    executada BOOLEAN NOT NULL DEFAULT FALSE,
    transacao_id INTEGER,
    criado_em TIMESTAMPTZ DEFAULT NOW(),

    FOREIGN KEY(usuario_id)
        REFERENCES usuarios(id),

    FOREIGN KEY(conta_id)
        REFERENCES contas(id),

    FOREIGN KEY(cartao_id)
        REFERENCES cartoes(id),

    FOREIGN KEY(transacao_id)
        REFERENCES transacoes(id)
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS custos_recorrentes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    conta_id INTEGER,
    cartao_id INTEGER,
    tipo TEXT NOT NULL DEFAULT 'gasto',
    categoria TEXT NOT NULL,
    valor NUMERIC NOT NULL,
    descricao TEXT,
    frequencia TEXT NOT NULL,
    dias INTEGER[] NOT NULL DEFAULT '{}',
    data_anual DATE,
    data_inicio DATE NOT NULL,
    data_fim DATE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ DEFAULT NOW(),

    FOREIGN KEY(usuario_id)
        REFERENCES usuarios(id),

    FOREIGN KEY(conta_id)
        REFERENCES contas(id),

    FOREIGN KEY(cartao_id)
        REFERENCES cartoes(id)
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS execucoes_custos (
    id SERIAL PRIMARY KEY,
    custo_id INTEGER NOT NULL,
    data_execucao DATE NOT NULL,
    transacao_id INTEGER NOT NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW(),

    FOREIGN KEY(custo_id)
        REFERENCES custos_recorrentes(id),

    FOREIGN KEY(transacao_id)
        REFERENCES transacoes(id),

    UNIQUE(custo_id, data_execucao)
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

class MovimentacaoCreate(BaseModel):
    origem_conta_id: int
    destino_conta_id: int
    valor: float = Field(gt=0)
    descricao: str | None = None
    data: datetime

class GoogleLogin(BaseModel):
    credential: str


class PerguntaMYA(BaseModel):
    pergunta: str
    contexto_financeiro: dict

class ContaCreate(BaseModel):
    nome: str
    tipo: str
    saldo_inicial: float = 0


class ContaCreate(BaseModel):
    nome: str
    tipo: str
    saldo_inicial: float = 0


class ContaUpdate(BaseModel):
    nome: str
    tipo: str
    saldo_inicial: float
    ativo: bool


class CartaoCreate(BaseModel):
    nome: str
    banco: str
    limite: float = 0
    dia_vencimento: int = Field(ge=1, le=31)
    dia_fechamento: int = Field(ge=1, le=31)


class CartaoUpdate(BaseModel):
    nome: str
    banco: str
    limite: float
    dia_vencimento: int = Field(ge=1, le=31)
    dia_fechamento: int = Field(ge=1, le=31)
    ativo: bool


class TransacaoCreate(BaseModel):
    conta_id: int | None = None
    cartao_id: int | None = None
    tipo: str
    categoria: str
    valor: float = Field(gt=0)
    descricao: str | None = None
    data: datetime


class TransacaoUpdate(BaseModel):
    conta_id: int | None = None
    cartao_id: int | None = None
    tipo: str
    categoria: str
    valor: float = Field(gt=0)
    descricao: str | None = None
    data: datetime


class ObjetivoCreate(BaseModel):
    nome: str
    tipo: str
    valor_meta: float = Field(gt=0)
    valor_atual: float = 0
    prazo: date


class ObjetivoUpdate(BaseModel):
    nome: str
    tipo: str
    valor_meta: float = Field(gt=0)
    valor_atual: float
    prazo: date
    ativo: bool


class OrcamentoCreate(BaseModel):
    categoria: str
    mes: int = Field(ge=1, le=12)
    ano: int = Field(ge=2000)
    limite: float = Field(gt=0)


class OrcamentoUpdate(BaseModel):
    categoria: str
    mes: int = Field(ge=1, le=12)
    ano: int = Field(ge=2000)
    limite: float = Field(gt=0)

class TransacaoReservadaCreate(BaseModel):
    conta_id: int | None = None
    cartao_id: int | None = None
    tipo: str
    categoria: str
    valor: float = Field(gt=0)
    descricao: str | None = None
    data: datetime


class CustoRecorrenteCreate(BaseModel):
    conta_id: int | None = None
    cartao_id: int | None = None
    categoria: str
    valor: float = Field(gt=0)
    descricao: str | None = None
    frequencia: str
    dias: list[int] = []
    data_anual: date | None = None
    data_inicio: date
    data_fim: date | None = None

# ==========================================
# JÁ QUE EU BÃO SEI MEXER EM CALENDAR, FUNÇÕES AUXILIARES DO CHAT
# ==========================================

def validar_destino_financeiro(
    cursor,
    usuario_id: int,
    conta_id: int | None,
    cartao_id: int | None,
    exigir_ativo: bool = True
):
    if (conta_id is None) == (cartao_id is None):
        raise HTTPException(
            status_code=400,
            detail="Informe uma conta ou um cartão, mas não os dois."
        )

    if conta_id is not None:
        query = """
            SELECT id
            FROM contas
            WHERE id = %s
            AND usuario_id = %s
        """

        params = [conta_id, usuario_id]

        if exigir_ativo:
            query += " AND ativo = TRUE"

        cursor.execute(query, tuple(params))

        if not cursor.fetchone():
            raise HTTPException(
                status_code=404,
                detail="Conta não encontrada."
            )

    if cartao_id is not None:
        query = """
            SELECT id
            FROM cartoes
            WHERE id = %s
            AND usuario_id = %s
        """

        params = [cartao_id, usuario_id]

        if exigir_ativo:
            query += " AND ativo = TRUE"

        cursor.execute(query, tuple(params))

        if not cursor.fetchone():
            raise HTTPException(
                status_code=404,
                detail="Cartão não encontrado."
            )


def ultimo_dia_mes(ano: int, mes: int) -> int:
    return calendar.monthrange(ano, mes)[1]


def gerar_datas_recorrentes(custo, inicio: date, fim: date):
    datas = []

    if custo["frequencia"] == "mensal":
        ano = inicio.year
        mes = inicio.month

        while (ano, mes) <= (fim.year, fim.month):
            ultimo_dia = ultimo_dia_mes(ano, mes)

            for dia in custo["dias"]:
                dia_real = min(dia, ultimo_dia)

                data_ocorrencia = date(
                    ano,
                    mes,
                    dia_real
                )

                if inicio <= data_ocorrencia <= fim:
                    datas.append(data_ocorrencia)

            if mes == 12:
                mes = 1
                ano += 1
            else:
                mes += 1

    elif custo["frequencia"] == "anual":
        if not custo["data_anual"]:
            return datas

        ano = inicio.year

        while ano <= fim.year:
            try:
                data_ocorrencia = date(
                    ano,
                    custo["data_anual"].month,
                    custo["data_anual"].day
                )
            except ValueError:
                ultimo_dia = ultimo_dia_mes(
                    ano,
                    custo["data_anual"].month
                )

                data_ocorrencia = date(
                    ano,
                    custo["data_anual"].month,
                    ultimo_dia
                )

            if inicio <= data_ocorrencia <= fim:
                datas.append(data_ocorrencia)

            ano += 1

    return sorted(set(datas))


def data_transacao_programada(data_ocorrencia: date) -> datetime:
    return datetime.combine(
        data_ocorrencia,
        time(12, 0),
        tzinfo=timezone.utc
    )

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
async def conversar_mya(
    pergunta: str = Form(...),
    contexto_financeiro: str = Form("{}"),
    imagem: UploadFile | None = File(None),
    usuario_id: int = Depends(obter_usuario_autenticado)
):
    try:
        contexto = json.loads(contexto_financeiro)

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Contexto financeiro inválido."
        )

    resposta = await perguntar_mya(
        pergunta=pergunta,
        usuario_id=usuario_id,
        contexto_financeiro=contexto,
        imagem=imagem
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
    imagem = idinfo.get("picture")

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
            SELECT id, nome, email, provedor, google_id, imagem
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
                (nome, email, senha, provedor, google_id, imagem)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id, nome
                """,
                (
                    nome or "Usuário Google",
                    email,
                    None,
                    "google",
                    google_id,
                    imagem
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



            if usuario[4] is None or not usuario[5]:

                cursor.execute(
                    """
                    UPDATE usuarios
                    SET google_id = %s,
                        provedor = 'google',
                        imagem = %s
                    WHERE id = %s
                    """,
                    (google_id, imagem, usuario_id)
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
# LOGOUT
# ==========================================

@app.post("/logout")
def logout(response: Response):

    response.delete_cookie(
        key="access_token",
        path="/",
        secure=True,
        httponly=True,
        samesite="none"
    )

    return {
        "mensagem": "Logout realizado com sucesso!"
    }

# ==========================================
# CONTAS
# ==========================================

@app.post("/contas")
def criar_conta(
    conta: ContaCreate,
    usuario_id: int = Depends(obter_usuario_autenticado)
):

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            INSERT INTO contas
            (usuario_id, nome, tipo, saldo_inicial, ativo)
            VALUES (%s, %s, %s, %s, TRUE)
            RETURNING id, nome, tipo, saldo_inicial, ativo, criado_em
            """,
            (
                usuario_id,
                conta.nome,
                conta.tipo,
                conta.saldo_inicial
            )
        )

        resultado = cursor.fetchone()
        conn.commit()

        criar_notificacao(
            usuario_id,
            "Conta criada",
            f"A conta '{conta.nome}' foi criada com sucesso."
        )

        return {
            "mensagem": "Conta criada com sucesso!",
            "conta": {
                "id": resultado[0],
                "nome": resultado[1],
                "tipo": resultado[2],
                "saldo_inicial": float(resultado[3]),
                "ativo": resultado[4],
                "criado_em": resultado[5]
            }
        }

    except Exception:
        conn.rollback()
        raise

    finally:
        cursor.close()
        conn.close()


@app.get("/contas")
def listar_contas(
    usuario_id: int = Depends(obter_usuario_autenticado)
):

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT
                c.id,
                c.nome,
                c.tipo,
                c.saldo_inicial,
                c.ativo,
                c.criado_em,
                COALESCE(
                    c.saldo_inicial +
                    SUM(
                        CASE
                            WHEN t.tipo = 'ganho' THEN t.valor
                            WHEN t.tipo = 'gasto' THEN -t.valor
                            ELSE 0
                        END
                    ),
                    c.saldo_inicial
                ) AS saldo_atual

            FROM contas c

            LEFT JOIN transacoes t
                ON t.conta_id = c.id
                AND t.usuario_id = %s

            WHERE c.usuario_id = %s

            GROUP BY
                c.id,
                c.nome,
                c.tipo,
                c.saldo_inicial,
                c.ativo,
                c.criado_em

            ORDER BY c.id DESC
            """,
            (usuario_id, usuario_id)
        )

        resultados = cursor.fetchall()

        return [
            {
                "id": c[0],
                "nome": c[1],
                "tipo": c[2],
                "saldo_inicial": float(c[3]),
                "ativo": c[4],
                "criado_em": c[5],
                "saldo_atual": float(c[6])
            }
            for c in resultados
        ]

    finally:
        cursor.close()
        conn.close()


@app.get("/contas/{conta_id}")
def obter_conta(
    conta_id: int,
    usuario_id: int = Depends(obter_usuario_autenticado)
):

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT
                c.id,
                c.nome,
                c.tipo,
                c.saldo_inicial,
                c.ativo,
                c.criado_em,
                COALESCE(
                    c.saldo_inicial +
                    SUM(
                        CASE
                            WHEN t.tipo = 'ganho' THEN t.valor
                            WHEN t.tipo = 'gasto' THEN -t.valor
                            ELSE 0
                        END
                    ),
                    c.saldo_inicial
                ) AS saldo_atual

            FROM contas c

            LEFT JOIN transacoes t
                ON t.conta_id = c.id

            WHERE c.id = %s
            AND c.usuario_id = %s

            GROUP BY
                c.id,
                c.nome,
                c.tipo,
                c.saldo_inicial,
                c.ativo,
                c.criado_em
            """,
            (conta_id, usuario_id)
        )

        conta = cursor.fetchone()

        if not conta:
            raise HTTPException(
                status_code=404,
                detail="Conta não encontrada."
            )

        return {
            "id": conta[0],
            "nome": conta[1],
            "tipo": conta[2],
            "saldo_inicial": float(conta[3]),
            "ativo": conta[4],
            "criado_em": conta[5],
            "saldo_atual": float(conta[6])
        }

    finally:
        cursor.close()
        conn.close()


@app.put("/contas/{conta_id}")
def atualizar_conta(
    conta_id: int,
    conta: ContaUpdate,
    usuario_id: int = Depends(obter_usuario_autenticado)
):

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            UPDATE contas
            SET nome = %s,
                tipo = %s,
                saldo_inicial = %s,
                ativo = %s
            WHERE id = %s
            AND usuario_id = %s
            RETURNING id
            """,
            (
                conta.nome,
                conta.tipo,
                conta.saldo_inicial,
                conta.ativo,
                conta_id,
                usuario_id
            )
        )

        resultado = cursor.fetchone()

        if not resultado:
            raise HTTPException(
                status_code=404,
                detail="Conta não encontrada."
            )

        conn.commit()

        return {
            "mensagem": "Conta atualizada com sucesso!"
        }

    finally:
        cursor.close()
        conn.close()


@app.delete("/contas/{conta_id}")
def deletar_conta(
    conta_id: int,
    usuario_id: int = Depends(obter_usuario_autenticado)
):

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT id
            FROM transacoes
            WHERE conta_id = %s
            AND usuario_id = %s
            LIMIT 1
            """,
            (conta_id, usuario_id)
        )

        if cursor.fetchone():
            raise HTTPException(
                status_code=400,
                detail="Essa conta possui transações e não pode ser excluída."
            )

        cursor.execute(
            """
            DELETE FROM contas
            WHERE id = %s
            AND usuario_id = %s
            RETURNING id
            """,
            (conta_id, usuario_id)
        )

        resultado = cursor.fetchone()

        if not resultado:
            raise HTTPException(
                status_code=404,
                detail="Conta não encontrada."
            )

        conn.commit()

        return {
            "mensagem": "Conta excluída com sucesso!"
        }

    finally:
        cursor.close()
        conn.close()

# ==========================================
# ORÇAMENTOS
# ==========================================

@app.post("/orcamentos")
def criar_orcamento(
    orcamento: OrcamentoCreate,
    usuario_id: int = Depends(obter_usuario_autenticado)
):

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT id
            FROM orcamentos
            WHERE usuario_id = %s
            AND categoria = %s
            AND mes = %s
            AND ano = %s
            """,
            (
                usuario_id,
                orcamento.categoria,
                orcamento.mes,
                orcamento.ano
            )
        )

        if cursor.fetchone():
            raise HTTPException(
                status_code=409,
                detail="Já existe um orçamento para essa categoria neste mês."
            )

        cursor.execute(
            """
            INSERT INTO orcamentos
            (
                usuario_id,
                categoria,
                mes,
                ano,
                limite
            )
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                usuario_id,
                orcamento.categoria,
                orcamento.mes,
                orcamento.ano,
                orcamento.limite
            )
        )

        orcamento_id = cursor.fetchone()[0]

        conn.commit()

        return {
            "mensagem": "Orçamento criado com sucesso!",
            "id": orcamento_id
        }

    finally:
        cursor.close()
        conn.close()


@app.get("/orcamentos")
def listar_orcamentos(
    usuario_id: int = Depends(obter_usuario_autenticado)
):

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT
                o.id,
                o.categoria,
                o.mes,
                o.ano,
                o.limite,
                COALESCE(SUM(t.valor), 0) AS gasto

            FROM orcamentos o

            LEFT JOIN transacoes t
                ON t.usuario_id = o.usuario_id
                AND t.categoria = o.categoria
                AND t.tipo = 'gasto'
                AND EXTRACT(MONTH FROM t.data) = o.mes
                AND EXTRACT(YEAR FROM t.data) = o.ano

            WHERE o.usuario_id = %s

            GROUP BY
                o.id,
                o.categoria,
                o.mes,
                o.ano,
                o.limite

            ORDER BY o.ano DESC, o.mes DESC, o.id DESC
            """,
            (usuario_id,)
        )

        return [
            {
                "id": o[0],
                "categoria": o[1],
                "mes": o[2],
                "ano": o[3],
                "limite": float(o[4]),
                "gasto": float(o[5]),
                "disponivel": float(o[4]) - float(o[5]),
                "percentual": (
                    (float(o[5]) / float(o[4])) * 100
                    if float(o[4]) > 0
                    else 0
                )
            }
            for o in cursor.fetchall()
        ]

    finally:
        cursor.close()
        conn.close()


@app.put("/orcamentos/{orcamento_id}")
def atualizar_orcamento(
    orcamento_id: int,
    orcamento: OrcamentoUpdate,
    usuario_id: int = Depends(obter_usuario_autenticado)
):

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            UPDATE orcamentos
            SET categoria = %s,
                mes = %s,
                ano = %s,
                limite = %s
            WHERE id = %s
            AND usuario_id = %s
            RETURNING id
            """,
            (
                orcamento.categoria,
                orcamento.mes,
                orcamento.ano,
                orcamento.limite,
                orcamento_id,
                usuario_id
            )
        )

        if not cursor.fetchone():
            raise HTTPException(
                status_code=404,
                detail="Orçamento não encontrado."
            )

        conn.commit()

        return {
            "mensagem": "Orçamento atualizado com sucesso!"
        }

    finally:
        cursor.close()
        conn.close()


@app.delete("/orcamentos/{orcamento_id}")
def deletar_orcamento(
    orcamento_id: int,
    usuario_id: int = Depends(obter_usuario_autenticado)
):

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            DELETE FROM orcamentos
            WHERE id = %s
            AND usuario_id = %s
            RETURNING id
            """,
            (orcamento_id, usuario_id)
        )

        if not cursor.fetchone():
            raise HTTPException(
                status_code=404,
                detail="Orçamento não encontrado."
            )

        conn.commit()

        return {
            "mensagem": "Orçamento excluído com sucesso!"
        }

    finally:
        cursor.close()
        conn.close()

# ==========================================
# OBJETIVOS
# ==========================================

@app.post("/objetivos")
def criar_objetivo(
    objetivo: ObjetivoCreate,
    usuario_id: int = Depends(obter_usuario_autenticado)
):

    if objetivo.valor_atual > objetivo.valor_meta:
        raise HTTPException(
            status_code=400,
            detail="O valor atual não pode ser maior que a meta."
        )

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            INSERT INTO objetivos
            (
                usuario_id,
                nome,
                tipo,
                valor_meta,
                valor_atual,
                prazo,
                ativo
            )
            VALUES (%s, %s, %s, %s, %s, %s, TRUE)
            RETURNING id
            """,
            (
                usuario_id,
                objetivo.nome,
                objetivo.tipo,
                objetivo.valor_meta,
                objetivo.valor_atual,
                objetivo.prazo
            )
        )

        objetivo_id = cursor.fetchone()[0]

        conn.commit()

        return {
            "mensagem": "Objetivo criado com sucesso!",
            "id": objetivo_id
        }

    finally:
        cursor.close()
        conn.close()


@app.get("/objetivos")
def listar_objetivos(
    usuario_id: int = Depends(obter_usuario_autenticado)
):

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT
                id,
                nome,
                tipo,
                valor_meta,
                valor_atual,
                prazo,
                ativo
            FROM objetivos
            WHERE usuario_id = %s
            ORDER BY id DESC
            """,
            (usuario_id,)
        )

        return [
            {
                "id": o[0],
                "nome": o[1],
                "tipo": o[2],
                "valor_meta": float(o[3]),
                "valor_atual": float(o[4]),
                "prazo": o[5],
                "ativo": o[6],
                "progresso": (
                    (float(o[4]) / float(o[3])) * 100
                    if float(o[3]) > 0
                    else 0
                )
            }
            for o in cursor.fetchall()
        ]

    finally:
        cursor.close()
        conn.close()


@app.get("/objetivos/{objetivo_id}")
def obter_objetivo(
    objetivo_id: int,
    usuario_id: int = Depends(obter_usuario_autenticado)
):

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT
                id,
                nome,
                tipo,
                valor_meta,
                valor_atual,
                prazo,
                ativo
            FROM objetivos
            WHERE id = %s
            AND usuario_id = %s
            """,
            (objetivo_id, usuario_id)
        )

        o = cursor.fetchone()

        if not o:
            raise HTTPException(
                status_code=404,
                detail="Objetivo não encontrado."
            )

        return {
            "id": o[0],
            "nome": o[1],
            "tipo": o[2],
            "valor_meta": float(o[3]),
            "valor_atual": float(o[4]),
            "prazo": o[5],
            "ativo": o[6]
        }

    finally:
        cursor.close()
        conn.close()


@app.put("/objetivos/{objetivo_id}")
def atualizar_objetivo(
    objetivo_id: int,
    objetivo: ObjetivoUpdate,
    usuario_id: int = Depends(obter_usuario_autenticado)
):

    if objetivo.valor_atual > objetivo.valor_meta:
        raise HTTPException(
            status_code=400,
            detail="O valor atual não pode ser maior que a meta."
        )

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            UPDATE objetivos
            SET nome = %s,
                tipo = %s,
                valor_meta = %s,
                valor_atual = %s,
                prazo = %s,
                ativo = %s
            WHERE id = %s
            AND usuario_id = %s
            RETURNING id
            """,
            (
                objetivo.nome,
                objetivo.tipo,
                objetivo.valor_meta,
                objetivo.valor_atual,
                objetivo.prazo,
                objetivo.ativo,
                objetivo_id,
                usuario_id
            )
        )

        if not cursor.fetchone():
            raise HTTPException(
                status_code=404,
                detail="Objetivo não encontrado."
            )

        conn.commit()

        return {
            "mensagem": "Objetivo atualizado com sucesso!"
        }

    finally:
        cursor.close()
        conn.close()


@app.delete("/objetivos/{objetivo_id}")
def deletar_objetivo(
    objetivo_id: int,
    usuario_id: int = Depends(obter_usuario_autenticado)
):

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            DELETE FROM objetivos
            WHERE id = %s
            AND usuario_id = %s
            RETURNING id
            """,
            (objetivo_id, usuario_id)
        )

        if not cursor.fetchone():
            raise HTTPException(
                status_code=404,
                detail="Objetivo não encontrado."
            )

        conn.commit()

        return {
            "mensagem": "Objetivo excluído com sucesso!"
        }

    finally:
        cursor.close()
        conn.close()

# ==========================================
# CARTÕES
# ==========================================

@app.post("/cartoes")
def criar_cartao(
    cartao: CartaoCreate,
    usuario_id: int = Depends(obter_usuario_autenticado)
):

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            INSERT INTO cartoes
            (usuario_id, nome, banco, limite,
             dia_vencimento, dia_fechamento, ativo)
            VALUES (%s, %s, %s, %s, %s, %s, TRUE)
            RETURNING id, nome, banco, limite,
                      dia_vencimento, dia_fechamento,
                      ativo, criado_em
            """,
            (
                usuario_id,
                cartao.nome,
                cartao.banco,
                cartao.limite,
                cartao.dia_vencimento,
                cartao.dia_fechamento
            )
        )

        resultado = cursor.fetchone()
        conn.commit()

        criar_notificacao(
            usuario_id,
            "Cartão criado",
            f"O cartão '{cartao.nome}' foi cadastrado."
        )

        return {
            "mensagem": "Cartão criado com sucesso!",
            "cartao": {
                "id": resultado[0],
                "nome": resultado[1],
                "banco": resultado[2],
                "limite": float(resultado[3]),
                "dia_vencimento": resultado[4],
                "dia_fechamento": resultado[5],
                "ativo": resultado[6],
                "criado_em": resultado[7]
            }
        }

    finally:
        cursor.close()
        conn.close()


@app.get("/cartoes")
def listar_cartoes(
    usuario_id: int = Depends(obter_usuario_autenticado)
):

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT
                c.id,
                c.nome,
                c.banco,
                c.limite,
                c.dia_vencimento,
                c.dia_fechamento,
                c.ativo,
                c.criado_em,
                COALESCE(
                    SUM(
                        CASE
                            WHEN t.tipo = 'gasto' THEN t.valor
                            WHEN t.tipo = 'ganho' THEN -t.valor
                            ELSE 0
                        END
                    ),
                    0
                ) AS utilizado

            FROM cartoes c

            LEFT JOIN transacoes t
                ON t.cartao_id = c.id
                AND t.usuario_id = %s

            WHERE c.usuario_id = %s

            GROUP BY
                c.id,
                c.nome,
                c.banco,
                c.limite,
                c.dia_vencimento,
                c.dia_fechamento,
                c.ativo,
                c.criado_em

            ORDER BY c.id DESC
            """,
            (usuario_id, usuario_id)
        )

        resultados = cursor.fetchall()

        return [
            {
                "id": c[0],
                "nome": c[1],
                "banco": c[2],
                "limite": float(c[3]),
                "dia_vencimento": c[4],
                "dia_fechamento": c[5],
                "ativo": c[6],
                "criado_em": c[7],
                "utilizado": float(c[8]),
                "disponivel": float(c[3]) - float(c[8])
            }
            for c in resultados
        ]

    finally:
        cursor.close()
        conn.close()


@app.get("/cartoes/{cartao_id}")
def obter_cartao(
    cartao_id: int,
    usuario_id: int = Depends(obter_usuario_autenticado)
):

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT
                c.id,
                c.nome,
                c.banco,
                c.limite,
                c.dia_vencimento,
                c.dia_fechamento,
                c.ativo,
                c.criado_em,
                COALESCE(
                    SUM(
                        CASE
                            WHEN t.tipo = 'gasto' THEN t.valor
                            WHEN t.tipo = 'ganho' THEN -t.valor
                            ELSE 0
                        END
                    ),
                    0
                ) AS utilizado

            FROM cartoes c

            LEFT JOIN transacoes t
                ON t.cartao_id = c.id

            WHERE c.id = %s
            AND c.usuario_id = %s

            GROUP BY
                c.id,
                c.nome,
                c.banco,
                c.limite,
                c.dia_vencimento,
                c.dia_fechamento,
                c.ativo,
                c.criado_em
            """,
            (cartao_id, usuario_id)
        )

        cartao = cursor.fetchone()

        if not cartao:
            raise HTTPException(
                status_code=404,
                detail="Cartão não encontrado."
            )

        return {
            "id": cartao[0],
            "nome": cartao[1],
            "banco": cartao[2],
            "limite": float(cartao[3]),
            "dia_vencimento": cartao[4],
            "dia_fechamento": cartao[5],
            "ativo": cartao[6],
            "criado_em": cartao[7],
            "utilizado": float(cartao[8]),
            "disponivel": float(cartao[3]) - float(cartao[8])
        }

    finally:
        cursor.close()
        conn.close()


@app.put("/cartoes/{cartao_id}")
def atualizar_cartao(
    cartao_id: int,
    cartao: CartaoUpdate,
    usuario_id: int = Depends(obter_usuario_autenticado)
):

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            UPDATE cartoes
            SET nome = %s,
                banco = %s,
                limite = %s,
                dia_vencimento = %s,
                dia_fechamento = %s,
                ativo = %s
            WHERE id = %s
            AND usuario_id = %s
            RETURNING id
            """,
            (
                cartao.nome,
                cartao.banco,
                cartao.limite,
                cartao.dia_vencimento,
                cartao.dia_fechamento,
                cartao.ativo,
                cartao_id,
                usuario_id
            )
        )

        resultado = cursor.fetchone()

        if not resultado:
            raise HTTPException(
                status_code=404,
                detail="Cartão não encontrado."
            )

        conn.commit()

        return {
            "mensagem": "Cartão atualizado com sucesso!"
        }

    finally:
        cursor.close()
        conn.close()


@app.delete("/cartoes/{cartao_id}")
def deletar_cartao(
    cartao_id: int,
    usuario_id: int = Depends(obter_usuario_autenticado)
):

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT id
            FROM transacoes
            WHERE cartao_id = %s
            AND usuario_id = %s
            LIMIT 1
            """,
            (cartao_id, usuario_id)
        )

        if cursor.fetchone():
            raise HTTPException(
                status_code=400,
                detail="Esse cartão possui transações e não pode ser excluído."
            )

        cursor.execute(
            """
            DELETE FROM cartoes
            WHERE id = %s
            AND usuario_id = %s
            RETURNING id
            """,
            (cartao_id, usuario_id)
        )

        resultado = cursor.fetchone()

        if not resultado:
            raise HTTPException(
                status_code=404,
                detail="Cartão não encontrado."
            )

        conn.commit()

        return {
            "mensagem": "Cartão excluído com sucesso!"
        }

    finally:
        cursor.close()
        conn.close()


@app.get("/cartoes/{cartao_id}/fatura")
def fatura_cartao(
    cartao_id: int,
    mes: int,
    ano: int,
    usuario_id: int = Depends(obter_usuario_autenticado)
):

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT
                id,
                nome,
                banco,
                limite,
                dia_vencimento,
                dia_fechamento
            FROM cartoes
            WHERE id = %s
            AND usuario_id = %s
            """,
            (cartao_id, usuario_id)
        )

        cartao = cursor.fetchone()

        if not cartao:
            raise HTTPException(
                status_code=404,
                detail="Cartão não encontrado."
            )

        cursor.execute(
            """
            SELECT
                id,
                tipo,
                categoria,
                valor,
                descricao,
                data
            FROM transacoes
            WHERE cartao_id = %s
            AND usuario_id = %s
            AND EXTRACT(MONTH FROM data) = %s
            AND EXTRACT(YEAR FROM data) = %s
            ORDER BY data DESC
            """,
            (cartao_id, usuario_id, mes, ano)
        )

        transacoes = cursor.fetchall()

        total = sum(
            float(t[3])
            for t in transacoes
            if t[1] == "gasto"
        )

        return {
            "cartao": {
                "id": cartao[0],
                "nome": cartao[1],
                "banco": cartao[2],
                "limite": float(cartao[3]),
                "dia_vencimento": cartao[4],
                "dia_fechamento": cartao[5]
            },
            "mes": mes,
            "ano": ano,
            "total": total,
            "transacoes": [
                {
                    "id": t[0],
                    "tipo": t[1],
                    "categoria": t[2],
                    "valor": float(t[3]),
                    "descricao": t[4],
                    "data": t[5]
                }
                for t in transacoes
            ]
        }

    finally:
        cursor.close()
        conn.close()

# ==========================================
# TRANSAÇÕES
# ==========================================

@app.post("/transacoes")
def criar_transacao(
    transacao: TransacaoCreate,
    usuario_id: int = Depends(obter_usuario_autenticado)
):

    if transacao.tipo not in ["ganho", "gasto"]:
        raise HTTPException(
            status_code=400,
            detail="Tipo deve ser 'ganho' ou 'gasto'."
        )

    if (transacao.conta_id is None) == (transacao.cartao_id is None):
        raise HTTPException(
            status_code=400,
            detail="Informe uma conta ou um cartão, mas não os dois."
        )

    conn = conectar()
    cursor = conn.cursor()

    try:

        if transacao.conta_id:

            cursor.execute(
                """
                SELECT id
                FROM contas
                WHERE id = %s
                AND usuario_id = %s
                AND ativo = TRUE
                """,
                (transacao.conta_id, usuario_id)
            )

            if not cursor.fetchone():
                raise HTTPException(
                    status_code=404,
                    detail="Conta não encontrada."
                )

        if transacao.cartao_id:

            cursor.execute(
                """
                SELECT id
                FROM cartoes
                WHERE id = %s
                AND usuario_id = %s
                AND ativo = TRUE
                """,
                (transacao.cartao_id, usuario_id)
            )

            if not cursor.fetchone():
                raise HTTPException(
                    status_code=404,
                    detail="Cartão não encontrado."
                )

        cursor.execute(
            """
            INSERT INTO transacoes
            (
                usuario_id,
                cartao_id,
                conta_id,
                tipo,
                categoria,
                valor,
                descricao,
                data
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                usuario_id,
                transacao.cartao_id,
                transacao.conta_id,
                transacao.tipo,
                transacao.categoria,
                transacao.valor,
                transacao.descricao,
                transacao.data
            )
        )

        transacao_id = cursor.fetchone()[0]

        conn.commit()

        criar_notificacao(
            usuario_id,
            "Nova transação",
            f"{transacao.tipo.upper()} de R$ {transacao.valor:.2f} registrada."
        )

        return {
            "mensagem": "Transação criada com sucesso!",
            "id": transacao_id
        }

    except:
        conn.rollback()
        raise

    finally:
        cursor.close()
        conn.close()


@app.get("/transacoes")
def listar_transacoes(
    usuario_id: int = Depends(obter_usuario_autenticado)
):

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT
                t.id,
                t.tipo,
                t.categoria,
                t.valor,
                t.descricao,
                t.data,
                t.conta_id,
                c.nome,
                t.cartao_id,
                ca.nome
            FROM transacoes t

            LEFT JOIN contas c
                ON c.id = t.conta_id

            LEFT JOIN cartoes ca
                ON ca.id = t.cartao_id

            WHERE t.usuario_id = %s

            ORDER BY t.data DESC, t.id DESC
            """,
            (usuario_id,)
        )

        resultados = cursor.fetchall()

        return [
            {
                "id": t[0],
                "tipo": t[1],
                "categoria": t[2],
                "valor": float(t[3]),
                "descricao": t[4],
                "data": t[5],
                "conta": {
                    "id": t[6],
                    "nome": t[7]
                } if t[6] else None,
                "cartao": {
                    "id": t[8],
                    "nome": t[9]
                } if t[8] else None
            }
            for t in resultados
        ]

    finally:
        cursor.close()
        conn.close()


@app.get("/transacoes/{transacao_id}")
def obter_transacao(
    transacao_id: int,
    usuario_id: int = Depends(obter_usuario_autenticado)
):

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT
                t.id,
                t.tipo,
                t.categoria,
                t.valor,
                t.descricao,
                t.data,
                t.conta_id,
                t.cartao_id
            FROM transacoes t

            WHERE t.id = %s
            AND t.usuario_id = %s
            """,
            (transacao_id, usuario_id)
        )

        t = cursor.fetchone()

        if not t:
            raise HTTPException(
                status_code=404,
                detail="Transação não encontrada."
            )

        return {
            "id": t[0],
            "tipo": t[1],
            "categoria": t[2],
            "valor": float(t[3]),
            "descricao": t[4],
            "data": t[5],
            "conta_id": t[6],
            "cartao_id": t[7]
        }

    finally:
        cursor.close()
        conn.close()


@app.put("/transacoes/{transacao_id}")
def atualizar_transacao(
    transacao_id: int,
    transacao: TransacaoUpdate,
    usuario_id: int = Depends(obter_usuario_autenticado)
):

    if transacao.tipo not in ["ganho", "gasto"]:
        raise HTTPException(
            status_code=400,
            detail="Tipo inválido."
        )

    if (transacao.conta_id is None) == (transacao.cartao_id is None):
        raise HTTPException(
            status_code=400,
            detail="Informe uma conta ou um cartão."
        )

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT id
            FROM transacoes
            WHERE id = %s
            AND usuario_id = %s
            """,
            (transacao_id, usuario_id)
        )

        if not cursor.fetchone():
            raise HTTPException(
                status_code=404,
                detail="Transação não encontrada."
            )

        if transacao.conta_id:

            cursor.execute(
                """
                SELECT id
                FROM contas
                WHERE id = %s
                AND usuario_id = %s
                """,
                (transacao.conta_id, usuario_id)
            )

            if not cursor.fetchone():
                raise HTTPException(
                    status_code=404,
                    detail="Conta não encontrada."
                )

        if transacao.cartao_id:

            cursor.execute(
                """
                SELECT id
                FROM cartoes
                WHERE id = %s
                AND usuario_id = %s
                """,
                (transacao.cartao_id, usuario_id)
            )

            if not cursor.fetchone():
                raise HTTPException(
                    status_code=404,
                    detail="Cartão não encontrado."
                )

        cursor.execute(
            """
            UPDATE transacoes
            SET conta_id = %s,
                cartao_id = %s,
                tipo = %s,
                categoria = %s,
                valor = %s,
                descricao = %s,
                data = %s
            WHERE id = %s
            AND usuario_id = %s
            """,
            (
                transacao.conta_id,
                transacao.cartao_id,
                transacao.tipo,
                transacao.categoria,
                transacao.valor,
                transacao.descricao,
                transacao.data,
                transacao_id,
                usuario_id
            )
        )

        conn.commit()

        return {
            "mensagem": "Transação atualizada com sucesso!"
        }

    finally:
        cursor.close()
        conn.close()


@app.delete("/transacoes/{transacao_id}")
def deletar_transacao(
    transacao_id: int,
    usuario_id: int = Depends(obter_usuario_autenticado)
):

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            DELETE FROM transacoes
            WHERE id = %s
            AND usuario_id = %s
            RETURNING id
            """,
            (transacao_id, usuario_id)
        )

        resultado = cursor.fetchone()

        if not resultado:
            raise HTTPException(
                status_code=404,
                detail="Transação não encontrada."
            )

        conn.commit()

        return {
            "mensagem": "Transação excluída com sucesso!"
        }

    finally:
        cursor.close()
        conn.close()

@app.post("/movimentacoes")
def criar_movimentacao(
    movimentacao: MovimentacaoCreate,
    usuario_id: int = Depends(obter_usuario_autenticado)
):
    if movimentacao.origem_conta_id == movimentacao.destino_conta_id:
        raise HTTPException(
            status_code=400,
            detail="A origem e o destino devem ser diferentes."
        )

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT id
            FROM contas
            WHERE id = %s
            AND usuario_id = %s
            AND ativo = TRUE
            """,
            (
                movimentacao.origem_conta_id,
                usuario_id
            )
        )

        if not cursor.fetchone():
            raise HTTPException(
                status_code=404,
                detail="Conta de origem não encontrada."
            )


        cursor.execute(
            """
            SELECT id
            FROM contas
            WHERE id = %s
            AND usuario_id = %s
            AND ativo = TRUE
            """,
            (
                movimentacao.destino_conta_id,
                usuario_id
            )
        )

        if not cursor.fetchone():
            raise HTTPException(
                status_code=404,
                detail="Conta de destino não encontrada."
            )


        cursor.execute(
            """
            SELECT
                saldo_inicial +
                COALESCE(
                    SUM(
                        CASE
                            WHEN tipo = 'ganho'
                                THEN valor
                            WHEN tipo = 'gasto'
                                THEN -valor
                            ELSE 0
                        END
                    ),
                    0
                ) AS saldo
            FROM contas
            LEFT JOIN transacoes
                ON transacoes.conta_id = contas.id
                AND transacoes.usuario_id = %s
            WHERE contas.id = %s
            GROUP BY contas.id, contas.saldo_inicial
            """,
            (
                usuario_id,
                movimentacao.origem_conta_id
            )
        )

        saldo_origem = cursor.fetchone()

        if not saldo_origem:
            raise HTTPException(
                status_code=404,
                detail="Conta de origem não encontrada."
            )

        saldo_atual = float(saldo_origem[0])

        if saldo_atual < movimentacao.valor:
            raise HTTPException(
                status_code=400,
                detail="Saldo insuficiente na conta de origem."
            )


        cursor.execute(
            """
            INSERT INTO movimentacoes
            (
                usuario_id,
                origem_conta_id,
                destino_conta_id,
                valor,
                descricao,
                data
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                usuario_id,
                movimentacao.origem_conta_id,
                movimentacao.destino_conta_id,
                movimentacao.valor,
                movimentacao.descricao,
                movimentacao.data
            )
        )

        movimentacao_id = cursor.fetchone()[0]

        conn.commit()

        criar_notificacao(
            usuario_id,
            "Movimentação realizada",
            f"Transferência de R$ {movimentacao.valor:.2f} realizada com sucesso."
        )

        return {
            "mensagem": "Movimentação realizada com sucesso!",
            "id": movimentacao_id
        }

    except HTTPException:
        conn.rollback()
        raise

    except Exception:
        conn.rollback()
        raise

    finally:
        cursor.close()
        conn.close()

# ==========================================
# TRANSAÇÕES RECORRENTES E CUSTOS
# ==========================================

@app.post("/transacoes-reservadas")
def criar_transacao_reservada(
    transacao: TransacaoReservadaCreate,
    usuario_id: int = Depends(obter_usuario_autenticado)
):
    if transacao.tipo not in ["ganho", "gasto"]:
        raise HTTPException(
            status_code=400,
            detail="Tipo deve ser 'ganho' ou 'gasto'."
        )

    if transacao.data <= datetime.now(timezone.utc):
        raise HTTPException(
            status_code=400,
            detail="A data da transação reservada deve ser futura."
        )

    conn = conectar()
    cursor = conn.cursor()

    try:
        validar_destino_financeiro(
            cursor,
            usuario_id,
            transacao.conta_id,
            transacao.cartao_id
        )

        cursor.execute(
            """
            INSERT INTO transacoes_reservadas
            (
                usuario_id,
                conta_id,
                cartao_id,
                tipo,
                categoria,
                valor,
                descricao,
                data
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                usuario_id,
                transacao.conta_id,
                transacao.cartao_id,
                transacao.tipo,
                transacao.categoria,
                transacao.valor,
                transacao.descricao,
                transacao.data
            )
        )

        reservado_id = cursor.fetchone()[0]

        conn.commit()

        criar_notificacao(
            usuario_id,
            "Transação reservada",
            f"{transacao.tipo.upper()} de R$ {transacao.valor:.2f} programada para {transacao.data.strftime('%d/%m/%Y')}."
        )

        return {
            "mensagem": "Transação reservada com sucesso!",
            "id": reservado_id
        }

    except Exception:
        conn.rollback()
        raise

    finally:
        cursor.close()
        conn.close()

@app.get("/transacoes-reservadas")
def listar_transacoes_reservadas(
    usuario_id: int = Depends(obter_usuario_autenticado)
):
    conn = conectar()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT
                r.id,
                r.tipo,
                r.categoria,
                r.valor,
                r.descricao,
                r.data,
                r.executada,
                r.transacao_id,
                r.conta_id,
                c.nome,
                r.cartao_id,
                ca.nome
            FROM transacoes_reservadas r

            LEFT JOIN contas c
                ON c.id = r.conta_id

            LEFT JOIN cartoes ca
                ON ca.id = r.cartao_id

            WHERE r.usuario_id = %s

            ORDER BY r.data ASC, r.id ASC
            """,
            (usuario_id,)
        )

        return [
            {
                "id": r[0],
                "tipo": r[1],
                "categoria": r[2],
                "valor": float(r[3]),
                "descricao": r[4],
                "data": r[5],
                "executada": r[6],
                "transacao_id": r[7],
                "conta": {
                    "id": r[8],
                    "nome": r[9]
                } if r[8] else None,
                "cartao": {
                    "id": r[10],
                    "nome": r[11]
                } if r[10] else None
            }
            for r in cursor.fetchall()
        ]

    finally:
        cursor.close()
        conn.close()

@app.post("/custos-recorrentes")
def criar_custo_recorrente(
    custo: CustoRecorrenteCreate,
    usuario_id: int = Depends(obter_usuario_autenticado)
):
    if (custo.conta_id is None) == (custo.cartao_id is None):
        raise HTTPException(
            status_code=400,
            detail="Informe uma conta ou um cartão, mas não os dois."
        )

    if custo.frequencia not in ["mensal", "anual"]:
        raise HTTPException(
            status_code=400,
            detail="A frequência deve ser 'mensal' ou 'anual'."
        )

    if custo.data_fim and custo.data_fim < custo.data_inicio:
        raise HTTPException(
            status_code=400,
            detail="A data final não pode ser anterior à data inicial."
        )

    dias = sorted(set(custo.dias))

    if custo.frequencia == "mensal":
        if not dias:
            raise HTTPException(
                status_code=400,
                detail="Informe pelo menos um dia para a cobrança mensal."
            )

        if len(dias) > 5:
            raise HTTPException(
                status_code=400,
                detail="Um custo pode ter no máximo 5 cobranças por mês."
            )

        if any(dia < 1 or dia > 31 for dia in dias):
            raise HTTPException(
                status_code=400,
                detail="Os dias devem estar entre 1 e 31."
            )

        data_anual = None

    else:
        if not custo.data_anual:
            raise HTTPException(
                status_code=400,
                detail="Informe a data anual da cobrança."
            )

        dias = []
        data_anual = custo.data_anual

    conn = conectar()
    cursor = conn.cursor()

    try:
        validar_destino_financeiro(
            cursor,
            usuario_id,
            custo.conta_id,
            custo.cartao_id
        )

        cursor.execute(
            """
            INSERT INTO custos_recorrentes
            (
                usuario_id,
                conta_id,
                cartao_id,
                tipo,
                categoria,
                valor,
                descricao,
                frequencia,
                dias,
                data_anual,
                data_inicio,
                data_fim,
                ativo
            )
            VALUES (
                %s, %s, %s, 'gasto', %s, %s, %s, %s,
                %s, %s, %s, %s, TRUE
            )
            RETURNING id
            """,
            (
                usuario_id,
                custo.conta_id,
                custo.cartao_id,
                custo.categoria,
                custo.valor,
                custo.descricao,
                custo.frequencia,
                dias,
                data_anual,
                custo.data_inicio,
                custo.data_fim
            )
        )

        custo_id = cursor.fetchone()[0]

        conn.commit()

        criar_notificacao(
            usuario_id,
            "Custo recorrente criado",
            f"O custo '{custo.descricao or custo.categoria}' foi programado."
        )

        return {
            "mensagem": "Custo recorrente criado com sucesso!",
            "id": custo_id
        }

    except Exception:
        conn.rollback()
        raise

    finally:
        cursor.close()
        conn.close()

@app.get("/custos-recorrentes")
def listar_custos_recorrentes(
    usuario_id: int = Depends(obter_usuario_autenticado)
):
    conn = conectar()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT
                cr.id,
                cr.categoria,
                cr.valor,
                cr.descricao,
                cr.frequencia,
                cr.dias,
                cr.data_anual,
                cr.data_inicio,
                cr.data_fim,
                cr.ativo,
                cr.conta_id,
                c.nome,
                cr.cartao_id,
                ca.nome
            FROM custos_recorrentes cr

            LEFT JOIN contas c
                ON c.id = cr.conta_id

            LEFT JOIN cartoes ca
                ON ca.id = cr.cartao_id

            WHERE cr.usuario_id = %s

            ORDER BY cr.data_inicio ASC, cr.id ASC
            """,
            (usuario_id,)
        )

        custos = cursor.fetchall()
        hoje = datetime.now(timezone.utc).date()

        resultado = []

        for custo in custos:
            (
                custo_id,
                categoria,
                valor,
                descricao,
                frequencia,
                dias,
                data_anual,
                data_inicio,
                data_fim,
                ativo,
                conta_id,
                conta_nome,
                cartao_id,
                cartao_nome
            ) = custo

            proxima_data = None

            if ativo:
                inicio_calculo = max(
                    data_inicio,
                    hoje
                )

                fim_calculo = (
                    data_fim
                    if data_fim
                    else hoje.replace(
                        year=hoje.year + 5
                    )
                )

                datas = gerar_datas_recorrentes(
                    {
                        "frequencia": frequencia,
                        "dias": dias or [],
                        "data_anual": data_anual
                    },
                    inicio_calculo,
                    fim_calculo
                )

                if datas:
                    cursor.execute(
                        """
                        SELECT data_execucao
                        FROM execucoes_custos
                        WHERE custo_id = %s
                        ORDER BY data_execucao DESC
                        LIMIT 1
                        """,
                        (custo_id,)
                    )

                    ultima = cursor.fetchone()
                    ultima_data = ultima[0] if ultima else None

                    for data in datas:
                        if (
                            ultima_data is None
                            or data > ultima_data
                        ):
                            proxima_data = data
                            break

            resultado.append(
                {
                    "id": custo_id,
                    "categoria": categoria,
                    "valor": float(valor),
                    "descricao": descricao,
                    "frequencia": frequencia,
                    "dias": dias or [],
                    "data_anual": data_anual,
                    "data_inicio": data_inicio,
                    "data_fim": data_fim,
                    "ativo": ativo,
                    "proxima_data": proxima_data,
                    "conta": {
                        "id": conta_id,
                        "nome": conta_nome
                    } if conta_id else None,
                    "cartao": {
                        "id": cartao_id,
                        "nome": cartao_nome
                    } if cartao_id else None
                }
            )

        return resultado

    finally:
        cursor.close()
        conn.close()

# ==========================================
# FUNÇÃO PARA PROCESSAR TRANSAÇÕES PROGRAMADAS
# ==========================================

def processar_transacoes_programadas():
    conn = conectar()
    cursor = conn.cursor()

    try:
        agora = datetime.now(timezone.utc)

        # ==================================================
        # TRANSAÇÕES RESERVADAS
        # ==================================================

        cursor.execute(
            """
            SELECT
                id,
                usuario_id,
                conta_id,
                cartao_id,
                tipo,
                categoria,
                valor,
                descricao,
                data
            FROM transacoes_reservadas
            WHERE executada = FALSE
            AND data <= %s
            ORDER BY data ASC, id ASC
            FOR UPDATE
            """,
            (agora,)
        )

        reservadas = cursor.fetchall()

        for r in reservadas:
            (
                reservado_id,
                usuario_id,
                conta_id,
                cartao_id,
                tipo,
                categoria,
                valor,
                descricao,
                data
            ) = r

            validar_destino_financeiro(
                cursor,
                usuario_id,
                conta_id,
                cartao_id,
                exigir_ativo=False
            )

            cursor.execute(
                """
                INSERT INTO transacoes
                (
                    usuario_id,
                    conta_id,
                    cartao_id,
                    tipo,
                    categoria,
                    valor,
                    descricao,
                    data
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (
                    usuario_id,
                    conta_id,
                    cartao_id,
                    tipo,
                    categoria,
                    valor,
                    descricao,
                    data
                )
            )

            transacao_id = cursor.fetchone()[0]

            cursor.execute(
                """
                UPDATE transacoes_reservadas
                SET executada = TRUE,
                    transacao_id = %s
                WHERE id = %s
                """,
                (
                    transacao_id,
                    reservado_id
                )
            )

            criar_notificacao(
                usuario_id,
                "Transação reservada realizada",
                f"{tipo.upper()} de R$ {float(valor):.2f} foi registrada automaticamente."
            )

        # ==================================================
        # CUSTOS RECORRENTES
        # ==================================================

        cursor.execute(
            """
            SELECT
                id,
                usuario_id,
                conta_id,
                cartao_id,
                categoria,
                valor,
                descricao,
                frequencia,
                dias,
                data_anual,
                data_inicio,
                data_fim,
                ativo
            FROM custos_recorrentes
            WHERE ativo = TRUE
            """,
        )

        custos = cursor.fetchall()

        hoje = agora.date()

        for c in custos:
            (
                custo_id,
                usuario_id,
                conta_id,
                cartao_id,
                categoria,
                valor,
                descricao,
                frequencia,
                dias,
                data_anual,
                data_inicio,
                data_fim,
                ativo
            ) = c

            limite_final = (
                data_fim
                if data_fim and data_fim < hoje
                else hoje
            )

            if data_inicio > hoje:
                continue

            datas = gerar_datas_recorrentes(
                {
                    "frequencia": frequencia,
                    "dias": dias or [],
                    "data_anual": data_anual
                },
                data_inicio,
                limite_final
            )

            cursor.execute(
                """
                SELECT data_execucao
                FROM execucoes_custos
                WHERE custo_id = %s
                ORDER BY data_execucao DESC
                """,
                (custo_id,)
            )

            executadas = {
                row[0]
                for row in cursor.fetchall()
            }

            novas_execucoes = []

            for data_ocorrencia in datas:
                if data_ocorrencia in executadas:
                    continue

                validar_destino_financeiro(
                    cursor,
                    usuario_id,
                    conta_id,
                    cartao_id,
                    exigir_ativo=False
                )

                cursor.execute(
                    """
                    INSERT INTO transacoes
                    (
                        usuario_id,
                        conta_id,
                        cartao_id,
                        tipo,
                        categoria,
                        valor,
                        descricao,
                        data
                    )
                    VALUES (%s, %s, %s, 'gasto', %s, %s, %s, %s)
                    RETURNING id
                    """,
                    (
                        usuario_id,
                        conta_id,
                        cartao_id,
                        categoria,
                        valor,
                        descricao,
                        data_transacao_programada(
                            data_ocorrencia
                        )
                    )
                )

                transacao_id = cursor.fetchone()[0]

                cursor.execute(
                    """
                    INSERT INTO execucoes_custos
                    (
                        custo_id,
                        data_execucao,
                        transacao_id
                    )
                    VALUES (%s, %s, %s)
                    ON CONFLICT (custo_id, data_execucao)
                    DO NOTHING
                    """,
                    (
                        custo_id,
                        data_ocorrencia,
                        transacao_id
                    )
                )

                if cursor.rowcount > 0:
                    novas_execucoes.append(
                        data_ocorrencia
                    )

            if data_fim and hoje > data_fim:
                cursor.execute(
                    """
                    UPDATE custos_recorrentes
                    SET ativo = FALSE
                    WHERE id = %s
                    """,
                    (custo_id,)
                )

            if novas_execucoes:
                criar_notificacao(
                    usuario_id,
                    "Custo recorrente lançado",
                    f"{descricao or categoria}: R$ {float(valor):.2f} registrado automaticamente."
                )

        conn.commit()

        return {
            "reservadas_processadas": len(reservadas),
            "mensagem": "Programações processadas com sucesso."
        }

    except Exception:
        conn.rollback()
        raise

    finally:
        cursor.close()
        conn.close()

# ==========================================
# DASHBOARD
# ==========================================

@app.get("/dashboard")
def dashboard(
    mes: int,
    ano: int,
    usuario_id: int = Depends(obter_usuario_autenticado)
):

    conn = conectar()
    cursor = conn.cursor()

    try:

        # ------------------------------------------
        # RESUMO DO MÊS
        # ------------------------------------------

        cursor.execute(
            """
            SELECT
                COALESCE(SUM(
                    CASE WHEN tipo = 'ganho'
                    THEN valor ELSE 0 END
                ), 0),

                COALESCE(SUM(
                    CASE WHEN tipo = 'gasto'
                    THEN valor ELSE 0 END
                ), 0)

            FROM transacoes

            WHERE usuario_id = %s
            AND EXTRACT(MONTH FROM data) = %s
            AND EXTRACT(YEAR FROM data) = %s
            """,
            (usuario_id, mes, ano)
        )

        ganhos, gastos = cursor.fetchone()

        ganhos = float(ganhos)
        gastos = float(gastos)

        saldo = ganhos - gastos
        economia = ganhos - gastos

        taxa_economia = (
            (economia / ganhos) * 100
            if ganhos > 0
            else 0
        )

        # ------------------------------------------
        # CONTAS
        # ------------------------------------------

        cursor.execute(
            """
            SELECT
                c.id,
                c.nome,
                c.tipo,
                c.saldo_inicial,

                COALESCE(
                    c.saldo_inicial +
                    SUM(
                        CASE
                            WHEN t.tipo = 'ganho' THEN t.valor
                            WHEN t.tipo = 'gasto' THEN -t.valor
                            ELSE 0
                        END
                    ),
                    c.saldo_inicial
                ) AS saldo

            FROM contas c

            LEFT JOIN transacoes t
                ON t.conta_id = c.id

            WHERE c.usuario_id = %s
            AND c.ativo = TRUE

            GROUP BY
                c.id,
                c.nome,
                c.tipo,
                c.saldo_inicial

            ORDER BY c.id
            """,
            (usuario_id,)
        )

        contas = [
            {
                "id": c[0],
                "nome": c[1],
                "tipo": c[2],
                "saldo": float(c[4])
            }
            for c in cursor.fetchall()
        ]

        # ------------------------------------------
        # CARTÕES
        # ------------------------------------------

        cursor.execute(
            """
            SELECT
                c.id,
                c.nome,
                c.banco,
                c.limite,

                COALESCE(
                    SUM(
                        CASE
                            WHEN t.tipo = 'gasto' THEN t.valor
                            WHEN t.tipo = 'ganho' THEN -t.valor
                            ELSE 0
                        END
                    ),
                    0
                ) AS utilizado

            FROM cartoes c

            LEFT JOIN transacoes t
                ON t.cartao_id = c.id

            WHERE c.usuario_id = %s
            AND c.ativo = TRUE

            GROUP BY
                c.id,
                c.nome,
                c.banco,
                c.limite

            ORDER BY c.id
            """,
            (usuario_id,)
        )

        cartoes = [
            {
                "id": c[0],
                "nome": c[1],
                "banco": c[2],
                "limite": float(c[3]),
                "utilizado": float(c[4]),
                "disponivel": float(c[3]) - float(c[4])
            }
            for c in cursor.fetchall()
        ]

        # ------------------------------------------
        # GASTOS POR CATEGORIA
        # ------------------------------------------

        cursor.execute(
            """
            SELECT
                categoria,
                SUM(valor)

            FROM transacoes

            WHERE usuario_id = %s
            AND tipo = 'gasto'
            AND EXTRACT(MONTH FROM data) = %s
            AND EXTRACT(YEAR FROM data) = %s

            GROUP BY categoria
            ORDER BY SUM(valor) DESC
            """,
            (usuario_id, mes, ano)
        )

        categorias = [
            {
                "categoria": c[0],
                "total": float(c[1])
            }
            for c in cursor.fetchall()
        ]

        # ------------------------------------------
        # EVOLUÇÃO DIÁRIA
        # ------------------------------------------

        cursor.execute(
            """
            SELECT
                data::date,
                SUM(valor)

            FROM transacoes

            WHERE usuario_id = %s
            AND tipo = 'gasto'
            AND EXTRACT(MONTH FROM data) = %s
            AND EXTRACT(YEAR FROM data) = %s

            GROUP BY data::date
            ORDER BY data::date
            """,
            (usuario_id, mes, ano)
        )

        evolucao = [
            {
                "data": e[0],
                "total": float(e[1])
            }
            for e in cursor.fetchall()
        ]

        # ------------------------------------------
        # ÚLTIMAS TRANSAÇÕES
        # ------------------------------------------

        cursor.execute(
            """
            SELECT
                t.id,
                t.tipo,
                t.categoria,
                t.valor,
                t.descricao,
                t.data,
                c.nome,
                ca.nome

            FROM transacoes t

            LEFT JOIN contas c
                ON c.id = t.conta_id

            LEFT JOIN cartoes ca
                ON ca.id = t.cartao_id

            WHERE t.usuario_id = %s

            ORDER BY t.data DESC, t.id DESC
            LIMIT 10
            """,
            (usuario_id,)
        )

        ultimas_transacoes = [
            {
                "id": t[0],
                "tipo": t[1],
                "categoria": t[2],
                "valor": float(t[3]),
                "descricao": t[4],
                "data": t[5],
                "conta": t[6],
                "cartao": t[7]
            }
            for t in cursor.fetchall()
        ]

        # ------------------------------------------
        # NOTIFICAÇÕES
        # ------------------------------------------

        cursor.execute(
            """
            SELECT
                id,
                titulo,
                mensagem,
                data

            FROM notificacoes

            WHERE usuario_id = %s

            ORDER BY id DESC
            """,
            (usuario_id,)
        )

        notificacoes = [
            {
                "id": n[0],
                "titulo": n[1],
                "mensagem": n[2],
                "data": n[3]
            }
            for n in cursor.fetchall()
        ]

        return {
            "mes": mes,
            "ano": ano,

            "resumo": {
                "saldo": saldo,
                "ganhos": ganhos,
                "gastos": gastos
            },

            "economia": {
                "receitas": ganhos,
                "despesas": gastos,
                "valor_economizado": economia,
                "taxa": taxa_economia
            },

            "contas": contas,
            "cartoes": cartoes,
            "categorias": categorias,
            "evolucao": evolucao,
            "ultimas_transacoes": ultimas_transacoes,

            "notificacoes": notificacoes,
            "notificacoes_quantidade": len(notificacoes)
        }

    finally:
        cursor.close()
        conn.close()

# ==========================================
# NOTIFICAÇÕES
# ==========================================

@app.get("/notificacoes")
def listar_notificacoes(
    usuario_id: int = Depends(obter_usuario_autenticado)
):

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT
                id,
                titulo,
                mensagem,
                data
            FROM notificacoes
            WHERE usuario_id = %s
            ORDER BY id DESC
            """,
            (usuario_id,)
        )

        return [
            {
                "id": n[0],
                "titulo": n[1],
                "mensagem": n[2],
                "data": n[3]
            }
            for n in cursor.fetchall()
        ]

    finally:
        cursor.close()
        conn.close()


@app.get("/notificacoes/contador")
def contar_notificacoes(
    usuario_id: int = Depends(obter_usuario_autenticado)
):

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT COUNT(*)
            FROM notificacoes
            WHERE usuario_id = %s
            """,
            (usuario_id,)
        )

        quantidade = cursor.fetchone()[0]

        return {
            "quantidade": quantidade
        }

    finally:
        cursor.close()
        conn.close()


@app.delete("/notificacoes/{notificacao_id}")
def deletar_notificacao(
    notificacao_id: int,
    usuario_id: int = Depends(obter_usuario_autenticado)
):

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            DELETE FROM notificacoes
            WHERE id = %s
            AND usuario_id = %s
            RETURNING id
            """,
            (notificacao_id, usuario_id)
        )

        resultado = cursor.fetchone()

        if not resultado:
            raise HTTPException(
                status_code=404,
                detail="Notificação não encontrada."
            )

        conn.commit()

        return {
            "mensagem": "Notificação removida."
        }

    finally:
        cursor.close()
        conn.close()


@app.delete("/notificacoes")
def deletar_todas_notificacoes(
    usuario_id: int = Depends(obter_usuario_autenticado)
):

    conn = conectar()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            DELETE FROM notificacoes
            WHERE usuario_id = %s
            """,
            (usuario_id,)
        )

        quantidade = cursor.rowcount

        conn.commit()

        return {
            "mensagem": "Notificações removidas.",
            "quantidade": quantidade
        }

    finally:
        cursor.close()
        conn.close()

@app.get("/me")
def usuario_atual(
    usuario_id: int = Depends(obter_usuario_autenticado)
):

    conn = conectar()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, nome, email, imagem
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
        "email": resultado[2],
        "imagem": resultado[3]
    }