from pydantic import BaseModel, Field
from datetime import datetime, date

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