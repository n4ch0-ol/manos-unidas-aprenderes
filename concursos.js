document.addEventListener('DOMContentLoaded', function() {

    // 1. Obtenemos referencias a los BOTONES
    const btnTruco = document.getElementById('btn-truco');
    const btnValorant = document.getElementById('btn-valorant');
    const btnMinecraft = document.getElementById('btn-minecraft');
    // --- NUEVOS BOTONES ---
    const btnFootball = document.getElementById('btn-football');
    const btnAjedrez = document.getElementById('btn-ajedrez');
    const btnUNO = document.getElementById('btn-UNO');
    // ---
    const body = document.body;

    // 2. Obtenemos referencias a las TARJETAS DE CONTENIDO
    const cardTruco = document.getElementById('truco');
    const cardValorant = document.getElementById('valorant');
    const cardMinecraft = document.getElementById('minecraft');
    // --- NUEVAS TARJETAS ---
    const cardFootball = document.getElementById('football');
    const cardAjedrez = document.getElementById('ajedrez');
    const cardUNO = document.getElementById('UNO');
    // ---
    
    // 3. Una lista de TODAS las tarjetas (esto ya funciona para todas)
    const allCards = document.querySelectorAll('.juego-card');

    // 4. Función para ocultar todas las tarjetas (no necesita cambios)
    function hideAllCards() {
        allCards.forEach(card => {
            card.classList.remove('active'); // Quita la clase 'active'
        });
    }

    // --- EVENTOS DE CLIC (Originales) ---

    btnTruco.addEventListener('click', function() {
        hideAllCards(); // Primero oculta todas
        body.className = 'bg-truco';
        cardTruco.classList.add('active'); // Muestra solo la de truco
    });

    btnValorant.addEventListener('click', function() {
        hideAllCards(); // Primero oculta todas
        body.className = 'bg-valorant';
        cardValorant.classList.add('active'); // Muestra solo la de valorant
    });

    btnMinecraft.addEventListener('click', function() {
        hideAllCards(); // Primero oculta todas
        body.className = 'bg-minecraft';
        cardMinecraft.classList.add('active'); // Muestra solo la de minecraft
    });

    // --- NUEVOS EVENTOS DE CLIC ---

    btnFootball.addEventListener('click', function() {
        hideAllCards(); // Primero oculta todas
        body.className = 'bg-football'; // Nueva clase de fondo
        cardFootball.classList.add('active'); // Muestra solo la de football
    });

    btnAjedrez.addEventListener('click', function() {
        hideAllCards(); // Primero oculta todas
        body.className = 'bg-ajedrez'; // Nueva clase de fondo
        cardAjedrez.classList.add('active'); // Muestra solo la de ajedrez
    });

    btnUNO.addEventListener('click', function() {
        hideAllCards(); // Primero oculta todas
        body.className = 'bg-UNO'; // Nueva clase de fondo
        cardUNO.classList.add('active'); // Muestra solo la de UNO
    });
    // ---
});