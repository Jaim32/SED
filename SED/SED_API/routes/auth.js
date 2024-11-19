const { handleRegister, handleLogin } = require('../controllers/authController');

function authRoutes(req, res, parsedUrl, method) {
    if (parsedUrl.pathname === '/auth/register' && method === 'POST') {
        handleRegister(req, res);
    } else if (parsedUrl.pathname === '/auth/login' && method === 'POST') {
        handleLogin(req, res);
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Ruta no encontrada' }));
    }
}

module.exports = authRoutes;
