from fastapi import APIRouter, Response

router = APIRouter(
    prefix="/logout",
    tags=["Logout"]
)

@router.post("/")
def logout(response: Response):

    response.delete_cookie(
        key="access_token",
        path="/",
        secure=True,
        httponly=True,
        samesite="none"
    )

    return {
        "mensagem": "Logout realizado com sucesso!"
    }
