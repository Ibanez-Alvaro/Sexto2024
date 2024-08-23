document.getElementById('formulario').addEventListener('submit', function(event) {
    event.preventDefault();

    let cedula = document.getElementById('cedula').value;
    let nombres = document.getElementById('nombres').value;
    let edad = document.getElementById('edad').value;
    let correo = document.getElementById('correo').value;

    if (cedula && nombres && edad && correo) {
        let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];

        usuarios.push({ cedula, nombres, edad, correo });

        localStorage.setItem('usuarios', JSON.stringify(usuarios));

        mostrarUsuarios();

        // Limpiar el formulario
        document.getElementById('formulario').reset();
    } else {
        alert("Por favor, complete todos los campos.");
    }
});

function mostrarUsuarios() {
    let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
    let tablaUsuarios = document.getElementById('tabla-usuarios');
    tablaUsuarios.innerHTML = '';

    usuarios.forEach((usuario, index) => {
        let row = `<tr>
            <td>${usuario.cedula}</td>
            <td>${usuario.nombres}</td>
            <td>${usuario.edad}</td>
            <td>${usuario.correo}</td>
            <td>
                <button class="btn btn-outline-info" onclick="editarUsuario(${index})"> <i class="bi bi-pencil-square"></i> Editar</button>
                <button class="btn btn-outline-danger" onclick="eliminarUsuario(${index})"><i class="bi bi-trash3-fill"></i> Eliminar </button>
            </td>
        </tr>`;
        tablaUsuarios.innerHTML += row;
    });
}

function eliminarUsuario(index) {
    let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
    usuarios.splice(index, 1);
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    mostrarUsuarios();
}

function editarUsuario(index) {
    let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
    let usuario = usuarios[index];

    document.getElementById('cedula').value = usuario.cedula;
    document.getElementById('nombres').value = usuario.nombres;
    document.getElementById('edad').value = usuario.edad;
    document.getElementById('correo').value = usuario.correo;

    eliminarUsuario(index);
}

document.addEventListener('DOMContentLoaded', mostrarUsuarios);
