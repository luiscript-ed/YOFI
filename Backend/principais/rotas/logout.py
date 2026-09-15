from fastapi import APIRouter, Response

router = APIRouter(
    tags=["Logout"]
)

@router.post("/logout")
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
