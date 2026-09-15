from fastapi import Request, APIRouter

from principais.banco import conectar
from principais.schemas.historico import HistoricoExportacaoCreate, HistoricoImportacaoCreate
from principais.utils.autenticacao import obter_usuario_autenticado

router = APIRouter(
    prefix="/historico",
    tags=["Historico"]
)

@router.post("/importacoes")
def criar_historico_importacao(
    dados: HistoricoImportacaoCreate,
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)
    conn = conectar()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            INSERT INTO historico_importacoes
            (
                usuario_id,
                nome_arquivo,
                formato,
                quantidade_registros,
                quantidade_importada,
                quantidade_ignorados,
                status,
                mensagem
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, criado_em
            """,
            (
                usuario_id,
                dados.nome_arquivo,
                dados.formato,
                dados.quantidade_registros,
                dados.quantidade_importada,
                dados.quantidade_ignorados,
                dados.status,
                dados.mensagem
            )
        )

        resultado = cursor.fetchone()
        conn.commit()

        return {
            "id": resultado[0],
            "nome_arquivo": dados.nome_arquivo,
            "formato": dados.formato,
            "quantidade_registros": dados.quantidade_registros,
            "quantidade_importada": dados.quantidade_importada,
            "quantidade_ignorados": dados.quantidade_ignorados,
            "status": dados.status,
            "mensagem": dados.mensagem,
            "criado_em": resultado[1]
        }

    except Exception:
        conn.rollback()
        raise

    finally:
        cursor.close()
        conn.close()


@router.get("/importacoes")
def listar_historico_importacoes(
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)
    conn = conectar()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT
                id,
                nome_arquivo,
                formato,
                quantidade_registros,
                quantidade_importada,
                quantidade_ignorados,
                status,
                mensagem,
                criado_em
            FROM historico_importacoes
            WHERE usuario_id = %s
            ORDER BY criado_em DESC
            """,
            (usuario_id,)
        )

        return [
            {
                "id": r[0],
                "nome_arquivo": r[1],
                "formato": r[2],
                "quantidade_registros": r[3],
                "quantidade_importada": r[4],
                "quantidade_ignorados": r[5],
                "status": r[6],
                "mensagem": r[7],
                "criado_em": r[8]
            }
            for r in cursor.fetchall()
        ]

    finally:
        cursor.close()
        conn.close()


@router.post("/exportacoes")
def criar_historico_exportacao(
    dados: HistoricoExportacaoCreate,
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)
    conn = conectar()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            INSERT INTO historico_exportacoes
            (
                usuario_id,
                formato,
                dados_exportados,
                quantidade_registros
            )
            VALUES (%s, %s, %s, %s)
            RETURNING id, criado_em
            """,
            (
                usuario_id,
                dados.formato,
                dados.dados_exportados,
                dados.quantidade_registros
            )
        )

        resultado = cursor.fetchone()
        conn.commit()

        return {
            "id": resultado[0],
            "formato": dados.formato,
            "dados_exportados": dados.dados_exportados,
            "quantidade_registros": dados.quantidade_registros,
            "criado_em": resultado[1]
        }

    except Exception:
        conn.rollback()
        raise

    finally:
        cursor.close()
        conn.close()


@router.get("/exportacoes")
def listar_historico_exportacoes(
    request: Request
    ):

    usuario_id = obter_usuario_autenticado(request)
    conn = conectar()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT
                id,
                formato,
                dados_exportados,
                quantidade_registros,
                criado_em
            FROM historico_exportacoes
            WHERE usuario_id = %s
            ORDER BY criado_em DESC
            """,
            (usuario_id,)
        )

        return [
            {
                "id": r[0],
                "formato": r[1],
                "dados_exportados": r[2],
                "quantidade_registros": r[3],
                "criado_em": r[4]
            }
            for r in cursor.fetchall()
        ]

    finally:
        cursor.close()
        conn.close()
