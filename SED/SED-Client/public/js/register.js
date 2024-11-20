document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Obtener valores del formulario
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const role = document.getElementById('role').value;

    // Validaciones básicas antes de enviar la solicitud
    if (!name || !email || !password || !role) {
        alert('Por favor, completa todos los campos.');
        return;
    }

    if (!validateEmail(email)) {
        alert('Por favor, introduce un correo electrónico válido.');
        return;
    }

    if (password.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres.');
        return;
    }

    try {
        // Realizar la solicitud de registro
        const response = await fetch('http://192.168.243.205:3001/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role }),
        });

        if (response.ok) {
            alert('Registro exitoso. Ahora puedes iniciar sesión.');
            window.location.href = 'index.html';
        } else {
            const data = await response.json();
            alert(data.message || 'Error al registrarse');
        }
    } catch (error) {
        console.error('Error en el registro:', error);
        alert('Hubo un problema al realizar el registro. Intenta nuevamente.');
    }
});

// Función para validar correos electrónicos
function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}
