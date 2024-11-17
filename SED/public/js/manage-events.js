document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('No estás autenticado');
        window.location.href = 'index.html';
        return;
    }

    try {
        // Solicitar eventos al backend
        const response = await fetch('http://localhost:3000/events', {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error del servidor:', errorData);
            alert(errorData.message || 'Error al cargar los eventos');
            return;
        }

        const events = await response.json();
        const container = document.getElementById('manage-events-container');

        if (events.length === 0) {
            container.innerHTML = '<p>No hay eventos disponibles.</p>';
        } else {
            events.forEach(event => {
                const div = document.createElement('div');
                div.innerHTML = `
                    <h2>${event.title}</h2>
                    <p>${event.description}</p>
                    <p><strong>Fecha:</strong> ${event.date}</p>
                    <p><strong>Ubicación:</strong> ${event.location}</p>
                    <button onclick="editEvent('${event.title}')">Editar</button>
                    <button onclick="deleteEvent('${event.title}')">Eliminar</button>
                `;
                container.appendChild(div);
            });
        }
    } catch (error) {
        console.error('Error al realizar la solicitud:', error);
        alert('Error al cargar los eventos');
    }

    // Crear un evento
    document.getElementById('create-event-button').addEventListener('click', () => {
        window.location.href = 'create-event.html';
    });
});

// Editar evento
function editEvent(title) {
    alert(`Editar evento: ${title}`); // Aquí puedes redirigir a una página de edición
}

// Eliminar evento
async function deleteEvent(title) {
    const confirmed = confirm(`¿Seguro que deseas eliminar el evento "${title}"?`);
    if (confirmed) {
        try {
            const response = await fetch('http://localhost:3000/events', {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title }),
            });

            if (response.ok) {
                alert('Evento eliminado');
                window.location.reload();
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Error al eliminar el evento');
            }
        } catch (error) {
            console.error('Error al eliminar el evento:', error);
            alert('Error al eliminar el evento');
        }
    }
}
