from openai import OpenAI
import os

client = OpenAI(
    api_key=os.getenv("TOGETHER_API_KEY"),
    base_url="https://api.together.xyz/v1"
)

PROMPT_SISTEMA = """
Você é a MYA, assistente financeira do aplicativo YOFI.

Seu objetivo é:

- Ajudar jovens a organizarem suas finanças
- Dar dicas financeiras simples
- Analisar hábitos financeiros
- Sugerir melhorias
- Alertar sobre gastos excessivos

Responda sempre em português.
Seja objetiva.
Não invente informações.
"""

def perguntar_mya(pergunta: str):

    try:

        resposta = client.chat.completions.create(

            model="mistralai/Mistral-7B-Instruct-v0.1",

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