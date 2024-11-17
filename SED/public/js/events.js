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

        // Mostrar el botón dinámico según el rol del usuario
        const buttonContainer = document.getElementById('button-container');

        if (userRole === 'eventcreator') {
            const myEventsButton = document.createElement('button');
            myEventsButton.textContent = 'Ver Mis Eventos';
            myEventsButton.onclick = () => {
                window.location.href = 'my-events.html';
            };
            buttonContainer.appendChild(myEventsButton);
        } else if (userRole === 'superadmin') {
            const manageEventsButton = document.createElement('button');
            manageEventsButton.textContent = 'Gestionar Eventos';
            manageEventsButton.onclick = () => {
                window.location.href = 'manage-events.html';
            };
            buttonContainer.appendChild(manageEventsButton);
        }

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
        const container = document.getElementById('events-container');

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
                `;
                container.appendChild(div);
            });
        }
    } catch (error) {
        console.error('Error al realizar la solicitud:', error);
        alert('Error al cargar los eventos');
    }
});
