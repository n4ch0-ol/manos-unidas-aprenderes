// ============================================
// SIVIA FLOTANTE - Componente Reutilizable
// ============================================

const SIVIA_API_URL = "https://sivia-backend.onrender.com/chat";

document.addEventListener('DOMContentLoaded', () => {
    // CSS para la ventana flotante
    const style = document.createElement('style');
    style.textContent = `
        .sivia-btn-float {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            background-image: url('images/sivia recuadro derecho.png');
            background-size: cover;
            background-position: center;
            border-radius: 50%;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(0, 240, 255, 0.5);
            z-index: 9998;
            transition: all 0.3s;
            animation: pulseBtn 2s infinite;
        }

        @keyframes pulseBtn {
            0%, 100% { box-shadow: 0 4px 20px rgba(0, 240, 255, 0.5); }
            50% { box-shadow: 0 4px 30px rgba(255, 0, 255, 0.7); }
        }

        .sivia-btn-float:hover {
            transform: scale(1.1);
        }

        .sivia-window {
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: 380px;
            height: 500px;
            background: rgba(26, 26, 46, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            border: 1px solid rgba(0, 240, 255, 0.3);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
            display: none;
            flex-direction: column;
            z-index: 9999;
            animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .sivia-window.active {
            display: flex;
        }

        .sivia-window-header {
            padding: 1rem;
            background: linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(255, 0, 255, 0.2));
            border-radius: 20px 20px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .sivia-window-header h3 {
            color: white;
            margin: 0;
            font-size: 1.2rem;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .sivia-logo-header {
            width: 30px;
            height: 30px;
            border-radius: 50%;
        }

        .sivia-close {
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            opacity: 0.7;
            transition: opacity 0.3s;
        }

        .sivia-close:hover {
            opacity: 1;
        }

        .sivia-messages {
            flex: 1;
            overflow-y: auto;
            padding: 1rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .sivia-messages::-webkit-scrollbar {
            width: 6px;
        }

        .sivia-messages::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.2);
        }

        .sivia-messages::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #00f0ff, #ff00ff);
            border-radius: 10px;
        }

        .sivia-msg {
            display: flex;
            gap: 0.8rem;
            animation: msgSlide 0.3s ease-out;
        }

        @keyframes msgSlide {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .sivia-msg.user {
            flex-direction: row-reverse;
        }

        .sivia-avatar {
            width: 35px;
            height: 35px;
            border-radius: 50%;
            flex-shrink: 0;
            background-size: cover;
            background-position: center;
        }

        .sivia-avatar.sivia-icon {
            background-image: url('images/sivia recuadro derecho.png');
        }

        .sivia-avatar.user-icon {
            background: linear-gradient(135deg, #ff00ff, #00f0ff);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
        }

        .sivia-msg-content {
            background: rgba(0, 240, 255, 0.1);
            padding: 0.8rem;
            border-radius: 12px;
            max-width: 75%;
            border: 1px solid rgba(0, 240, 255, 0.2);
        }

        .sivia-msg.user .sivia-msg-content {
            background: rgba(255, 0, 255, 0.1);
            border-color: rgba(255, 0, 255, 0.2);
        }

        .sivia-msg-content p {
            margin: 0;
            color: white;
            font-size: 0.9rem;
            line-height: 1.4;
        }

        .sivia-typing {
            display: none;
            gap: 0.3rem;
            padding: 0.8rem;
            background: rgba(0, 240, 255, 0.1);
            border-radius: 12px;
            width: fit-content;
        }

        .sivia-typing.active {
            display: flex;
        }

        .sivia-typing span {
            width: 6px;
            height: 6px;
            background: #00f0ff;
            border-radius: 50%;
            animation: typingBounce 1.4s infinite;
        }

        .sivia-typing span:nth-child(2) { animation-delay: 0.2s; }
        .sivia-typing span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typingBounce {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-8px); }
        }

        .sivia-input-container {
            padding: 1rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(0, 0, 0, 0.2);
        }

        .sivia-input-form {
            display: flex;
            gap: 0.5rem;
        }

        .sivia-input {
            flex: 1;
            padding: 0.7rem;
            border-radius: 10px;
            border: 1px solid rgba(0, 240, 255, 0.3);
            background: rgba(255, 255, 255, 0.05);
            color: white;
            font-size: 0.9rem;
        }

        .sivia-input::placeholder {
            color: rgba(255, 255, 255, 0.4);
        }

        .sivia-send {
            padding: 0.7rem 1.2rem;
            border-radius: 10px;
            border: none;
            background: linear-gradient(135deg, #00f0ff, #ff00ff);
            color: white;
            cursor: pointer;
            font-weight: bold;
            transition: transform 0.3s;
        }

        .sivia-send:hover {
            transform: scale(1.05);
        }

        @media (max-width: 768px) {
            .sivia-window {
                width: calc(100% - 40px);
                height: 60vh;
                left: 20px;
                right: 20px;
                bottom: 90px;
            }
        }
    `;
    document.head.appendChild(style);

    // HTML del componente
    const html = `
        <button class="sivia-btn-float" id="siviaBtn"></button>
        
        <div class="sivia-window" id="siviaWindow">
            <div class="sivia-window-header">
                <h3><img src="images/sivia recuadro derecho.png" class="sivia-logo-header" alt="SIVIA"> SIVIA</h3>
                <button class="sivia-close" id="siviaClose">×</button>
            </div>
            
            <div class="sivia-messages" id="siviaMessages">
                <div class="sivia-msg">
                    <div class="sivia-avatar sivia-icon"></div>
                    <div class="sivia-msg-content">
                        <p>¡Hola! Soy SIVIA, tu asistente de Manos Unidas. ¿En qué puedo ayudarte?</p>
                    </div>
                </div>
            </div>
            
            <div class="sivia-typing" id="siviaTyping">
                <div class="sivia-avatar sivia-icon"></div>
                <div style="display: flex; gap: 0.3rem;">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
            
            <div class="sivia-input-container">
                <form class="sivia-input-form" id="siviaForm">
                    <input type="text" class="sivia-input" id="siviaInput" placeholder="Escribe tu pregunta..." autocomplete="off">
                    <button type="submit" class="sivia-send">Enviar</button>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);

    // Funcionalidad
    const btn = document.getElementById('siviaBtn');
    const window = document.getElementById('siviaWindow');
    const closeBtn = document.getElementById('siviaClose');
    const form = document.getElementById('siviaForm');
    const input = document.getElementById('siviaInput');
    const messages = document.getElementById('siviaMessages');
    const typing = document.getElementById('siviaTyping');

    btn.addEventListener('click', () => {
        window.classList.add('active');
    });

    closeBtn.addEventListener('click', () => {
        window.classList.remove('active');
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const question = input.value.trim();
        if (!question) return;

        // Mensaje del usuario
        addMessage(question, true);
        input.value = '';

        // Mostrar typing
        typing.classList.add('active');

        try {
            const response = await fetch(SIVIA_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question })
            });

            const data = await response.json();
            typing.classList.remove('active');
            addMessage(data.answer || 'Lo siento, tuve un problema.', false);
        } catch (error) {
            typing.classList.remove('active');
            addMessage('Error de conexión. Verifica que el backend esté activo.', false);
            console.error('Error:', error);
        }
    });

    function addMessage(text, isUser) {
        const msg = document.createElement('div');
        msg.className = `sivia-msg ${isUser ? 'user' : ''}`;
        
        if (isUser) {
            msg.innerHTML = `
                <div class="sivia-avatar user-icon">U</div>
                <div class="sivia-msg-content">
                    <p>${text}</p>
                </div>
            `;
        } else {
            msg.innerHTML = `
                <div class="sivia-avatar sivia-icon"></div>
                <div class="sivia-msg-content">
                    <p>${text}</p>
                </div>
            `;
        }
        
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
    }

    // Atajo de teclado Ctrl+K
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if (window.classList.contains('active')) {
                closeBtn.click();
            } else {
                btn.click();
            }
        }
    });
});
