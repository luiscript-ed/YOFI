from pydantic import BaseModel
from typing import List, Optional

class HistoricoImportacaoCreate(BaseModel):
    nome_arquivo: str
    formato: str
    quantidade_registros: int = 0
    quantidade_importada: int = 0
    quantidade_ignorados: int = 0
    status: str = "concluida"
    mensagem: Optional[str] = None


class HistoricoExportacaoCreate(BaseModel):
    formato: str
    dados_exportados: List[str]
    quantidade_registros: int = 0