document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('No estás autenticado');
        window.location.href = 'index.html';
        return;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userRole = payload.role;

        const buttonContainer = document.getElementById('button-container');

        // Botones dinámicos
        if (userRole === 'eventcreator' || userRole === 'superadmin') {
            const myEventsButton = document.createElement('button');
            myEventsButton.textContent = 'Ver Mis Eventos';
            myEventsButton.onclick = () => {
                window.location.href = 'my-events.html';
            };
            buttonContainer.appendChild(myEventsButton);
        }

        if (userRole === 'superadmin') {
            const manageEventsButton = document.createElement('button');
            manageEventsButton.textContent = 'Gestionar Eventos';
            manageEventsButton.onclick = () => {
                window.location.href = 'manage-events.html';
            };
            buttonContainer.appendChild(manageEventsButton);
        }

        // Cargar eventos
        const response = await fetch('http://localhost:3000/events', {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            throw new Error('Error al cargar los eventos');
        }

        const events = await response.json();
        const container = document.getElementById('events-container');

        if (events.length === 0) {
            container.innerHTML = '<p class="empty-message">No hay eventos disponibles.</p>';
            return;
        }

        // Mostrar eventos como tarjetas (cards)
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
    } catch (error) {
        console.error('Error al cargar los eventos:', error);
        alert('Error al cargar los eventos');
    }
});
