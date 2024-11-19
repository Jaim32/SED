const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'No autorizado' }));
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET);
        next(decoded);
    } catch {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Token inválido' }));
    }
}

module.exports = { authenticate };
