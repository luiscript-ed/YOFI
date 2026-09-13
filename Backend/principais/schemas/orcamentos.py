from pydantic import BaseModel, Field

class OrcamentoCreate(BaseModel):
    categoria: str
    mes: int = Field(ge=1, le=12)
    ano: int = Field(ge=2000)
    limite: float = Field(gt=0)


class OrcamentoUpdate(BaseModel):
    categoria: str
    mes: int = Field(ge=1, le=12)
    ano: int = Field(ge=2000)
    limite: float = Field(gt=0)