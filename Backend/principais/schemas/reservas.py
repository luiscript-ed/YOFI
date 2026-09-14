from datetime import datetime
from pydantic import BaseModel, Field

class TransacaoReservadaCreate(BaseModel):
    conta_id: int | None = None
    cartao_id: int | None = None
    tipo: str
    categoria: str
    valor: float = Field(gt=0)
    descricao: str | None = None
    data: datetime