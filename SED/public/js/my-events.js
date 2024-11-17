document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('No estás autenticado');
        window.location.href = 'index.html';
        return;
    }

    const payload = JSON.parse(atob(token.split('.')[1]));
    const userRole = payload.role;

    if (userRole === 'eventcreator' || userRole === 'superadmin') {
        const buttonContainer = document.getElementById('button-container');
        const createEventButton = document.createElement('button');
        createEventButton.textContent = 'Crear Evento';
        createEventButton.onclick = () => {
            window.location.href = 'create-event.html';
        };
        buttonContainer.appendChild(createEventButton);
    }

    try {
        const response = await fetch('http://localhost:3000/my-events', {
            headers: { Authorization: `Bearer ${token}` },
        });

        const container = document.getElementById('my-events-container');

        if (response.ok) {
            const events = await response.json();

            if (events.length === 0) {
                container.innerHTML = '<p class="empty-message">No has creado eventos todavía.</p>';
                return;
            }

            events.forEach(event => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <h2>${event.title}</h2>
                    <p><strong>Fecha:</strong> ${event.date}</p>
                    <p><strong>Ubicación:</strong> ${event.location}</p>
                    <p>${event.description}</p>
                `;
                container.appendChild(card);
            });
        } else {
            alert('Error al cargar tus eventos');
        }
    } catch (error) {
        console.error('Error al cargar los eventos:', error);
        alert('Error al cargar tus eventos');
    }
});
