document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const response = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (response.ok) {
        alert('Inicio de sesión exitoso');
        localStorage.setItem('token', data.token);
        window.location.href = 'events.html';
    } else {
        alert(data.message);
    }
});
