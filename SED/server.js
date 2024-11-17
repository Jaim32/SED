const http = require('http');
const fs = require('fs');
const url = require('url');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

let data = JSON.parse(fs.readFileSync('./data.json', 'utf-8'));

const SECRET = 'secret';

// Usuario superadmin quemado
const adminUser = {
    name: 'Super Admin',
    email: 'admin@admin.com',
    password: bcrypt.hashSync('admin', 10), // Contraseña "admin"
    role: 'superadmin',
};
if (!data.users.some(user => user.email === 'admin@admin.com')) {
    data.users.push(adminUser);
    saveData();
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const method = req.method;

    console.log('Solicitud recibida:', parsedUrl.pathname);

    if (parsedUrl.pathname === '/favicon.ico') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.url.startsWith('/public/')) {
        serveStaticFile(req.url, res);
    } else if (parsedUrl.pathname === '/register' && method === 'POST') {
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
        res.writeHead(404);
        res.end('Not Found');
    }
});

function serveStaticFile(filePath, res) {
    const fullPath = `.${filePath}`;
    fs.readFile(fullPath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Archivo no encontrado');
        } else {
            const ext = filePath.split('.').pop();
            const contentType =
                ext === 'css' ? 'text/css' :
                ext === 'js' ? 'application/javascript' :
                'text/html';
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
    });
}

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

function handleGetEvents(req, res) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        res.writeHead(401);
        res.end(JSON.stringify({ message: 'No autorizado' }));
        return;
    }
    try {
        jwt.verify(token, SECRET);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data.events));
    } catch (err) {
        console.error('Error al verificar token:', err);
        res.writeHead(403);
        res.end(JSON.stringify({ message: 'Token inválido o no autorizado' }));
    }
}

function handleGetMyEvents(req, res) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        res.writeHead(401);
        res.end('No autorizado');
        return;
    }
    try {
        const decoded = jwt.verify(token, SECRET);
        const myEvents = data.events.filter(event => event.user === decoded.email);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(myEvents));
    } catch {
        res.writeHead(401);
        res.end('Token inválido');
    }
}

function handleCreateEvent(req, res) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        res.writeHead(401);
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
            const { title, date, location, description } = JSON.parse(body);
            const newEvent = { title, date, location, description, user: decoded.email };
            data.events.push(newEvent);
            saveData();
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Evento creado exitosamente' }));
        } catch {
            res.writeHead(401);
            res.end('Token inválido');
        }
    });
}


function handleDeleteEvent(req, res) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        res.writeHead(401);
        res.end('No autorizado');
        return;
    }
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
        try {
            const decoded = jwt.verify(token, SECRET);
            if (decoded.role !== 'superadmin') {
                res.writeHead(403);
                res.end(JSON.stringify({ message: 'No tienes permisos para eliminar eventos' }));
                return;
            }
            const { title } = JSON.parse(body);
            data.events = data.events.filter(event => event.title !== title);
            saveData();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Evento eliminado exitosamente' }));
        } catch (err) {
            console.error('Error al procesar la solicitud:', err);
            res.writeHead(401);
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
            if (decoded.role !== 'superadmin') {
                res.writeHead(403);
                res.end(JSON.stringify({ message: 'No tienes permisos para editar eventos' }));
                return;
            }
            const { title, newTitle, newDate, newLocation, newDescription } = JSON.parse(body);
            const eventIndex = data.events.findIndex(event => event.title === title);
            if (eventIndex === -1) {
                res.writeHead(404);
                res.end(JSON.stringify({ message: 'Evento no encontrado' }));
                return;
            }
            data.events[eventIndex] = {
                ...data.events[eventIndex],
                title: newTitle || data.events[eventIndex].title,
                date: newDate || data.events[eventIndex].date,
                location: newLocation || data.events[eventIndex].location,
                description: newDescription || data.events[eventIndex].description,
            };
            saveData();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Evento editado exitosamente' }));
        } catch (err) {
            console.error('Error al procesar la solicitud:', err);
            res.writeHead(401);
            res.end(JSON.stringify({ message: 'Token inválido' }));
        }
    });
}

function saveData() {
    fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));
}

server.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});
