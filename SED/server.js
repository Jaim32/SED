const http = require('http');
const fs = require('fs');
const url = require('url');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Cargar datos desde el archivo data.json
let data = JSON.parse(fs.readFileSync('./data.json', 'utf-8'));

const SECRET = 'secret';

// Crear usuario administrador predeterminado si no existe
const adminUser = {
    name: 'Admin',
    email: 'admin',
    password: bcrypt.hashSync('admin', 10),
    role: 'superadmin',
};
if (!data.users.some(user => user.email === 'admin')) {
    data.users.push(adminUser);
    saveData();
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const method = req.method;

    console.log('Solicitud recibida:', parsedUrl.pathname);

    if (parsedUrl.pathname === '/favicon.ico') {
        res.writeHead(204); // No Content
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
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

// Servir archivos estáticos
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

// Registro de usuarios
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
        res.writeHead(401);
        res.end(JSON.stringify({ message: 'No autorizado' }));
        return;
    }
    try {
        jwt.verify(token, SECRET); // Verifica el token
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data.events)); // Devuelve todos los eventos
    } catch (err) {
        console.error('Error al verificar token:', err);
        res.writeHead(403);
        res.end(JSON.stringify({ message: 'Token inválido o no autorizado' }));
    }
}

// Obtener eventos creados por un usuario específico
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

// Crear un nuevo evento
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

// Eliminar un evento
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
        } catch {
            res.writeHead(401);
            res.end('Token inválido');
        }
    });
}

// Guardar datos en data.json
function saveData() {
    fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));
}

server.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});
