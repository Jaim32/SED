const http = require('http');
const fs = require('fs');
const url = require('url');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const PORT = 3001;
let data = JSON.parse(fs.readFileSync('./data.json', 'utf-8'));

const SECRET = 'secret';

// Usuario superadmin quemado
const adminUser = {
    name: 'Super Admin',
    email: 'admin@admin.com',
    password: bcrypt.hashSync('admin', 10),
    role: 'superadmin',
};
if (!data.users.some(user => user.email === 'admin@admin.com')) {
    data.users.push(adminUser);
    saveData();
}

// Crear el servidor
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const method = req.method;

    // Configuración de CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Rutas de la API
    if (parsedUrl.pathname === '/register' && method === 'POST') {
        handleRegister(req, res);
    } else if (parsedUrl.pathname === '/login' && method === 'POST') {
        handleLogin(req, res);
    } else if (parsedUrl.pathname === '/events' && method === 'GET') {
        handleGetEvents(req, res);
    } else if (parsedUrl.pathname === '/my-events' && method === 'GET') {
        handleGetMyEvents(req, res);
    } else if (parsedUrl.pathname === '/events' && method === 'POST') {
        handleCreateEvent(req, res);
    } else if (parsedUrl.pathname === '/events/edit' && method === 'POST') {
        handleEditEvent(req, res);
    } else if (parsedUrl.pathname === '/events' && method === 'DELETE') {
        handleDeleteEvent(req, res);
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Ruta no encontrada' }));
    }
});

// Funciones auxiliares
function saveData() {
    fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));
}

function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Registro de usuario
function handleRegister(req, res) {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
        const { name, email, password, role } = JSON.parse(body);
        if (data.users.some(user => user.email === email)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Usuario ya registrado' }));
            return;
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { name, email, password: hashedPassword, role };
        data.users.push(newUser);
        saveData();
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Usuario registrado' }));
    });
}

// Inicio de sesión
function handleLogin(req, res) {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
        const { email, password } = JSON.parse(body);
        const user = data.users.find(user => user.email === email);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Credenciales inválidas' }));
            return;
        }
        const token = jwt.sign({ email: user.email, role: user.role }, SECRET, { expiresIn: '1h' });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ token }));
    });
}

// Obtener todos los eventos
function handleGetEvents(req, res) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'No autorizado' }));
        return;
    }
    try {
        jwt.verify(token, SECRET);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data.events));
    } catch {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Token inválido o no autorizado' }));
    }
}

// Obtener eventos del usuario
function handleGetMyEvents(req, res) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'No autorizado' }));
        return;
    }
    try {
        const decoded = jwt.verify(token, SECRET);
        const myEvents = data.events.filter(event => event.user === decoded.email);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(myEvents));
    } catch {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Token inválido' }));
    }
}

// Crear evento
function handleCreateEvent(req, res) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end('No autorizado');
        return;
    }
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
        try {
            const decoded = jwt.verify(token, SECRET);
            if (decoded.role !== 'eventcreator' && decoded.role !== 'superadmin') {
                res.writeHead(403);
                res.end(JSON.stringify({ message: 'No tienes permisos para crear eventos' }));
                return;
            }
            const { title, date, location, description, hour, contact } = JSON.parse(body);

            if (!validateEmail(contact)) {
                res.writeHead(400);
                res.end(JSON.stringify({ message: 'El contacto debe ser un correo electrónico válido' }));
                return;
            }

            const newEvent = { title, date, location, description, hour, contact, user: decoded.email };
            data.events.push(newEvent);
            saveData();
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Evento creado exitosamente' }));
        } catch {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Token inválido' }));
        }
    });
}

// Editar evento
function handleEditEvent(req, res) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'No autorizado' }));
        return;
    }
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
        try {
            const decoded = jwt.verify(token, SECRET);
            const { title, newTitle, newDate, newLocation, newDescription, newHour, newContact } = JSON.parse(body);

            if (newContact && !validateEmail(newContact)) {
                res.writeHead(400);
                res.end(JSON.stringify({ message: 'El contacto debe ser un correo electrónico válido' }));
                return;
            }

            const eventIndex = data.events.findIndex(event => event.title === title);
            if (eventIndex === -1) {
                res.writeHead(404);
                res.end(JSON.stringify({ message: 'Evento no encontrado' }));
                return;
            }

            const updatedEvent = {
                ...data.events[eventIndex],
                title: newTitle || data.events[eventIndex].title,
                date: newDate || data.events[eventIndex].date,
                location: newLocation || data.events[eventIndex].location,
                description: newDescription || data.events[eventIndex].description,
                hour: newHour || data.events[eventIndex].hour,
                contact: newContact || data.events[eventIndex].contact,
            };

            data.events[eventIndex] = updatedEvent;
            saveData();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Evento editado exitosamente' }));
        } catch {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Token inválido' }));
        }
    });
}

// Iniciar el servidor
server.listen(PORT, () => {
    console.log(`API corriendo en http://localhost:${PORT}`);
});
