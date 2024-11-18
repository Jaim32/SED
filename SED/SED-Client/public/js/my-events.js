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

    if (!popup || !form || !cancelEditButton || !container || !createEventButton) {
        console.error('Elementos necesarios no encontrados. Verifica la estructura de la página.');
        return;
    }

    let currentEventTitle = ''; // Título del evento a editar

    // Función para cargar eventos del usuario actual
    async function loadEvents() {
        try {
            const response = await fetch('http://localhost:3001/my-events', {
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
                body: JSON.stringify({
                    title: currentEventTitle,
                    newTitle: newTitle,
                    newDate: newDate,
                    newLocation: newLocation,
                    newDescription: newDescription,
                }),
            });

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('No tienes permisos para editar este evento');
                }
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

    // Redirigir a la página de creación de eventos al hacer clic en "Crear Evento"
    createEventButton.addEventListener('click', () => {
        console.log('Botón de Crear Evento clickeado. Redirigiendo a create-event.html...');
        window.location.href = 'create-event.html'; // Redirige a la página de creación
    });

    // Cargar eventos al cargar la página
    await loadEvents();
});
    