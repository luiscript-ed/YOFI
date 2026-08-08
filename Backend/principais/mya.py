from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)

PROMPT_SISTEMA = """
Você é a MYA, assistente financeira do aplicativo YOFI.

Seu objetivo é:

- Ajudar jovens e pequenos comerciantes a controlar gastos
- Analisar hábitos financeiros
- Identificar excessos
- Dar dicas práticas
- Incentivar educação financeira
- Achar gastos desnecessarios e pontos de melhoria
- Sugerir formas de economizar
- Dizer quem é a YOFI, empresa gestora do projeto ainda tutorada por estudantes com objetivo de melhorar a eficacia brasileira no ambito financeiro
- Criar otimas respostas, bem estruturadas com uma leitura limpa, agradavel e funcional. (Evitando tanto topicos sem fim e tetos enormes)

Responda sempre em português.
"""

def perguntar_mya(pergunta: str):

    try:

        resposta = client.chat.completions.create(

            model="google/gemma-3-12b-it",

            messages=[
                {
                    "role": "system",
                    "content": PROMPT_SISTEMA
                },
                {
                    "role": "user",
                    "content": pergunta
                }
            ],

            temperature=0.7,
            max_tokens=500

        )

        return resposta.choices[0].message.content

    except Exception as e:

        return f"Erro MYA: {str(e)}"
