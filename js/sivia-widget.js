(function() {
    // ================= CONFIGURACIÓN EXACTA =================
    
    // 1. URLs DE LOS BACKENDS
    const URL_SIVIA_CHAT = "https://sivia-backend.onrender.com/chat";
    const URL_VISTA_BASE = "https://sivia-backend-1.onrender.com"; 
    // Nota: A la de Vista le agregaremos /chat o /generate_art según corresponda en el código.

    // 2. RUTAS DE IMÁGENES (Carpeta images/)
    const IMG_SIVIA = "images/sivia recuadro derecho.png"; // Logo Sivia y Botón Principal
    const IMG_VISTA = "images/vista_logo.png";             // Logo Vista

    // VARIABLES DE ESTADO
    let currentMode = 'sivia'; // Por defecto
    let imageBase64 = null;    // Para subidas de imagen
    let thinkInterval;

    // ================= ESTILOS CSS =================
    const style = document.createElement('style');
    style.innerHTML = `
        @import url('https://fonts.googleapis.com/icon?family=Material+Icons+Round');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');

        /* Contenedor del Widget (Esquina inferior derecha) */
        #ai-widget-wrapper {
            font-family: 'Inter', sans-serif;
            position: fixed;
            bottom: 20px; right: 20px;
            z-index: 999999;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 10px;
        }

        /* Botón Flotante Principal */
        #ai-fab-btn {
            width: 65px; height: 65px;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 4px 25px rgba(0,0,0,0.4);
            border: 2px solid #38bdf8; /* Azul Sivia */
            overflow: hidden;
            background: #0f172a;
            transition: transform 0.2s;
        }
        #ai-fab-btn:hover { transform: scale(1.1); }
        #ai-fab-btn img { width: 100%; height: 100%; object-fit: cover; }

        /* Menú Desplegable (Sivia / Vista) */
        #ai-selector-menu {
            display: flex; flex-direction: column; gap: 8px;
            margin-bottom: 5px;
            opacity: 0; visibility: hidden;
            transform: translateY(20px);
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        #ai-selector-menu.active { opacity: 1; visibility: visible; transform: translateY(0); }

        .ai-option {
            background: rgba(15, 23, 42, 0.95);
            color: white;
            border: 1px solid rgba(255,255,255,0.2);
            padding: 10px 15px;
            border-radius: 12px;
            cursor: pointer;
            font-size: 14px; font-weight: 600;
            display: flex; align-items: center; justify-content: flex-end; gap: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            backdrop-filter: blur(5px);
            transition: 0.2s;
        }
        .ai-option:hover { background: #334155; transform: translateX(-5px); }
        .ai-option img { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; }

        /* Ventana de Chat */
        #ai-chat-window {
            position: fixed;
            bottom: 100px; right: 20px;
            width: 360px; height: 550px;
            max-height: 80vh;
            background: #0f172a; /* Fondo oscuro global */
            color: white;
            border-radius: 16px;
            box-shadow: 0 10px 50px rgba(0,0,0,0.5);
            display: none;
            flex-direction: column;
            border: 1px solid rgba(255,255,255,0.15);
            z-index: 999998;
            overflow: hidden;
        }
        #ai-chat-window.open { display: flex; }

        /* Cabecera Dinámica */
        .chat-header {
            padding: 15px;
            background: rgba(30, 41, 59, 0.8);
            border-bottom: 1px solid rgba(255,255,255,0.1);
            display: flex; justify-content: space-between; align-items: center;
        }
        .header-info { display: flex; align-items: center; gap: 10px; }
        .header-logo { width: 32px; height: 32px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.3); object-fit: cover; }
        .header-title { font-weight: 600; font-size: 16px; }

        /* Área de Mensajes */
        #chat-stream {
            flex: 1; padding: 15px; overflow-y: auto;
            display: flex; flex-direction: column; gap: 15px;
            background-image: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%);
        }
        
        .msg { max-width: 85%; padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.5; word-wrap: break-word; }
        .msg.user { background: #2563eb; align-self: flex-end; border-bottom-right-radius: 2px; }
        .msg.bot { background: #334155; align-self: flex-start; border-bottom-left-radius: 2px; border: 1px solid rgba(255,255,255,0.1); }
        
        .msg img, .msg video { max-width: 100%; border-radius: 8px; margin-top: 8px; display: block; border: 1px solid rgba(255,255,255,0.2); }

        /* Input y Controles */
        .input-zone {
            padding: 12px; background: rgba(15, 23, 42, 0.95);
            border-top: 1px solid rgba(255,255,255,0.1);
            display: flex; align-items: center; gap: 8px;
        }
        #chat-input {
            flex: 1; padding: 10px 15px;
            background: rgba(255,255,255,0.1); border: none;
            border-radius: 20px; color: white; outline: none;
        }
        .action-btn {
            background: none; border: none; color: #94a3b8; cursor: pointer;
            padding: 6px; border-radius: 50%; transition: 0.2s; display: flex;
        }
        .action-btn:hover { color: #38bdf8; background: rgba(255,255,255,0.1); }
        .action-btn.has-file { color: #4ade80; }

        /* Indicador de carga */
        #thinking-indicator {
            padding: 0 15px 10px 15px; font-size: 11px; color: #94a3b8; font-style: italic; display: none;
        }
    `;
    document.head.appendChild(style);

    // ================= HTML DEL WIDGET =================
    const widgetHTML = `
        <div id="ai-widget-wrapper">
            
            <div id="ai-selector-menu">
                <div class="ai-option" onclick="window.selectAI('sivia')">
                    Sivia AI
                    <img src="${IMG_SIVIA}" alt="S">
                </div>
                <div class="ai-option" onclick="window.selectAI('vista')">
                    Vista Engine
                    <img src="${IMG_VISTA}" alt="V">
                </div>
            </div>

            <div id="ai-fab-btn" onclick="window.toggleWidget()">
                <img src="${IMG_SIVIA}" alt="Chat">
            </div>

        </div>

        <div id="ai-chat-window">
            <div class="chat-header">
                <div class="header-info">
                    <img id="chat-header-img" class="header-logo" src="${IMG_SIVIA}">
                    <span id="chat-header-title" class="header-title">SIVIA Chat</span>
                </div>
                <span class="material-icons-round action-btn" onclick="window.closeChat()">close</span>
            </div>

            <div id="chat-stream">
                </div>
            
            <div id="thinking-indicator">Procesando...</div>

            <div class="input-zone">
                <label for="file-upload-input" class="action-btn" id="clip-btn">
                    <span class="material-icons-round">attach_file</span>
                </label>
                <input type="file" id="file-upload-input" accept="image/*" style="display:none">

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

    // 1. ABRIR / CERRAR MENÚ Y CHAT
    window.toggleWidget = function() {
        const chatWindow = document.getElementById('ai-chat-window');
        
        // Si el chat ya está abierto, lo cerramos
        if (chatWindow.style.display === 'flex') {
            window.closeChat();
        } else {
            // Si no, mostramos el menú para elegir IA
            const menu = document.getElementById('ai-selector-menu');
            menu.classList.toggle('active');
        }
    };

    window.closeChat = function() {
        document.getElementById('ai-chat-window').style.display = 'none';
        document.getElementById('ai-selector-menu').classList.remove('active');
    };

    // 2. SELECCIONAR IA (SIVIA O VISTA)
    window.selectAI = function(ai) {
        currentMode = ai;
        const chatWindow = document.getElementById('ai-chat-window');
        const headerImg = document.getElementById('chat-header-img');
        const headerTitle = document.getElementById('chat-header-title');
        const stream = document.getElementById('chat-stream');

        // Configurar la cabecera según selección
        if (ai === 'sivia') {
            headerImg.src = IMG_SIVIA;
            headerTitle.innerText = "SIVIA Chat";
            if (stream.innerHTML.trim() === "") addMsg("Hola, soy Sivia. ¿En qué puedo ayudarte?", "bot");
        } else {
            headerImg.src = IMG_VISTA;
            headerTitle.innerText = "Vista Engine";
            if (stream.innerHTML.trim() === "") addMsg("Soy Vista. Puedo crear imágenes y videos para ti.", "bot");
        }

        // Abrir ventana y cerrar menú
        document.getElementById('ai-selector-menu').classList.remove('active');
        chatWindow.style.display = 'flex';
    };

    // 3. MOSTRAR MENSAJES EN PANTALLA
    function addMsg(content, sender) {
        const stream = document.getElementById('chat-stream');
        const msgDiv = document.createElement('div');
        msgDiv.className = `msg ${sender}`;

        // Si es HTML (respuesta de Vista con img/video) o Texto
        if (content.includes('<') && content.includes('>')) {
            msgDiv.innerHTML = content;
        } else {
            // Formatear texto simple (links y negritas)
            let formatted = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                   .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" style="color:#38bdf8" target="_blank">$1</a>');
            msgDiv.innerHTML = formatted;
        }

        // Si el usuario envió una imagen, mostrarla
        if (sender === 'user' && imageBase64) {
            const img = document.createElement('img');
            img.src = "data:image/jpeg;base64," + imageBase64;
            msgDiv.appendChild(img);
        }

        stream.appendChild(msgDiv);
        stream.scrollTop = stream.scrollHeight;
    }

    // 4. MANEJO DE ARCHIVOS
    document.getElementById('file-upload-input').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(evt) {
                imageBase64 = evt.target.result.split(',')[1];
                document.getElementById('clip-btn').classList.add('has-file');
            };
            reader.readAsDataURL(file);
        }
    });

    // 5. ENVIAR MENSAJE (LÓGICA PRINCIPAL)
    window.handleSend = async function() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();

        if (!text && !imageBase64) return;

        // Mostrar mensaje usuario
        addMsg(text, 'user');
        input.value = '';
        
        // Guardar imagen temporalmente para enviar y limpiar input
        const imgToSend = imageBase64;
        imageBase64 = null;
        document.getElementById('clip-btn').classList.remove('has-file');
        document.getElementById('file-upload-input').value = '';

        // Mostrar indicador "Procesando..."
        const loader = document.getElementById('thinking-indicator');
        loader.style.display = 'block';

        try {
            let resultData;

            // ==================== MODO SIVIA ====================
            if (currentMode === 'sivia') {
                const response = await fetch(URL_SIVIA_CHAT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question: text, image: imgToSend })
                });
                const data = await response.json();
                resultData = data.answer; // Sivia devuelve "answer"
            } 
            
            // ==================== MODO VISTA ====================
            else if (currentMode === 'vista') {
                const lower = text.toLowerCase();
                let endpoint = '/chat';
                let bodyPayload = { message: text };

                // Detectar si pide generar arte (Video o Imagen)
                if (lower.includes('crea') || lower.includes('genera') || lower.includes('video') || lower.includes('imagen')) {
                    endpoint = '/generate_art';
                    let type = lower.includes('video') ? 'video' : 'image';
                    bodyPayload = { prompt: text, type: type };
                }

                const response = await fetch(URL_VISTA_BASE + endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bodyPayload)
                });
                const data = await response.json();
                
                // Vista puede devolver "result" (HTML visual) o "response" (texto)
                resultData = data.result || data.response || "Error en respuesta de Vista.";
            }

            loader.style.display = 'none';
            addMsg(resultData, 'bot');

        } catch (error) {
            loader.style.display = 'none';
            addMsg("⚠️ Error de conexión con el servidor.", 'bot');
            console.error(error);
        }
    };

    // Enviar con Enter
    document.getElementById('chat-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') window.handleSend();
    });

})();
