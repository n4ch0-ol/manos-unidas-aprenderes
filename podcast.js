// Espera a que todo el HTML esté cargado
document.addEventListener('DOMContentLoaded', function() {

    // 1. Busca los elementos que necesitamos
    const playerChico = document.getElementById('playerSmall');
    const playerGrande = document.getElementById('spotifyOverlay');
    const botonCerrar = document.getElementById('closeBtn');

    // 2. Cuando se hace clic en el "cosochico"
    playerChico.addEventListener('click', function() {
        // Añade la clase 'active' al reproductor grande para mostrarlo
        playerGrande.classList.add('active');
    });

    // 3. Cuando se hace clic en el botón de cerrar (la 'X')
    botonCerrar.addEventListener('click', function() {
        // Quita la clase 'active' para ocultarlo
        playerGrande.classList.remove('active');
    });

});