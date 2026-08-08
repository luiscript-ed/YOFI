const chatContainer = document.getElementById('chatContainer');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');

const API_URL = "https://yofi-api.onrender.com/mya";

function appendMessage(text, role) {

    const messageDiv = document.createElement('div');

    messageDiv.classList.add('message-bubble');

    if(role === 'user'){
        messageDiv.classList.add('user-message');
    }
    else if(role === 'bot'){
        messageDiv.classList.add('bot-message');
    }
    else{
        messageDiv.classList.add('error-message');
    }

    messageDiv.textContent = text;

    chatContainer.appendChild(messageDiv);

    chatContainer.scrollTop = chatContainer.scrollHeight;
}

chatForm.addEventListener('submit', async (e) => {

    e.preventDefault();

    const message = userInput.value.trim();

    if(!message) return;

    appendMessage(message, 'user');

    userInput.value = '';

    const loadingMessage = document.createElement('div');

    loadingMessage.classList.add(
        'message-bubble',
        'bot-message'
    );

    loadingMessage.textContent = "MYA está analisando...";

    chatContainer.appendChild(loadingMessage);

    try{

        const response = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                pergunta: message
            })

        });

        loadingMessage.remove();

        if(!response.ok){

            throw new Error(
                `Erro ${response.status}`
            );

        }

        const data = await response.json();

        appendMessage(
            data.resposta,
            'bot'
        );

    }
    catch(error){

        loadingMessage.remove();

        appendMessage(
            `Erro: ${error.message}`,
            'error'
        );

    }

});