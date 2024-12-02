require('dotenv').config();
const http = require('http');
const url = require('url');
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const { connectToDatabase, closeDatabaseConnection } = require('./config/mongo'); // Conexión a MongoDB

const PORT = process.env.PORT || 3001;

async function startServer() {
    try {
        // Conectar a la base de datos antes de iniciar el servidor
        await connectToDatabase();
        console.log('Conectado a la base de datos MongoDB');

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

        // Manejo de cierre del servidor
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
        console.error('Error al iniciar el servidor:', error);
        process.exit(1);
    }
}
//commit
startServer();
