document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('No estás autenticado');
        window.location.href = 'index.html';
        return;
    }

    // Decodificar el token para verificar el rol del usuario
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userRole = payload.role;

    if (userRole !== 'eventcreator') {
        alert('No tienes permiso para acceder a esta página');
        window.location.href = 'events.html';
        return;
    }

    // Mostrar el botón de "Crear Evento"
    const buttonContainer = document.getElementById('button-container');
    const createEventButton = document.createElement('button');
    createEventButton.textContent = 'Crear Evento';
    createEventButton.onclick = () => {
        window.location.href = 'create-event.html'; // Redirigir a la página de creación de eventos
    };
    buttonContainer.appendChild(createEventButton);

    // Solicitar eventos creados por el usuario
    try {
        const response = await fetch('http://localhost:3000/my-events', {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
            const events = await response.json();
            const container = document.getElementById('my-events-container');

            if (events.length === 0) {
                container.innerHTML = '<p>No has creado eventos todavía.</p>';
            } else {
                events.forEach(event => {
                    const div = document.createElement('div');
                    div.innerHTML = `
                        <h2>${event.title}</h2>
                        <p>${event.description}</p>
                        <p><strong>Fecha:</strong> ${event.date}</p>
                        <p><strong>Ubicación:</strong> ${event.location}</p>
                    `;
                    container.appendChild(div);
                });
            }
        } else {
            alert('Error al cargar tus eventos');
        }
    } catch (error) {
        console.error('Error al cargar los eventos:', error);
        alert('Error al cargar tus eventos');
    }
});
