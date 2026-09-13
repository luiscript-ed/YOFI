from pydantic import BaseModel

class PerguntaMYA(BaseModel):
    pergunta: str
    contexto_financeiro: dict