document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('No estás autenticado');
        window.location.href = 'index.html';
        return;
    }

    const container = document.getElementById('manage-events-container');
    const popup = document.getElementById('edit-popup');
    const form = document.getElementById('edit-event-form');
    const cancelEditButton = document.getElementById('cancel-edit');

    let currentEventTitle = ''; // Título original del evento a editar

    // Verificar el rol del usuario
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isSuperAdmin = payload.role === 'superadmin';

    // Cargar eventos
    try {
        const response = await fetch('http://localhost:3001/events', {
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
                <p><strong>Hora:</strong> ${event.hour}</p>
                <p><strong>Ubicación:</strong> ${event.location}</p>
                <p>${event.description}</p>
                <p><strong>Contacto:</strong> <a href="mailto:${event.contact}">${event.contact}</a></p>
                <div class="actions">
                    <button onclick="openEditPopup('${event.title}', '${event.date}', '${event.hour}', '${event.location}', '${event.description}', '${event.contact}')">Editar</button>
                    ${
                        isSuperAdmin
                            ? `<button class="delete-btn" onclick="deleteEvent('${event.title}')">Eliminar</button>`
                            : ''
                    }
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error(error);
        alert('Error al cargar los eventos');
    }

    // Función para abrir el popup
    window.openEditPopup = (title, date, hour, location, description, contact) => {
        currentEventTitle = title;
        document.getElementById('edit-title').value = title;
        document.getElementById('edit-date').value = date;
        document.getElementById('edit-hour').value = hour;
        document.getElementById('edit-location').value = location;
        document.getElementById('edit-description').value = description;
        document.getElementById('edit-contact').value = contact;

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
        const newHour = document.getElementById('edit-hour').value;
        const newLocation = document.getElementById('edit-location').value;
        const newDescription = document.getElementById('edit-description').value;
        const newContact = document.getElementById('edit-contact').value;

        try {
            const response = await fetch('http://localhost:3001/events/edit', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: currentEventTitle,
                    newTitle,
                    newDate,
                    newHour,
                    newLocation,
                    newDescription,
                    newContact,
                }),
            });

            if (!response.ok) throw new Error('Error al editar el evento');

            alert('Evento editado exitosamente');
            popup.classList.add('hidden'); // Cerrar el popup
            window.location.reload(); // Recargar los eventos
        } catch (error) {
            console.error('Error al guardar los cambios:', error);
            alert('Error al guardar los cambios');
        }
    });

    // Eliminar evento
    window.deleteEvent = async (title) => {
        if (!confirm(`¿Estás seguro de eliminar el evento "${title}"?`)) return;

        try {
            const response = await fetch('http://localhost:3001/eventsDelete', {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title }),
            });

            if (!response.ok) throw new Error('Error al eliminar el evento');

            alert('Evento eliminado exitosamente');
            window.location.reload();
        } catch (error) {
            console.error('Error al eliminar el evento:', error);
            alert('Error al eliminar el evento');
        }
    };
});
