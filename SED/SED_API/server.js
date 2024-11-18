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

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const method = req.method;

    // Configuración de CORS
    res.setHeader('Access-Control-Allow-Origin', '*'); // Permitir todos los orígenes
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS'); // Métodos permitidos
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Cabeceras permitidas

    // Manejo de solicitudes preflight (OPTIONS)
    if (method === 'OPTIONS') {
        res.writeHead(204); // No Content
        res.end();
        return;
    }

    // Manejo de rutas
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
    } else if (parsedUrl.pathname === '/events' && method === 'DELETE') {
        handleDeleteEvent(req, res);
    } else if (parsedUrl.pathname === '/events/edit' && method === 'POST') {
        handleEditEvent(req, res);
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Ruta no encontrada' }));
    }
});

function handleRegister(req, res) {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
        const { name, email, password, role } = JSON.parse(body);
        if (data.users.find(user => user.email === email)) {
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

function handleLogin(req, res) {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
        try {
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
        } catch (error) {
            console.error('Error en el inicio de sesión:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Error interno del servidor' }));
        }
    });
}

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

function handleCreateEvent(req, res) {
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
            if (decoded.role !== 'eventcreator' && decoded.role !== 'superadmin') {
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'No tienes permisos para crear eventos' }));
                return;
            }
            const { title, date, location, description } = JSON.parse(body);
            const newEvent = { title, date, location, description, user: decoded.email };
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

function handleDeleteEvent(req, res) {
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
            if (decoded.role !== 'superadmin') {
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'No tienes permisos para eliminar eventos' }));
                return;
            }
            const { title } = JSON.parse(body);
            data.events = data.events.filter(event => event.title !== title);
            saveData();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Evento eliminado exitosamente' }));
        } catch {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Token inválido' }));
        }
    });
}

function handleEditEvent(req, res) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        res.writeHead(401);
        res.end(JSON.stringify({ message: 'No autorizado' }));
        return;
    }
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
        try {
            const decoded = jwt.verify(token, SECRET);
            console.log('Token decodificado:', decoded);

            const { title, newTitle, newDate, newLocation, newDescription } = JSON.parse(body);
            console.log('Datos recibidos para editar:', { title, newTitle, newDate, newLocation, newDescription });

            const eventIndex = data.events.findIndex(event => event.title === title);
            if (eventIndex === -1) {
                res.writeHead(404);
                res.end(JSON.stringify({ message: 'Evento no encontrado' }));
                return;
            }

            const event = data.events[eventIndex];

            // Permitir que el superadmin edite cualquier evento
            if (decoded.role === 'superadmin') {
                data.events[eventIndex] = {
                    ...event,
                    title: newTitle || event.title,
                    date: newDate || event.date,
                    location: newLocation || event.location,
                    description: newDescription || event.description,
                };
            }
            // Permitir que el creador del evento edite solo sus eventos
            else if (decoded.role === 'eventcreator' && event.user === decoded.email) {
                data.events[eventIndex] = {
                    ...event,
                    title: newTitle || event.title,
                    date: newDate || event.date,
                    location: newLocation || event.location,
                    description: newDescription || event.description,
                };
            } else {
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'No tienes permisos para editar este evento' }));
                return;
            }

            saveData();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Evento editado exitosamente' }));
        } catch (err) {
            console.error('Error al procesar la solicitud:', err);
            res.writeHead(401);
            res.end(JSON.stringify({ message: 'Token inválido o datos inválidos' }));
        }
    });
}


function saveData() {
    fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));
}

server.listen(PORT, () => {
    console.log(`API corriendo en http://localhost:${PORT}`);
});
