require('dotenv').config();
const http = require('http');
const url = require('url');
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');

const PORT = process.env.PORT || 3001;

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const method = req.method;

    // Configuración de CORS
    res.setHeader('Access-Control-Allow-Origin', '*'); // Permitir todos los orígenes
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); // Métodos permitidos
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Cabeceras permitidas

    // Manejo de preflight (OPTIONS)
    if (method === 'OPTIONS') {
        res.writeHead(204); // No Content
        res.end();
        return;
    }

    // Rutas de la API
    if (parsedUrl.pathname.startsWith('/auth')) {
        authRoutes(req, res, parsedUrl, method);
    } else if (parsedUrl.pathname.startsWith('/events')) {
        eventRoutes(req, res, parsedUrl, method);
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Ruta no encontrada' }));
    }
});

server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
