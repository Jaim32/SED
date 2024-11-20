document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('No estás autenticado');
        window.location.href = 'index.html';
        return;
    }

    // Obtener referencias a los elementos HTML
    const popup = document.getElementById('edit-popup');
    const form = document.getElementById('edit-event-form');
    const cancelEditButton = document.getElementById('cancel-edit');
    const container = document.getElementById('my-events-container');
    const createEventButton = document.getElementById('create-event-button');
    const backToEventsButton = document.getElementById('back-to-events-button'); // Botón para volver a todos los eventos

    if (!popup || !form || !cancelEditButton || !container || !createEventButton || !backToEventsButton) {
        console.error('Elementos necesarios no encontrados. Verifica la estructura de la página.');
        return;
    }

    let currentEventId = ''; // ID del evento a editar

    // Función para cargar eventos del usuario actual
    async function loadEvents() {
        try {
            const response = await fetch('http://192.168.58.104:3001/events/my', {
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

            container.innerHTML = ''; // Limpiar contenido anterior

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
                        <button class="edit-btn" data-id="${event._id}" data-title="${event.title}" data-date="${event.date}" data-hour="${event.hour}" data-location="${event.location}" data-description="${event.description}" data-contact="${event.contact}">Editar</button>
                        <button class="delete-btn" data-id="${event._id}">Eliminar</button>
                    </div>
                `;
                container.appendChild(card);
            });

            // Asignar eventos a los botones de editar
            document.querySelectorAll('.edit-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const { id, title, date, hour, location, description, contact } = e.target.dataset;

                    openEditPopup(id, title, date, hour, location, description, contact);
                });
            });

            // Asignar eventos a los botones de eliminar
            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const id = e.target.dataset.id;
                    if (confirm(`¿Estás seguro de que deseas eliminar el evento?`)) {
                        await deleteEvent(id);
                    }
                });
            });
        } catch (error) {
            console.error('Error al cargar los eventos:', error);
            alert('Error al cargar los eventos');
        }
    }

    // Función para abrir el popup de edición
    window.openEditPopup = (id, title, date, hour, location, description, contact) => {
        currentEventId = id;
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
            const response = await fetch('http://192.168.58.104:3001/events/edit', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: currentEventId,
                    newTitle,
                    newDate,
                    newHour,
                    newLocation,
                    newDescription,
                    newContact,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al editar el evento');
            }

            alert('Evento editado exitosamente');
            popup.classList.add('hidden'); // Cerrar el popup
            await loadEvents(); // Recargar eventos después de editar
        } catch (error) {
            console.error('Error al guardar los cambios:', error);
            alert(error.message || 'Error al guardar los cambios');
        }
    });

    // Función para eliminar un evento
    async function deleteEvent(id) {
        try {
            const response = await fetch('http://localhost:3001/eventsDelete', {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar el evento');
            }

            alert('Evento eliminado exitosamente');
            await loadEvents(); // Recargar eventos después de eliminar
        } catch (error) {
            console.error('Error al eliminar el evento:', error);
            alert(error.message || 'Error al eliminar el evento');
        }
    }

    // Redirigir a la página de creación de eventos al hacer clic en "Crear Evento"
    createEventButton.addEventListener('click', () => {
        window.location.href = 'create-event.html'; // Redirige a la página de creación
    });

    // Redirigir a la página de todos los eventos al hacer clic en "Volver a Todos los Eventos"
    backToEventsButton.addEventListener('click', () => {
        window.location.href = 'events.html'; // Redirige a la página de todos los eventos
    });

    // Cargar eventos al cargar la página
    await loadEvents();
});
