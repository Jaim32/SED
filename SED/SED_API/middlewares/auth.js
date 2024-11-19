const jwt = require('jsonwebtoken');

// Middleware para autenticar al usuario
function authenticate(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1]; // Obtener el token del encabezado
    if (!token) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'No autorizado: Token faltante' }));
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET); // Verificar el token
        next(decoded); // Pasar el token decodificado al siguiente middleware/controlador
    } catch (error) {
        console.error('Error al verificar el token:', error);
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Token inválido o expirado' }));
    }
}

module.exports = { authenticate };
