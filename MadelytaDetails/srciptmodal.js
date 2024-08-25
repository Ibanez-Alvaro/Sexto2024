document.addEventListener('DOMContentLoaded', (event) => {
    // Obtener los elementos de los modales
    const modalRegistro = document.getElementById('modalRegistro');
    const modalLogin = document.getElementById('modalLogin');

    // Obtener los botones que abren los modales
    const btnRegistro = document.getElementById('openRegistro');
    const btnLogin = document.getElementById('openLogin');

    // Obtener los elementos <span> que cierran los modales
    const spanRegistro = document.getElementById('closeRegistro');
    const spanLogin = document.getElementById('closeLogin');

    // Cuando el usuario hace clic en el botón, abre el modal de registro
    btnRegistro.onclick = function() {
        modalRegistro.style.display = "block";
    }

    // Cuando el usuario hace clic en el botón, abre el modal de login
    btnLogin.onclick = function() {
        modalLogin.style.display = "block";
    }

    // Cuando el usuario hace clic en <span> (x), cierra el modal de registro
    spanRegistro.onclick = function() {
        modalRegistro.style.display = "none";
    }

    // Cuando el usuario hace clic en <span> (x), cierra el modal de login
    spanLogin.onclick = function() {
        modalLogin.style.display = "none";
    }

    // Cuando el usuario hace clic fuera del modal, lo cierra
    window.onclick = function(event) {
        if (event.target == modalRegistro) {
            modalRegistro.style.display = "none";
        }
        if (event.target == modalLogin) {
            modalLogin.style.display = "none";
        }
    }
});

