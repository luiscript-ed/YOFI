from pydantic import BaseModel

class ContaCreate(BaseModel):
    nome: str
    tipo: str
    saldo_inicial: float = 0


class ContaUpdate(BaseModel):
    nome: str
    tipo: str
    saldo_inicial: float
    ativo: bool