from fastapi import APIRouter, HTTPException

from principais.banco import conectar
from principais.schemas.usuario import CadastroUsuario
from principais.utils.seguranca import gerar_hash_senha


router = APIRouter(
    prefix="/cadastro",
    tags=["Cadastro"]
)


@router.post("/")
def cadastrar_usuario(dados: CadastroUsuario):

    conexao = conectar()
    cursor = conexao.cursor()

    try:
        # Verifica se o e-mail já existe
        cursor.execute(
            """
            SELECT id
            FROM usuarios
            WHERE email = %s
            """,
            (dados.email,)
        )

        usuario_existente = cursor.fetchone()

        if usuario_existente:
            raise HTTPException(
                status_code=409,
                detail="Este e-mail já está cadastrado."
            )

        # Cria o hash da senha
        senha_hash = gerar_hash_senha(dados.senha)

        # Insere o usuário
        cursor.execute(
            """
            INSERT INTO usuarios
                (nome, email, senha, provedor)
            VALUES
                (%s, %s, %s, %s)
            RETURNING id, nome, email, provedor
            """,
            (
                dados.nome,
                dados.email,
                senha_hash,
                "local"
            )
        )

        usuario = cursor.fetchone()

        conexao.commit()

        return {
            "mensagem": "Usuário cadastrado com sucesso.",
            "usuario": {
                "id": usuario[0],
                "nome": usuario[1],
                "email": usuario[2],
                "provedor": usuario[3]
            }
        }
    except psycopg2.IntegrityError:
        
        conexao.rollback()
        
        raise HTTPException(
            status_code=400,
            detail="Este e-mail já está cadastrado."
        )
    
    except HTTPException:
        conexao.rollback()
        raise

    except Exception as erro:
        conexao.rollback()

        print(f"Erro ao cadastrar usuário: {erro}")

        raise HTTPException(
            status_code=500,
            detail="Erro interno ao realizar cadastro."
        )

    finally:
        cursor.close()
        conexao.close()