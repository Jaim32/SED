document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');

    if (!token) {
        alert('No estás autenticado');
        window.location.href = 'index.html';
        return;
    }

    try {
        // Decodificar el token para obtener el rol del usuario
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userRole = payload.role;

        const buttonContainer = document.getElementById('button-container');
        const container = document.getElementById('events-container');

        if (!buttonContainer || !container) {
            console.error('Los contenedores necesarios no existen en el DOM.');
            return;
        }

        // Agregar botones dinámicos según el rol del usuario
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

        // Solicitar los eventos al servidor
        const response = await fetch('http://localhost:3001/events', {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            if (response.status === 401) {
                alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                localStorage.removeItem('token');
                window.location.href = 'index.html';
                return;
            }
            throw new Error('Error al cargar los eventos');
        }

        const events = await response.json();

        // Mostrar mensaje si no hay eventos disponibles
        if (events.length === 0) {
            container.innerHTML = '<p class="empty-message">No hay eventos disponibles.</p>';
            return;
        }

        // Crear tarjetas para cada evento
        events.forEach(event => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <h2>${event.title}</h2>
                <p><strong>Fecha:</strong> ${event.date}</p>
                <p><strong>Hora:</strong> ${event.hour}</p>
                <p><strong>Ubicación:</strong> ${event.location}</p>
                <p>${event.description}</p>
                <p><strong>Contacto:</strong> <a href="mailto:${event.contact}">${event.contact}</a></p>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error al cargar los eventos:', error);
        alert('Error al cargar los eventos');
    }
});
