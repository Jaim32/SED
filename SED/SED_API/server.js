require('dotenv').config();
const http = require('http'); // Mantén HTTP si NGINX maneja HTTPS
const url = require('url');
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const { connectToDatabase, closeDatabaseConnection } = require('./config/mongo');

// Configuración del puerto y orígenes permitidos
const PORT = process.env.PORT || 3001;
const allowedOrigins = [
    'http://localhost:3000',
    'http://192.168.58.104',
    'http://192.168.243.205',
    'https://example.com' // Añade aquí los dominios HTTPS si usas uno
];

async function startServer() {
    try {
        // Conexión a la base de datos
        await connectToDatabase();

        // Creación del servidor HTTP
        const server = http.createServer(async (req, res) => {
            try {
                const parsedUrl = url.parse(req.url, true);
                const method = req.method;

                // Manejo de CORS
                const origin = req.headers.origin;
                if (allowedOrigins.includes(origin)) {
                    res.setHeader('Access-Control-Allow-Origin', origin);
                    res.setHeader('Access-Control-Allow-Credentials', 'true');
                    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
                }

                // Manejo de solicitudes OPTIONS
                if (method === 'OPTIONS') {
                    res.writeHead(204);
                    res.end();
                    return;
                }

                // Rutas del servidor
                if (parsedUrl.pathname.startsWith('/auth')) {
                    await authRoutes(req, res, parsedUrl, method);
                } else if (parsedUrl.pathname.startsWith('/events')) {
                    await eventRoutes(req, res, parsedUrl, method);
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Ruta no encontrada' }));
                }
            } catch (error) {
                console.error('Error en el servidor:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Error interno del servidor' }));
            }
        });

        // Escuchar en localhost o una IP específica
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
        });

        // Cierre seguro de la conexión a la base de datos
        process.on('SIGINT', async () => {
            try {
                await closeDatabaseConnection();
            } finally {
                process.exit(0);
            }
        });

        process.on('SIGTERM', async () => {
            try {
                await closeDatabaseConnection();
            } finally {
                process.exit(0);
            }
        });
    } catch (error) {
        console.error('Error al iniciar el servidor:', error.message);
        process.exit(1);
    }
}

startServer();
