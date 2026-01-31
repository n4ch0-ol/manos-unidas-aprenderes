const SIVIA_API_URL = "https://sivia-backend.onrender.com/chat";
let knowledgeBase = null;
let selectedImageBase64 = null;

async function loadKnowledgeBase() {
    try {
        const response = await fetch('data/sivia-knowledge-base.json');
        knowledgeBase = await response.json();
    } catch (error) {
        console.warn('No se pudo cargar la base local.');
    }
}

function searchLocalKnowledge(question) {
    if (!knowledgeBase) return null;
    const lowerQuestion = question.toLowerCase();
    for (let faq of knowledgeBase.preguntas_frecuentes) {
        if (lowerQuestion.includes(faq.pregunta.toLowerCase().split(' ').slice(0, 3).join(' '))) return faq.respuesta;
    }
    for (let proyecto of knowledgeBase.proyectos) {
        if (lowerQuestion.includes(proyecto.nombre.toLowerCase())) return proyecto.descripcion;
    }
    return null;
}

document.addEventListener('DOMContentLoaded', () => {
    loadKnowledgeBase();
    
    const style = document.createElement('style');
    style.textContent = `
        .sivia-btn-float { position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; background-image: url('images/sivia recuadro derecho.png'); background-size: cover; border-radius: 50%; border: none; cursor: pointer; z-index: 9998; animation: pulseBtn 2s infinite; }
        @keyframes pulseBtn { 0%, 100% { box-shadow: 0 4px 20px rgba(0, 240, 255, 0.5); } 50% { box-shadow: 0 4px 30px rgba(255, 0, 255, 0.7); } }
        .sivia-window { position: fixed; bottom: 90px; right: 20px; width: 380px; height: 500px; background: rgba(26, 26, 46, 0.95); backdrop-filter: blur(20px); border-radius: 20px; border: 1px solid rgba(0, 240, 255, 0.3); display: none; flex-direction: column; z-index: 9999; }
        .sivia-window.active { display: flex; }
        .sivia-window-header { padding: 1rem; background: linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(255, 0, 255, 0.2)); border-radius: 20px 20px 0 0; display: flex; justify-content: space-between; align-items: center; }
        .sivia-messages { flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
        .sivia-msg { display: flex; gap: 0.8rem; }
        .sivia-msg.user { flex-direction: row-reverse; }
        .sivia-avatar { width: 35px; height: 35px; border-radius: 50%; background-size: cover; }
        .sivia-avatar.sivia-icon { background-image: url('images/sivia recuadro derecho.png'); }
        .sivia-avatar.user-icon { background: linear-gradient(135deg, #ff00ff, #00f0ff); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; }
        .sivia-msg-content { background: rgba(0, 240, 255, 0.1); padding: 0.8rem; border-radius: 12px; max-width: 75%; color: white; font-size: 0.9rem; }
        .sivia-input-container { padding: 1rem; background: rgba(0, 0, 0, 0.2); }
        .sivia-input-form { display: flex; gap: 0.5rem; align-items: center; }
        .sivia-input { flex: 1; padding: 0.7rem; border-radius: 10px; border: 1px solid rgba(0, 240, 255, 0.3); background: rgba(255, 255, 255, 0.05); color: white; }
        .sivia-file-btn { background: none; border: none; color: #00f0ff; font-size: 1.5rem; cursor: pointer; }
        .sivia-preview { width: 40px; height: 40px; border-radius: 5px; display: none; object-fit: cover; }
        .sivia-typing { display: none; padding: 1rem; gap: 0.3rem; }
        .sivia-typing.active { display: flex; }
        .sivia-typing span { width: 6px; height: 6px; background: #00f0ff; border-radius: 50%; animation: typingBounce 1.4s infinite; }
        @keyframes typingBounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-8px); } }
    `;
    document.head.appendChild(style);

    const html = `
        <button class="sivia-btn-float" id="siviaBtn"></button>
        <div class="sivia-window" id="siviaWindow">
            <div class="sivia-window-header">
                <h3 style="color:white; margin:0;"><img src="images/sivia recuadro derecho.png" style="width:30px; vertical-align:middle;"> SIVIA</h3>
                <button id="siviaClose" style="background:none; border:none; color:white; font-size:1.5rem; cursor:pointer;">×</button>
            </div>
            <div class="sivia-messages" id="siviaMessages"></div>
            <div class="sivia-typing" id="siviaTyping"><span></span><span></span><span></span></div>
            <div class="sivia-input-container">
                <img id="siviaThumb" class="sivia-preview">
                <form class="sivia-input-form" id="siviaForm">
                    <button type="button" class="sivia-file-btn" id="siviaClip">📎</button>
                    <input type="file" id="siviaFile" style="display:none" accept="image/*">
                    <input type="text" class="sivia-input" id="siviaInput" placeholder="Escribe..." autocomplete="off">
                    <button type="submit" style="background:linear-gradient(135deg,#00f0ff,#ff00ff); border:none; padding:0.7rem; border-radius:10px; color:white; cursor:pointer;">Enviar</button>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);

    const btn = document.getElementById('siviaBtn'), win = document.getElementById('siviaWindow'), close = document.getElementById('siviaClose');
    const form = document.getElementById('siviaForm'), input = document.getElementById('siviaInput'), messages = document.getElementById('siviaMessages');
    const clip = document.getElementById('siviaClip'), fileInput = document.getElementById('siviaFile'), thumb = document.getElementById('siviaThumb');
    const typing = document.getElementById('siviaTyping');

    btn.onclick = () => win.classList.add('active');
    close.onclick = () => win.classList.remove('active');
    clip.onclick = () => fileInput.click();

    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                selectedImageBase64 = e.target.result.split(',')[1];
                thumb.src = e.target.result;
                thumb.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    };

    form.onsubmit = async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text && !selectedImageBase64) return;

        addMessage(text || "Imagen enviada", true);
        input.value = ''; thumb.style.display = 'none';
        typing.classList.add('active');

        const local = searchLocalKnowledge(text);
        if (local && !selectedImageBase64) {
            typing.classList.remove('active');
            addMessage(local, false);
        } else {
            try {
                const res = await fetch(SIVIA_API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question: text, image: selectedImageBase64 })
                });
                const data = await res.json();
                typing.classList.remove('active');
                
                let answer = data.answer;
                if (answer.includes("https://image.pollinations.ai")) {
                    const url = answer.match(/https?:\/\/[^\s]+/g)[0];
                    answer = answer.replace(url, `<br><img src="${url}" style="width:100%; border-radius:10px; margin-top:10px;">`);
                }
                addMessage(answer, false);
            } catch (err) {
                typing.classList.remove('active');
                addMessage('Error de conexión.', false);
            }
        }
        selectedImageBase64 = null;
    };

    function addMessage(text, isUser) {
        const msg = document.createElement('div');
        msg.className = `sivia-msg ${isUser ? 'user' : ''}`;
        msg.innerHTML = `
            <div class="sivia-avatar ${isUser ? 'user-icon' : 'sivia-icon'}">${isUser ? 'U' : ''}</div>
            <div class="sivia-msg-content"><p>${text}</p></div>
        `;
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
    }
});
