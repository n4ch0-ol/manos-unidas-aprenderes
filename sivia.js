document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatWindow = document.getElementById('chat-window');
    const sendButton = document.getElementById('send-button');

    // -----------------------------------------------------------------
    // ¡¡¡IMPORTANTE!!!
    // Esta URL es la "dirección" de tu Cocina. 
    // La conseguirás de Render en el siguiente paso.
    // -----------------------------------------------------------------
    const SIVIA_API_URL = "https://sivia-backend.onrender.com/chat"; 
    // -----------------------------------------------------------------

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        const userMessage = userInput.value.trim();
        if (userMessage === "") return; 

        addMessageToChat(userMessage, 'user-message');
        userInput.value = ""; 
        sendButton.disabled = true; 
        addMessageToChat("...", 'sivia-message', true); // "SIVIA está escribiendo..."

        try {
            // Esto es el "delivery": manda el pedido (pregunta) a la Cocina
            const response = await fetch(SIVIA_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: userMessage })
            });
            if (!response.ok) throw new Error("Error en la Cocina.");
            const data = await response.json();
            
            // Muestra la respuesta que cocinó SIVIA
            updateTypingMessage(data.answer); 

        } catch (error) {
            console.error('Error:', error);
            updateTypingMessage("Lo siento, no pude conectarme con el servidor. Intenta de nuevo.");
        } finally {
            sendButton.disabled = false; 
        }
    });

    function addMessageToChat(text, type, isTyping = false) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', type);
        if (isTyping) {
            messageElement.classList.add('typing-indicator');
            messageElement.innerHTML = `<p>SIVIA está escribiendo...</p>`;
        } else {
            messageElement.innerHTML = `<p>${text}</p>`;
        }
        chatWindow.appendChild(messageElement);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }
    
    function updateTypingMessage(text) {
        const typingMessage = document.querySelector('.typing-indicator');
        if (typingMessage) {
            typingMessage.innerHTML = `<p>${text}</p>`;
            typingMessage.classList.remove('typing-indicator');
        } else {
            addMessageToChat(text, 'sivia-message');
        }
    }

});
