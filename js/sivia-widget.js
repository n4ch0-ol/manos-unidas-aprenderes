(function() {
    // ================= CONFIGURACIÓN =================
    const BACKEND_URL = "https://sivia-backend.onrender.com/chat";
    const LOGO_PATH = "sivia recuadro derecho.png"; // Asegúrate que la imagen esté junto al HTML
    
    // Frases de la animación "Gemini Style"
    const thinkingSteps = [
        "🔍 Buscando en la web...",
        "📂 Consultando base de datos...",
        "🧠 Analizando contexto...",
        "✨ Redactando respuesta...",
        "🖼️ Procesando elementos visuales..."
    ];

    // ================= ESTILOS CSS (Inyectados) =================
    const style = document.createElement('style');
    style.innerHTML = `
        /* Fuentes e Iconos */
        @import url('https://fonts.googleapis.com/icon?family=Material+Icons+Round');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');

        /* Variables */
        :root {
            --sivia-blue: #2563eb;
            --sivia-glass: rgba(15, 23, 42, 0.95);
            --sivia-border: rgba(255, 255, 255, 0.15);
        }

        /* Contenedor Principal (Widget) */
        #sivia-widget-container {
            font-family: 'Inter', sans-serif;
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
        }

        /* Botón Redondo (Launcher) */
        #sivia-launcher {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #2563eb, #00d4ff);
            border-radius: 50%;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.3s ease;
        }
        #sivia-launcher:hover { transform: scale(1.1); }
        #sivia-launcher span { color: white; font-size: 30px; }

        /* Ventana del Chat */
        #sivia-window {
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: 380px;
            height: 600px;
            max-height: 80vh;
            background: var(--sivia-glass);
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            border: 1px solid var(--sivia-border);
            border-radius: 20px;
            box-shadow: 0 10px 50px rgba(0,0,0,0.5);
            display: none; /* Oculto por defecto */
            flex-direction: column;
            overflow: hidden;
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.3s, transform 0.3s;
        }

        /* MODO PANTALLA COMPLETA (Para Home o Móvil) */
        #sivia-window.fullscreen-mode {
            bottom: 0; right: 0; left: 0; top: 0;
            width: 100% !important;
            height: 100% !important;
            max-height: 100vh;
            border-radius: 0;
        }

        #sivia-window.open {
            display: flex;
            opacity: 1;
            transform: translateY(0);
        }

        /* Header */
        .sivia-header {
            padding: 15px;
            background: rgba(255,255,255,0.05);
            border-bottom: 1px solid var(--sivia-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: white;
        }
        .sivia-brand { display: flex; align-items: center; gap: 10px; font-weight: 600; }
        .sivia-logo-img { height: 35px; width: auto; object-fit: contain; }

        /* Mensajes */
        #sivia-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 15px;
            scrollbar-width: thin;
            scrollbar-color: #475569 transparent;
        }

        .sivia-msg {
            max-width: 85%;
            padding: 12px 16px;
            border-radius: 12px;
            font-size: 14px;
            line-height: 1.5;
            color: #f1f5f9;
            word-wrap: break-word;
        }
        .sivia-msg.bot { background: #334155; align-self: flex-start; border-bottom-left-radius: 2px; }
        .sivia-msg.user { background: var(--sivia-blue); align-self: flex-end; border-bottom-right-radius: 2px; }
        .sivia-msg img { max-width: 100%; border-radius: 8px; margin-top: 5px; border: 1px solid white; }
        .sivia-msg a { color: #38bdf8; text-decoration: none; border-bottom: 1px dotted; }

        /* Animación Pensando (Gemini) */
        #sivia-thinking {
            display: none;
            align-self: flex-start;
            background: rgba(30, 41, 59, 0.6);
            border: 1px solid rgba(147, 197, 253, 0.3);
            padding: 8px 15px;
            border-radius: 20px;
            align-items: center;
            gap: 10px;
            margin: 0 20px 10px 20px;
            width: fit-content;
        }
        #sivia-thinking.active { display: flex; }
        
        .gemini-sparkle {
            font-size: 16px;
            animation: pulse 1.5s infinite;
            background: linear-gradient(45deg, #F472B6, #A855F7);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .thinking-text { font-size: 12px; color: #cbd5e1; min-width: 160px; }

        /* Input Area */
        .sivia-input-area {
            padding: 15px;
            background: rgba(0,0,0,0.3);
            border-top: 1px solid var(--sivia-border);
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        #sivia-file-input { display: none; }
        .sivia-clip { color: #94a3b8; cursor: pointer; padding: 5px; transition: 0.3s; }
        .sivia-clip:hover { color: white; }
        .sivia-clip.has-file { color: #4ade80; text-shadow: 0 0 8px #4ade80; }

        #sivia-text-input {
            flex: 1;
            background: rgba(255,255,255,0.1);
            border: none;
            padding: 12px;
            border-radius: 25px;
            color: white;
            outline: none;
        }

        #sivia-send-btn {
            background: none; border: none; cursor: pointer; color: #38bdf8;
            transition: transform 0.2s;
        }
        #sivia-send-btn:hover { transform: scale(1.1); }

        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
    `;
    document.head.appendChild(style);

    // ================= HTML ESTRUCTURA =================
    const widgetHTML = `
        <div id="sivia-widget-container">
            <div id="sivia-window">
                <div class="sivia-header">
                    <div class="sivia-brand">
                        <img src="${LOGO_PATH}" alt="SIVIA Logo" class="sivia-logo-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='block'">
                        <span style="display:none">SIVIA AI</span> </div>
                    <span class="material-icons-round" style="cursor:pointer; color:white;" onclick="window.toggleSivia()">close</span>
                </div>

                <div id="sivia-messages">
                    <div class="sivia-msg bot">👋 Hola, soy SIVIA. ¿En qué te ayudo?</div>
                </div>

                <div id="sivia-thinking">
                    <span class="material-icons-round gemini-sparkle">auto_awesome</span>
                    <span class="thinking-text" id="thinking-status">Analizando...</span>
                </div>

                <div class="sivia-input-area">
                    <label for="sivia-file-input" class="sivia-clip" id="sivia-clip-icon">
                        <span class="material-icons-round">attach_file</span>
                    </label>
                    <input type="file" id="sivia-file-input" accept="image/*">
                    
                    <input type="text" id="sivia-text-input" placeholder="Escribe aquí..." autocomplete="off">
                    
                    <button id="sivia-send-btn">
                        <span class="material-icons-round">send</span>
                    </button>
                </div>
            </div>

            <div id="sivia-launcher" onclick="window.toggleSivia()">
                <span class="material-icons-round">smart_toy</span>
            </div>
        </div>
    `;

    // Inyectar al final del body
    const divContainer = document.createElement('div');
    divContainer.innerHTML = widgetHTML;
    document.body.appendChild(divContainer);

    // ================= LÓGICA JAVASCRIPT =================
    let imageBase64 = null;
    let thinkInterval;

    // 1. Abrir / Cerrar
    window.toggleSivia = function() {
        const win = document.getElementById('sivia-window');
        const launcher = document.getElementById('sivia-launcher');
        const isClosed = win.style.display === 'none' || win.style.display === '';

        if (isClosed) {
            win.style.display = 'flex'; // Primero display flex
            
            // Detectar si es HOME para pantalla completa
            if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
                win.classList.add('fullscreen-mode');
            } else {
                win.classList.remove('fullscreen-mode');
            }

            setTimeout(() => win.classList.add('open'), 10); // Luego animación
            launcher.style.display = 'none';
        } else {
            win.classList.remove('open');
            setTimeout(() => {
                win.style.display = 'none';
                launcher.style.display = 'flex';
            }, 300);
        }
    };

    // 2. Manejo de Imagen
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

    // 3. Animación Thinking
    function startThinking() {
        const box = document.getElementById('sivia-thinking');
        const text = document.getElementById('thinking-status');
        box.classList.add('active');
        
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

    // 4. Agregar Mensaje a UI
    function appendMsg(text, sender, img = null) {
        const container = document.getElementById('sivia-messages');
        const div = document.createElement('div');
        div.className = `sivia-msg ${sender}`;
        
        if (sender === 'bot') {
            // Markdown simple
            let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                           .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
            div.innerHTML = html;
        } else {
            div.textContent = text;
        }

        if (img && sender === 'user') {
            const image = document.createElement('img');
            image.src = `data:image/jpeg;base64,${img}`;
            div.appendChild(image);
        }
        
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    // 5. Enviar a Render
    async function send() {
        const input = document.getElementById('sivia-text-input');
        const text = input.value.trim();
        
        if (!text && !imageBase64) return;

        appendMsg(text, 'user', imageBase64);
        input.value = '';
        document.getElementById('sivia-clip-icon').classList.remove('has-file');
        document.getElementById('sivia-file-input').value = ''; // Limpiar input file
        
        startThinking();

        try {
            // Nota: Usamos fetch POST al backend de Render
            const res = await fetch(BACKEND_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: text, image: imageBase64 })
            });
            
            if (!res.ok) throw new Error("Error en servidor");
            
            const data = await res.json();
            stopThinking();
            appendMsg(data.answer, 'bot');

        } catch (err) {
            stopThinking();
            console.error(err);
            appendMsg("⚠️ No pude conectar con el servidor. Puede que se esté despertando (tarda 30s en Render gratuito). Intenta de nuevo.", 'bot');
        }

        imageBase64 = null;
    }

    // Listeners
    document.getElementById('sivia-send-btn').addEventListener('click', send);
    document.getElementById('sivia-text-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') send();
    });

})();
