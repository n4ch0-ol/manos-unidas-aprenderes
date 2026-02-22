(function() {
    // ================= CONFIGURACIÓN EXACTA =================
    
    // 1. URL DEL BACKEND (Solo Sivia)
    const URL_SIVIA_CHAT = "https://sivia-backend.onrender.com/chat";

    // 2. RUTA DE IMAGEN (Asegúrate de que exista en tu carpeta images/)
    const IMG_SIVIA = "images/sivia recuadro derecho.png"; 

    // ================= ESTILOS CSS =================
    const style = document.createElement('style');
    style.innerHTML = `
        @import url('https://fonts.googleapis.com/icon?family=Material+Icons+Round');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');

        /* Contenedor del Widget */
        #ai-widget-wrapper {
            font-family: 'Inter', sans-serif;
            position: fixed; bottom: 20px; right: 20px;
            z-index: 999999; display: flex; flex-direction: column;
            align-items: flex-end; gap: 10px;
        }

        /* Botón Flotante */
        #ai-fab-btn {
            width: 65px; height: 65px; border-radius: 50%;
            cursor: pointer; box-shadow: 0 4px 25px rgba(0,0,0,0.4);
            border: 2px solid #38bdf8; overflow: hidden;
            background: #0f172a; transition: transform 0.2s;
        }
        #ai-fab-btn:hover { transform: scale(1.1); }
        #ai-fab-btn img { width: 100%; height: 100%; object-fit: cover; }

        /* Ventana de Chat */
        #ai-chat-window {
            position: fixed; bottom: 100px; right: 20px;
            width: 360px; height: 550px; max-height: 80vh;
            background: #0f172a; color: white; border-radius: 16px;
            box-shadow: 0 10px 50px rgba(0,0,0,0.5); display: none;
            flex-direction: column; border: 1px solid rgba(255,255,255,0.15);
            z-index: 999998; overflow: hidden;
        }

        /* Cabecera */
        .chat-header {
            padding: 15px; background: rgba(30, 41, 59, 0.8);
            border-bottom: 1px solid rgba(255,255,255,0.1);
            display: flex; justify-content: space-between; align-items: center;
        }
        .header-info { display: flex; align-items: center; gap: 10px; }
        .header-logo { width: 32px; height: 32px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.3); object-fit: cover; }
        .header-title { font-weight: 600; font-size: 16px; }

        /* Mensajes */
        #chat-stream {
            flex: 1; padding: 15px; overflow-y: auto;
            display: flex; flex-direction: column; gap: 15px;
            background-image: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%);
        }
        .msg { max-width: 85%; padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.5; word-wrap: break-word; }
        .msg.user { background: #2563eb; align-self: flex-end; border-bottom-right-radius: 2px; }
        .msg.bot { background: #334155; align-self: flex-start; border-bottom-left-radius: 2px; border: 1px solid rgba(255,255,255,0.1); }
        
        /* Input */
        .input-zone {
            padding: 12px; background: rgba(15, 23, 42, 0.95);
            border-top: 1px solid rgba(255,255,255,0.1);
            display: flex; align-items: center; gap: 8px;
        }
        #chat-input {
            flex: 1; padding: 10px 15px; background: rgba(255,255,255,0.1);
            border: none; border-radius: 20px; color: white; outline: none;
        }
        .action-btn {
            background: none; border: none; color: #94a3b8; cursor: pointer;
            padding: 6px; border-radius: 50%; transition: 0.2s; display: flex;
        }
        .action-btn:hover { color: #38bdf8; background: rgba(255,255,255,0.1); }

        #thinking-indicator {
            padding: 0 15px 10px 15px; font-size: 11px; color: #94a3b8; font-style: italic; display: none;
        }
    `;
    document.head.appendChild(style);

    // ================= HTML DEL WIDGET =================
    const widgetHTML = `
        <div id="ai-widget-wrapper">
            <div id="ai-fab-btn" onclick="window.toggleWidget()">
                <img src="${IMG_SIVIA}" alt="Chat">
            </div>
        </div>

        <div id="ai-chat-window">
            <div class="chat-header">
                <div class="header-info">
                    <img class="header-logo" src="${IMG_SIVIA}">
                    <span class="header-title">SIVIA Chat</span>
                </div>
                <span class="material-icons-round action-btn" onclick="window.closeChat()">close</span>
            </div>

            <div id="chat-stream"></div>
            
            <div id="thinking-indicator">Procesando...</div>

            <div class="input-zone">
                <input type="text" id="chat-input" placeholder="Escribe un mensaje..." autocomplete="off">
                <button class="action-btn" onclick="window.handleSend()">
                    <span class="material-icons-round">send</span>
                </button>
            </div>
        </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = widgetHTML;
    document.body.appendChild(div);

    // ================= LÓGICA JAVASCRIPT =================

    window.toggleWidget = function() {
        const chatWindow = document.getElementById('ai-chat-window');
        if (chatWindow.style.display === 'flex') {
            window.closeChat();
        } else {
            chatWindow.style.display = 'flex';
            // Mensaje de bienvenida si el chat está vacío
            const stream = document.getElementById('chat-stream');
            if (stream.innerHTML.trim() === "") {
                addMsg("Hola, soy Sivia. ¿En qué puedo ayudarte?", "bot");
            }
        }
    };

    window.closeChat = function() {
        document.getElementById('ai-chat-window').style.display = 'none';
    };

    function addMsg(content, sender) {
        const stream = document.getElementById('chat-stream');
        const msgDiv = document.createElement('div');
        msgDiv.className = \`msg \${sender}\`;

        if (content.includes('<') && content.includes('>')) {
            msgDiv.innerHTML = content;
        } else {
            let formatted = content.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')
                                   .replace(/(https?:\\/\\/[^\\s]+)/g, '<a href="$1" style="color:#38bdf8" target="_blank">$1</a>');
            msgDiv.innerHTML = formatted;
        }

        stream.appendChild(msgDiv);
        stream.scrollTop = stream.scrollHeight;
    }

    // ================= FUNCIÓN DE ENVÍO =================
    window.handleSend = async function() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();

        if (!text) return;

        addMsg(text, 'user');
        input.value = '';

        const loader = document.getElementById('thinking-indicator');
        loader.style.display = 'block';

        try {
            const response = await fetch(URL_SIVIA_CHAT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: text }) // Solo enviamos texto
            });
            
            const data = await response.json();
            loader.style.display = 'none';
            addMsg(data.answer || "No entendí eso.", 'bot');

        } catch (error) {
            loader.style.display = 'none';
            addMsg("⚠️ Error de conexión con el servidor. Revisa la consola (F12).", 'bot');
            console.error("ERROR DETALLADO:", error);
        }
    };

    document.getElementById('chat-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') window.handleSend();
    });

})();
