document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chatForm');
    const userInput = document.getElementById('userInput');
    const chatMessages = document.getElementById('chatMessages');
    const typingIndicator = document.getElementById('typingIndicator');
    const suggestionsBar = document.getElementById('suggestionsBar');
    const clearBtn = document.getElementById('clearBtn');
    
    // Floating window elements
    const floatBtn = document.getElementById('floatBtn');
    const floatingWindow = document.getElementById('floatingWindow');
    const closeFloatBtn = document.getElementById('closeFloatBtn');
    const minimizeBtn = document.getElementById('minimizeBtn');
    const floatingTrigger = document.getElementById('floatingTrigger');
    const floatingInput = document.getElementById('floatingInput');
    const floatingSendBtn = document.getElementById('floatingSendBtn');
    const floatingMessages = document.getElementById('floatingMessages');
    const unreadBadge = document.getElementById('unreadBadge');

    const SIVIA_API_URL = "https://sivia-backend.onrender.com/chat";
    
    let messagesHistory = [];
    let unreadCount = 0;
    let isFloatingOpen = false;

    // Sugerencias rápidas
    const suggestions = [
        "¿Cuándo son las votaciones?",
        "¿Qué es E.S.E.N.C.I.A?",
        "Torneos disponibles",
        "Cómo funciona el podcast",
        "¿Qué son las correcaminatas?",
        "Proyecto Materiales",
        "Pared Creativa",
        "Concierto de segundo año"
    ];

    // Renderizar sugerencias
    function renderSuggestions() {
        suggestionsBar.innerHTML = '';
        suggestions.forEach(suggestion => {
            const chip = document.createElement('button');
            chip.className = 'suggestion-chip';
            chip.textContent = suggestion;
            chip.addEventListener('click', () => {
                userInput.value = suggestion;
                userInput.focus();
            });
            suggestionsBar.appendChild(chip);
        });
    }

    renderSuggestions();

    // Agregar mensaje al chat
    function addMessage(text, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-bubble ${isUser ? 'user' : 'sivia'}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = isUser ? (auth.username ? auth.username.charAt(0).toUpperCase() : '👤') : '🤖';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        const header = document.createElement('div');
        header.className = 'message-header';
        
        const sender = document.createElement('span');
        sender.className = 'message-sender';
        sender.textContent = isUser ? (auth.username || 'Tú') : 'SIVIA';
        
        const time = document.createElement('span');
        time.className = 'message-time';
        time.textContent = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        
        header.appendChild(sender);
        header.appendChild(time);
        
        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        
        // Parsear markdown simple
        const formattedText = text
            .split('\n\n').map(p => `<p>${p}</p>`).join('')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        messageText.innerHTML = formattedText;
        
        content.appendChild(header);
        content.appendChild(messageText);
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Guardar en historial
        messagesHistory.push({ text, isUser, time: new Date() });
        
        // Sincronizar con ventana flotante si está abierta
        if (isFloatingOpen) {
            syncToFloating();
        } else if (!isUser && floatingWindow.classList.contains('hidden')) {
            // Incrementar contador de no leídos solo para mensajes de SIVIA
            unreadCount++;
            updateUnreadBadge();
        }
        
        return messageDiv;
    }

    // Mostrar indicador de escritura
    function showTyping() {
        typingIndicator.classList.remove('hidden');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function hideTyping() {
        typingIndicator.classList.add('hidden');
    }

    // Enviar mensaje
    async function sendMessage(message) {
        if (!message.trim()) return;

        addMessage(message, true);
        showTyping();

        try {
            const response = await fetch(SIVIA_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: message })
            });

            if (!response.ok) throw new Error('Error en la respuesta');

            const data = await response.json();
            hideTyping();
            addMessage(data.answer);

        } catch (error) {
            hideTyping();
            addMessage('Lo siento, tuve un problema para conectarme. ¿Podrías intentar de nuevo?');
            console.error('Error:', error);
        }
    }

    // Event listeners
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = userInput.value.trim();
        if (message) {
            await sendMessage(message);
            userInput.value = '';
        }
    });

    // Limpiar chat
    clearBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres limpiar el chat?')) {
            chatMessages.innerHTML = '';
            messagesHistory = [];
            // Volver a agregar mensaje de bienvenida
            setTimeout(() => {
                addMessage('¡Hola de nuevo! 👋 ¿En qué puedo ayudarte?');
            }, 100);
        }
    });

    // FLOATING WINDOW FUNCTIONALITY
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    // Abrir ventana flotante
    floatBtn.addEventListener('click', () => {
        floatingWindow.classList.remove('hidden');
        floatingTrigger.classList.add('hidden');
        isFloatingOpen = true;
        unreadCount = 0;
        updateUnreadBadge();
        syncToFloating();
    });

    // Cerrar ventana flotante
    closeFloatBtn.addEventListener('click', () => {
        floatingWindow.classList.add('hidden');
        floatingTrigger.classList.remove('hidden');
        isFloatingOpen = false;
    });

    // Minimizar ventana flotante
    minimizeBtn.addEventListener('click', () => {
        floatingWindow.classList.toggle('minimized');
    });

    // Abrir desde trigger
    floatingTrigger.addEventListener('click', () => {
        floatingWindow.classList.remove('hidden');
        floatingTrigger.classList.add('hidden');
        isFloatingOpen = true;
        unreadCount = 0;
        updateUnreadBadge();
        syncToFloating();
    });

    // Sincronizar mensajes a ventana flotante
    function syncToFloating() {
        floatingMessages.innerHTML = '';
        messagesHistory.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message-bubble ${msg.isUser ? 'user' : 'sivia'}`;
            messageDiv.style.marginBottom = '1rem';
            
            const avatar = document.createElement('div');
            avatar.className = 'message-avatar';
            avatar.textContent = msg.isUser ? (auth.username ? auth.username.charAt(0).toUpperCase() : '👤') : '🤖';
            avatar.style.width = '30px';
            avatar.style.height = '30px';
            avatar.style.fontSize = '1.2rem';
            
            const content = document.createElement('div');
            content.className = 'message-content';
            content.style.maxWidth = '75%';
            
            const messageText = document.createElement('div');
            messageText.className = 'message-text';
            messageText.style.fontSize = '0.9rem';
            messageText.style.padding = '0.8rem';
            
            const formattedText = msg.text
                .split('\n\n').map(p => `<p style="margin: 0.3rem 0;">${p}</p>`).join('')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            
            messageText.innerHTML = formattedText;
            
            content.appendChild(messageText);
            messageDiv.appendChild(avatar);
            messageDiv.appendChild(content);
            
            floatingMessages.appendChild(messageDiv);
        });
        floatingMessages.scrollTop = floatingMessages.scrollHeight;
    }

    // Enviar desde ventana flotante
    floatingSendBtn.addEventListener('click', async () => {
        const message = floatingInput.value.trim();
        if (message) {
            await sendMessage(message);
            floatingInput.value = '';
            syncToFloating();
        }
    });

    floatingInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const message = floatingInput.value.trim();
            if (message) {
                await sendMessage(message);
                floatingInput.value = '';
                syncToFloating();
            }
        }
    });

    // Actualizar badge de no leídos
    function updateUnreadBadge() {
        unreadBadge.textContent = unreadCount;
        if (unreadCount > 0) {
            unreadBadge.style.display = 'flex';
        } else {
            unreadBadge.style.display = 'none';
        }
    }

    // Drag functionality para ventana flotante
    const floatingHeader = document.querySelector('.floating-header');
    
    floatingHeader.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    // Touch events para móvil
    floatingHeader.addEventListener('touchstart', dragStart);
    document.addEventListener('touchmove', drag);
    document.addEventListener('touchend', dragEnd);

    function dragStart(e) {
        if (e.type === "touchstart") {
            initialX = e.touches[0].clientX - xOffset;
            initialY = e.touches[0].clientY - yOffset;
        } else {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
        }

        if (e.target === floatingHeader || floatingHeader.contains(e.target)) {
            isDragging = true;
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            
            if (e.type === "touchmove") {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
            }

            xOffset = currentX;
            yOffset = currentY;

            setTranslate(currentX, currentY, floatingWindow);
        }
    }

    function dragEnd(e) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
    }

    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate(${xPos}px, ${yPos}px)`;
    }

    // Atajos de teclado
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K para abrir/cerrar ventana flotante
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if (floatingWindow.classList.contains('hidden')) {
                floatBtn.click();
            } else {
                closeFloatBtn.click();
            }
        }
    });

    // Animaciones de entrada
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.6s ease-out forwards';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.feature-card').forEach(card => {
        card.style.opacity = '0';
        observer.observe(card);
    });

    // Inicializar
    updateUnreadBadge();
    
    console.log('🤖 SIVIA iniciada correctamente');
    console.log('💡 Tip: Presiona Ctrl+K para abrir/cerrar la ventana flotante');
});