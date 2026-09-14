from pydantic import BaseModel, Field
from datetime import date

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