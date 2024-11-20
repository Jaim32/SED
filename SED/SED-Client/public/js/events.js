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
        const eventsContainer = document.getElementById('events-container');
        const searchInput = document.getElementById('search-input');

        if (!buttonContainer || !eventsContainer || !searchInput) {
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

        // Función para cargar y filtrar eventos
        async function loadEvents(searchQuery = '') {
            const response = await fetch('http://192.168.243.205:3001/events', {
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

            // Filtrar eventos según la búsqueda
            const filteredEvents = events.filter(event => {
                const lowerCaseQuery = searchQuery.toLowerCase();
                return event.title.toLowerCase().includes(lowerCaseQuery) || 
                       event.description.toLowerCase().includes(lowerCaseQuery);
            });

            // Limpiar el contenedor de eventos
            eventsContainer.innerHTML = '';

            if (filteredEvents.length === 0) {
                eventsContainer.innerHTML = '<p class="empty-message">No hay eventos disponibles.</p>';
                return;
            }

            // Mostrar eventos filtrados como tarjetas
            filteredEvents.forEach(event => {
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
                eventsContainer.appendChild(card);
            });
        }

        // Cargar eventos iniciales sin filtro
        await loadEvents();

        // Escuchar el evento de entrada en el campo de búsqueda
        searchInput.addEventListener('input', () => {
            const searchQuery = searchInput.value.trim(); // Texto de búsqueda
            loadEvents(searchQuery); // Recargar eventos con el filtro aplicado
        });

    } catch (error) {
        console.error('Error al cargar los eventos:', error);
        alert('Error al cargar los eventos');
    }
});
