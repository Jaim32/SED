document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    // Validaciones básicas de entrada
    if (!email || !password) {
        alert('Por favor, completa todos los campos');
        return;
    }

    try {
        // Realizar la solicitud al servidor
        const response = await fetch('https://192.168.243.205:3001/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        // Analizar la respuesta
        const data = await response.json();

        if (response.ok) {
            alert('Inicio de sesión exitoso');
            localStorage.setItem('token', data.token); // Guardar el token en localStorage
            window.location.href = 'events.html'; // Redirigir a la página de eventos
        } else {
            // Mostrar mensaje de error del servidor
            alert(data.message || 'Error al iniciar sesión');
        }
    } catch (error) {
        // Manejar errores de red u otros problemas inesperados
        console.error('Error al intentar iniciar sesión:', error);
        alert('Error al intentar iniciar sesión. Por favor, intenta nuevamente.');
    }
});
