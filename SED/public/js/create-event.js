document.getElementById('create-event-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
        alert('No estás autenticado');
        window.location.href = 'index.html';
        return;
    }

    const title = document.getElementById('title').value;
    const date = document.getElementById('date').value;
    const location = document.getElementById('location').value;
    const description = document.getElementById('description').value;

    try {
        const response = await fetch('http://localhost:3000/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ title, date, location, description }),
        });

        if (response.ok) {
            alert('Evento creado exitosamente');
            window.location.href = 'my-events.html';
        } else {
            const data = await response.json();
            alert(data.message || 'Error al crear el evento');
        }
    } catch (error) {
        console.error('Error al crear el evento:', error);
        alert('Error al crear el evento');
    }
});
