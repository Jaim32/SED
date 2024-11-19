document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        alert('No estás autenticado');
        window.location.href = 'index.html';
        return;
    }

    const form = document.getElementById('create-event-form');

    if (!form) {
        console.error('Formulario no encontrado. Asegúrate de que el elemento con ID "create-event-form" exista en el HTML.');
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('title')?.value;
        const date = document.getElementById('date')?.value;
        const hour = document.getElementById('hour')?.value;
        const location = document.getElementById('location')?.value;
        const description = document.getElementById('description')?.value;
        const contact = document.getElementById('contact')?.value;

        // Verificar que todos los campos están completos
        if (!title || !date || !hour || !location || !description || !contact) {
            alert('Por favor, completa todos los campos.');
            return;
        }

        try {
            const response = await fetch('http://localhost:3001/events', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title, date, hour, location, description, contact }),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                    localStorage.removeItem('token');
                    window.location.href = 'index.html';
                    return;
                }
                if (response.status === 403) {
                    alert('No tienes permisos para crear eventos.');
                    return;
                }
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al crear el evento');
            }

            alert('Evento creado exitosamente');
            window.location.href = 'my-events.html'; // Redirige a "Mis Eventos"
        } catch (error) {
            console.error('Error al crear el evento:', error);
            alert(error.message || 'Error al crear el evento');
        }
    });
});
