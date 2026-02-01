(function() {
    // ================= CONFIGURACIÓN =================
    const BACKEND_URL = "https://sivia-backend.onrender.com/chat";
    
    // RUTA DE LA IMAGEN (Relativa al archivo HTML donde se usa el script)
    const LOGO_PATH = "images/sivia recuadro derecho.png"; 

    const thinkingSteps = [
        "🔍 Buscando en la web...",
        "📂 Consultando base de datos...",
        "🧠 Analizando contexto...",
        "✨ Redactando respuesta...",
        "🖼️ Procesando visuales..."
    ];

    // ================= ESTILOS CSS =================
    const style = document.createElement('style');
    style.innerHTML = `
        @import url('https://fonts.googleapis.com/icon?family=Material+Icons+Round');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');

        /* Contenedor Principal */
        #sivia-widget-container {
            font-family: 'Inter', sans-serif;
            position: fixed;
            bottom: 20px; right: 20px;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
        }

        /* --- BOTÓN FLOTANTE (LAUNCHER) --- */
        #sivia-launcher {
            width: 70px;  
            height: 70px;
            background: white; /* Fondo blanco por si la imagen tiene transparencia */
            border-radius: 50%;
            box-shadow: 0 4px 25px rgba(0,0,0,0.4);
            cursor: pointer;
            overflow: hidden; /* Recorta la imagen en círculo */
            transition: transform 0.3s ease;
            border: 2px solid #2563eb; /* Borde azul estético */
            display: flex;
            align-items: center;
            justify-content: center;
        }
        #sivia-launcher:hover { transform: scale(1.1); }
        
        /* La imagen dentro del botón */
        #sivia-launcher img {
            width: 100%;
            height: 100%;
            object-fit: cover; /* Asegura que cubra todo el círculo */
            display: block;
        }

        /* --- VENTANA DEL CHAT --- */
        #sivia-window {
            position: fixed;
            bottom: 100px; right: 20px;
            width: 380px; height: 600px;
            max-height: 80vh;
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 20px;
            display: none;
            flex-direction: column;
            box-shadow: 0 10px 50px rgba(0,0,0,0.5);
            opacity: 0; transform: translateY(20px);
            transition: opacity 0.3s, transform 0.3s;
        }
        #sivia-window.open { display: flex; opacity: 1; transform: translateY(0); }
        
        /* Cabecera */
        .sivia-header {
            padding: 15px;
            background: rgba(255,255,255,0.05);
            border-bottom: 1px solid rgba(255,255,255,0.1);
            display: flex; justify-content: space-between; align-items: center;
            color: white;
        }
        .sivia-brand { display: flex; align-items: center; gap: 12px; font-weight: 600; font-size: 16px; }
        
        /* Logo en la cabecera */
        .sivia-brand img { 
            height: 35px; 
            width: 35px; 
            object-fit: cover; 
            border-radius: 50%; 
            border: 1px solid rgba(255,255,255,0.2);
        }

        /* Mensajes */
        #sivia-messages {
            flex: 1; padding: 20px; overflow-y: auto;
            display: flex; flex-direction: column; gap: 15px;
        }
        .sivia-msg {
            max-width: 85%; padding: 12px 16px; border-radius: 12px;
            font-size: 14px; color: #f1f5f9; word-wrap: break-word; line-height: 1.5;
        }
        .sivia-msg.bot { background: #334155; align-self: flex-start; border-bottom-left-radius: 2px; }
        .sivia-msg.user { background: #2563eb; align-self: flex-end; border-bottom-right-radius: 2px; }
        .sivia-msg img { max-width: 100%; border-radius: 8px; margin-top: 5px; }
        .sivia-msg a { color: #38bdf8; text-decoration: none; border-bottom: 1px dotted; }

        /* Animación Pensando */
        #sivia-thinking {
            display: none; align-items: center; gap: 10px;
            background: rgba(30, 41, 59, 0.6);
            padding: 8px 15px; border-radius: 20px;
            margin: 0 20px 10px 20px; width: fit-content;
        }
        #sivia-thinking.active { display: flex; }
        .thinking-spinner { 
            width: 15px; height: 15px; border: 2px solid #38bdf8; 
            border-top-color: transparent; border-radius: 50%; animation: spin 1s infinite linear; 
        }
        .thinking-text { font-size: 12px; color: #cbd5e1; font-style: italic; }

        /* Input */
        .sivia-input-area {
            padding: 15px; background: rgba(0,0,0,0.3);
            border-top: 1px solid rgba(255,255,255,0.1);
            display: flex; align-items: center; gap: 10px;
        }
        #sivia-text-input {
            flex: 1; background: rgba(255,255,255,0.1); border: none;
            padding: 12px; border-radius: 25px; color: white; outline: none;
        }
        .sivia-clip { color: #94a3b8; cursor: pointer; padding: 5px; transition: 0.3s; }
        .sivia-clip:hover { color: white; }
        .sivia-clip.has-file { color: #4ade80; }
        #sivia-send-btn { background: none; border: none; color: #38bdf8; cursor: pointer; transition: 0.2s; }
        #sivia-send-btn:hover { transform: scale(1.1); }
        
        @keyframes spin { 100% { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);

    // ================= HTML GENERADO =================
    const widgetHTML = `
        <div id="sivia-widget-container">
            <div id="sivia-window">
                <div class="sivia-header">
                    <div class="sivia-brand">
                        <img src="${LOGO_PATH}" alt="Logo" onerror="this.style.display='none'">
                        <span>SIVIA AI</span>
                    </div>
                    <span class="material-icons-round" style="cursor:pointer; color:white;" onclick="window.toggleSivia()">close</span>
                </div>

                <div id="sivia-messages">
                    <div class="sivia-msg bot">👋 Hola, soy SIVIA. ¿En qué te ayudo?</div>
                </div>

                <div id="sivia-thinking">
                    <div class="thinking-spinner"></div>
                    <span class="thinking-text" id="thinking-status">Analizando...</span>
                </div>

                <div class="sivia-input-area">
                    <label for="sivia-file-input" class="sivia-clip" id="sivia-clip-icon">
                        <span class="material-icons-round">attach_file</span>
                    </label>
                    <input type="file" id="sivia-file-input" accept="image/*" style="display:none">
                    
                    <input type="text" id="sivia-text-input" placeholder="Escribe aquí..." autocomplete="off">
                    
                    <button id="sivia-send-btn"><span class="material-icons-round">send</span></button>
                </div>
            </div>

            <div id="sivia-launcher" onclick="window.toggleSivia()">
                <img src="${LOGO_PATH}" alt="SIVIA Chat" onerror="this.parentElement.innerHTML='<span class=\'material-icons-round\'>warning</span>'">
            </div>
        </div>
    `;

    // Inyectar
    const divContainer = document.createElement('div');
    divContainer.innerHTML = widgetHTML;
    document.body.appendChild(divContainer);

    // ================= LÓGICA =================
    let imageBase64 = null;
    let thinkInterval;

    window.toggleSivia = function() {
        const win = document.getElementById('sivia-window');
        const launcher = document.getElementById('sivia-launcher');
        
        if (win.classList.contains('open')) {
            win.classList.remove('open');
            setTimeout(() => { win.style.display = 'none'; launcher.style.display = 'flex'; }, 300);
        } else {
            win.style.display = 'flex';
            setTimeout(() => win.classList.add('open'), 10);
            launcher.style.display = 'none';
        }
    };

    document.getElementById('sivia-file-input').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imageBase64 = e.target.result.split(',')[1];
                document.getElementById('sivia-clip-icon').classList.add('has-file');
            };
            reader.readAsDataURL(file);
        }
    });

    function startThinking() {
        document.getElementById('sivia-thinking').classList.add('active');
        const text = document.getElementById('thinking-status');
        let i = 0;
        text.innerText = thinkingSteps[0];
        thinkInterval = setInterval(() => {
            i = (i + 1) % thinkingSteps.length;
            text.innerText = thinkingSteps[i];
        }, 1500);
    }

    function stopThinking() {
        clearInterval(thinkInterval);
        document.getElementById('sivia-thinking').classList.remove('active');
    }

    function appendMsg(text, sender, img = null) {
        const container = document.getElementById('sivia-messages');
        const div = document.createElement('div');
        div.className = `sivia-msg ${sender}`;
        
        if (sender === 'bot') {
            let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                           .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
            div.innerHTML = html;
        } else { div.textContent = text; }

        if (img && sender === 'user') {
            const image = document.createElement('img');
            image.src = `data:image/jpeg;base64,${img}`;
            div.appendChild(image);
        }
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    async function send() {
        const input = document.getElementById('sivia-text-input');
        const text = input.value.trim();
        if (!text && !imageBase64) return;

        appendMsg(text, 'user', imageBase64);
        input.value = '';
        document.getElementById('sivia-clip-icon').classList.remove('has-file');
        document.getElementById('sivia-file-input').value = '';
        
        startThinking();
        try {
            const res = await fetch(BACKEND_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: text, image: imageBase64 })
            });
            const data = await res.json();
            stopThinking();
            appendMsg(data.answer, 'bot');
        } catch (err) {
            stopThinking();
            appendMsg("⚠️ Error de conexión.", 'bot');
        }
        imageBase64 = null;
    }

    document.getElementById('sivia-send-btn').addEventListener('click', send);
    document.getElementById('sivia-text-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') send();
    });
})();
