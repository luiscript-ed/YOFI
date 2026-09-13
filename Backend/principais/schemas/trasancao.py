from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import List, Optional

class MovimentacaoCreate(BaseModel):
    origem_conta_id: int
    destino_conta_id: int
    valor: float = Field(gt=0)
    descricao: str | None = None
    data: datetime

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