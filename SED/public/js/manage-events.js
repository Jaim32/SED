document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('No estás autenticado');
        window.location.href = 'index.html';
        return;
    }

    const container = document.getElementById('manage-events-container');

    try {
        const response = await fetch('http://localhost:3000/events', {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            throw new Error('Error al cargar los eventos');
        }

        const events = await response.json();

        if (events.length === 0) {
            container.innerHTML = '<p>No hay eventos disponibles.</p>';
            return;
        }

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
    } catch (error) {
        console.error(error);
        alert('Error al cargar los eventos');
    }
});

async function deleteEvent(title) {
    const confirmed = confirm(`¿Estás seguro de eliminar el evento "${title}"?`);
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
                alert('Error al eliminar el evento');
            }
        } catch (error) {
            console.error('Error al eliminar el evento:', error);
        }
    }
}

function editEvent(title) {
    const newTitle = prompt('Nuevo título:', title);
    const newDate = prompt('Nueva fecha (YYYY-MM-DD):');
    const newLocation = prompt('Nueva ubicación:');
    const newDescription = prompt('Nueva descripción:');

    fetch('http://localhost:3000/events/edit', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, newTitle, newDate, newLocation, newDescription }),
    })
        .then(response => {
            if (response.ok) {
                alert('Evento editado exitosamente');
                window.location.reload();
            } else {
                alert('Error al editar el evento');
            }
        })
        .catch(error => {
            console.error('Error al editar el evento:', error);
        });
}
