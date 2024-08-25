function mostrarModal(pagina) {
    $.ajax({
        url: pagina,
        method: 'GET',
        success: function(data) {
            $('#modalContent').html(data);
            $('#authModal').modal('show');
        },
        error: function() {
            $('#modalContent').html('<p>Error al cargar el contenido.</p>');
            $('#authModal').modal('show');
        }
    });
}

function cerrarSesion() {
    // Lógica para cerrar sesión
}

