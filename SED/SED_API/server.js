require('dotenv').config();
const http = require('http');
const url = require('url');
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const { connectToDatabase, closeDatabaseConnection } = require('./config/mongo'); // Conexión a MongoDB

const PORT = process.env.PORT || 3001;
const allowedOrigins = ['http://localhost:3000', 'http://192.168.58.104:3000'];

async function startServer() {
    try {
        await connectToDatabase();
        console.log('Conectado a la base de datos MongoDB');

        const server = http.createServer(async (req, res) => {
            try {
                const parsedUrl = url.parse(req.url, true);
                const method = req.method;

                // Configuración de CORS
                const origin = req.headers.origin;
                if (allowedOrigins.includes(origin)) {
                    res.setHeader('Access-Control-Allow-Origin', origin);
                    res.setHeader('Access-Control-Allow-Credentials', 'true');
                    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
                } else {
                    res.setHeader('Access-Control-Allow-Origin', 'null');
                }


                if (method === 'OPTIONS') {
                    res.writeHead(204);
                    res.end();
                    return;
                }

                // Rutas
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

        server.listen(PORT, '192.168.58.104', () => {
            console.log(`Servidor corriendo en http://192.168.58.104:${PORT}`);
        });

        process.on('SIGINT', async () => {
            console.log('\nCerrando el servidor...');
            try {
                await closeDatabaseConnection();
                console.log('Conexión a MongoDB cerrada');
            } catch (error) {
                console.error('Error al cerrar la conexión a MongoDB:', error);
            }
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            console.log('\nCerrando el servidor...');
            try {
                await closeDatabaseConnection();
                console.log('Conexión a MongoDB cerrada');
            } catch (error) {
                console.error('Error al cerrar la conexión a MongoDB:', error);
            }
            process.exit(0);
        });
    } catch (error) {
        console.error('Error al iniciar el servidor:', error.message);
        process.exit(1);
    }
}

startServer();
