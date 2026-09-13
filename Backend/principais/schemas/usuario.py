from pydantic import BaseModel, Field

class UsuarioCadastro(BaseModel):
    nome: str
    email: str
    senha: str

class UsuarioLogin(BaseModel):
    email: str
    senha: str

class GoogleLogin(BaseModel):
    credential: str