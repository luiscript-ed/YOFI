from pydantic import BaseModel, Field

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