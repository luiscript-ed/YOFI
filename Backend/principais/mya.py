from flask import Flask, request, jsonify
import openai
import os

app = Flask(__name__)

openai.api_key = os.getenv("TOGETHER_API_KEY")
openai.api_base = "https://api.together.xyz/v1"

mensagem_inicial = {
    "role": "system",
    "content": "Você é a MYA, assistente financeira do app YOFI. Responda de forma clara, jovem e útil. Seu objetivo é organizar os dados financeiros do usuário, dando dicas de investimentos e etc "
}

def chatbot_financeiro(pergunta):
    try:
        resposta = openai.ChatCompletion.create(
            model="mistralai/Mistral-7B-Instruct-v0.1",
            messages=[
                mensagem_inicial,
                {"role": "user", "content": pergunta}
            ],
            temperature=0.7,
            max_tokens=500
        )
        return resposta.choices[0].message["content"]
    except Exception as e:
        return f"Erro ao obter resposta: {str(e)}"

@app.route('/chatbot', methods=['POST'])
def chatbot():
    data = request.json
    pergunta = data.get("pergunta", "")

    if not pergunta:
        return jsonify({"erro": "Nenhum dado foi enviada"}), 400

    resposta = chatbot_financeiro(pergunta)
    return jsonify({"resposta": resposta})

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=10000)