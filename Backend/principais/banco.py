import psycopg2
import os

def conectar():
    return psycopg2.connect(
        os.environ["DATABASE_URL"],
        sslmode="require"
    )
# ==========================================
# BANCO DE DADOS
# ==========================================
  
def criar_tabelas():
    conn = conectar()
    cursor = conn.cursor()

    try:


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
        CREATE TABLE IF NOT EXISTS historico_importacoes (
            id SERIAL PRIMARY KEY,
            usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

            nome_arquivo TEXT NOT NULL,
            formato TEXT NOT NULL,
            quantidade_registros INTEGER DEFAULT 0,
            quantidade_importada INTEGER DEFAULT 0,
            quantidade_ignorados INTEGER DEFAULT 0,

            status TEXT NOT NULL DEFAULT 'concluida',
            mensagem TEXT,

            criado_em TIMESTAMPTZ DEFAULT NOW()
        )
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS historico_exportacoes (
            id SERIAL PRIMARY KEY,
            usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

            formato TEXT NOT NULL,
            dados_exportados TEXT[] NOT NULL,
            quantidade_registros INTEGER DEFAULT 0,

            criado_em TIMESTAMPTZ DEFAULT NOW()
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

    finally:
        cursor.close()
        conn.close()

