const { connectToDatabase } = require('../config/mongo');
const { ObjectId } = require('mongodb');
const { validateEmail } = require('../utils/validations');

// Obtener todos los eventos
async function getEvents(req, res) {
    try {
        const db = await connectToDatabase();
        const events = await db.collection('events').find({}).toArray();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(events));
    } catch (error) {
        console.error('Error al obtener eventos:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Error interno del servidor' }));
    }
}

// Obtener eventos del usuario autenticado
async function getMyEvents(req, res, decoded) {
    try {
        const db = await connectToDatabase();
        const events = await db.collection('events').find({ user: decoded.email }).toArray();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(events));
    } catch (error) {
        console.error('Error al obtener eventos del usuario:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Error interno del servidor' }));
    }
}

// Crear un nuevo evento
async function createEvent(req, res, decoded) {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
        try {
            const { title, date, location, description, hour, contact } = JSON.parse(body);

            if (!title || !date || !location || !description || !hour || !contact || !validateEmail(contact)) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Campos inválidos' }));
                return;
            }

            const newEvent = { title, date, location, description, hour, contact, user: decoded.email };
            const db = await connectToDatabase();
            await db.collection('events').insertOne(newEvent);

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Evento creado exitosamente' }));
        } catch (error) {
            console.error('Error al crear el evento:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Error interno del servidor' }));
        }
    });
}

// Editar un evento existente
async function editEvent(req, res, decoded) {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
        try {
            const { id, newTitle, newDate, newLocation, newDescription, newHour, newContact } = JSON.parse(body);

            if (!ObjectId.isValid(id)) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'ID de evento inválido' }));
                return;
            }

            if (newContact && !validateEmail(newContact)) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'El contacto debe ser un correo electrónico válido' }));
                return;
            }

            const db = await connectToDatabase();
            const event = await db.collection('events').findOne({ _id: new ObjectId(id) });

            if (!event) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Evento no encontrado' }));
                return;
            }

            if (decoded.role !== 'superadmin' && event.user !== decoded.email) {
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'No autorizado' }));
                return;
            }

            const updatedEvent = {
                title: newTitle || event.title,
                date: newDate || event.date,
                location: newLocation || event.location,
                description: newDescription || event.description,
                hour: newHour || event.hour,
                contact: newContact || event.contact,
            };

            await db.collection('events').updateOne({ _id: new ObjectId(id) }, { $set: updatedEvent });

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Evento editado exitosamente' }));
        } catch (error) {
            console.error('Error al editar el evento:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Error interno del servidor' }));
        }
    });
}

// Eliminar un evento
async function deleteEvent(req, res, decoded) {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
        try {
            const { id } = JSON.parse(body);

            if (!ObjectId.isValid(id)) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'ID de evento inválido' }));
                return;
            }

            const db = await connectToDatabase();
            const event = await db.collection('events').findOne({ _id: new ObjectId(id) });

            if (!event) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Evento no encontrado' }));
                return;
            }

            if (decoded.role !== 'superadmin' && event.user !== decoded.email) {
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'No autorizado' }));
                return;
            }

            await db.collection('events').deleteOne({ _id: new ObjectId(id) });

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Evento eliminado exitosamente' }));
        } catch (error) {
            console.error('Error al eliminar el evento:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Error interno del servidor' }));
        }
    });
}

module.exports = { getEvents, getMyEvents, createEvent, editEvent, deleteEvent };
