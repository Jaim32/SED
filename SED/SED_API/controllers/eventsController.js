const { data, saveData } = require('../config/database');
const { validateEmail } = require('../utils/validations');

function getEvents(req, res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data.events));
}

function getMyEvents(req, res, decoded) {
    const myEvents = data.events.filter(event => event.user === decoded.email);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(myEvents));
}

function createEvent(req, res, decoded) {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
        const { title, date, location, description, hour, contact } = JSON.parse(body);

        if (!title || !date || !location || !description || !hour || !contact || !validateEmail(contact)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Campos inválidos' }));
            return;
        }

        const newEvent = { title, date, location, description, hour, contact, user: decoded.email };
        data.events.push(newEvent);
        saveData();
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Evento creado exitosamente' }));
    });
}

function editEvent(req, res, decoded) {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
        const { title, newTitle, newDate, newLocation, newDescription, newHour, newContact } = JSON.parse(body);

        if (newContact && !validateEmail(newContact)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'El contacto debe ser un correo electrónico válido' }));
            return;
        }

        const eventIndex = data.events.findIndex(event => event.title === title);
        if (eventIndex === -1) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Evento no encontrado' }));
            return;
        }

        if (decoded.role === 'superadmin' || data.events[eventIndex].user === decoded.email) {
            data.events[eventIndex] = {
                ...data.events[eventIndex],
                title: newTitle || data.events[eventIndex].title,
                date: newDate || data.events[eventIndex].date,
                location: newLocation || data.events[eventIndex].location,
                description: newDescription || data.events[eventIndex].description,
                hour: newHour || data.events[eventIndex].hour,
                contact: newContact || data.events[eventIndex].contact,
            };
            saveData();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Evento editado exitosamente' }));
        } else {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'No autorizado' }));
        }
    });
}

function deleteEvent(req, res, decoded) {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
        const { title } = JSON.parse(body);

        const eventIndex = data.events.findIndex(event => event.title === title);
        if (eventIndex === -1) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Evento no encontrado' }));
            return;
        }

        if (decoded.role === 'superadmin' || data.events[eventIndex].user === decoded.email) {
            data.events.splice(eventIndex, 1);
            saveData();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Evento eliminado exitosamente' }));
        } else {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'No autorizado' }));
        }
    });
}

module.exports = { getEvents, getMyEvents, createEvent, editEvent, deleteEvent };
