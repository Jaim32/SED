document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('No estás autenticado');
        window.location.href = 'index.html';
        return;
    }

    const payload = JSON.parse(atob(token.split('.')[1]));
    const userRole = payload.role;
    const isSuperAdmin = userRole === 'superadmin';

    const container = document.getElementById('my-events-container');
    const popup = document.getElementById('edit-popup');
    const form = document.getElementById('edit-event-form');
    const cancelEditButton = document.getElementById('cancel-edit');

    let currentEventTitle = ''; // Título original del evento a editar

    // Mostrar botón de "Crear Evento" si el usuario es un creador de eventos o superadmin
    if (userRole === 'eventcreator' || isSuperAdmin) {
        const buttonContainer = document.getElementById('button-container');
        const createEventButton = document.createElement('button');
        createEventButton.textContent = 'Crear Evento';
        createEventButton.onclick = () => {
            window.location.href = 'create-event.html';
        };
        buttonContainer.appendChild(createEventButton);
    }

    // Cargar eventos del usuario (o todos si es superadmin)
    try {
        const url = isSuperAdmin ? 'http://localhost:3001/events' : 'http://localhost:3001/my-events';
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Error al cargar los eventos');

        const events = await response.json();

        if (events.length === 0) {
            container.innerHTML = '<p class="empty-message">No hay eventos disponibles.</p>';
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
                <div class="actions">
                    <button onclick="openEditPopup('${event.title}', '${event.date}', '${event.location}', '${event.description}')">Editar</button>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error al cargar los eventos:', error);
        alert('Error al cargar los eventos');
    }

    // Función para abrir el popup
    window.openEditPopup = (title, date, location, description) => {
        currentEventTitle = title;
        document.getElementById('edit-title').value = title;
        document.getElementById('edit-date').value = date;
        document.getElementById('edit-location').value = location;
        document.getElementById('edit-description').value = description;

        popup.classList.remove('hidden');
    };

    // Cerrar el popup al cancelar
    cancelEditButton.addEventListener('click', () => {
        popup.classList.add('hidden');
    });

    // Guardar cambios y cerrar el popup
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newTitle = document.getElementById('edit-title').value;
        const newDate = document.getElementById('edit-date').value;
        const newLocation = document.getElementById('edit-location').value;
        const newDescription = document.getElementById('edit-description').value;

        try {
            const response = await fetch('http://localhost:3001/events/edit', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title: currentEventTitle, newTitle, newDate, newLocation, newDescription }),
            });

            if (!response.ok) throw new Error('Error al editar el evento');

            alert('Evento editado exitosamente');
            popup.classList.add('hidden'); // Cerrar el popup
            window.location.reload();
        } catch (error) {
            console.error('Error al guardar los cambios:', error);
            alert('Error al guardar los cambios');
        }
    });
});
