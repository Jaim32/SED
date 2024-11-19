const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { connectToDatabase } = require('../config/mongo');

// Manejar el registro de usuarios
async function handleRegister(req, res) {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
        try {
            const { name, email, password, role } = JSON.parse(body);

            const db = await connectToDatabase();
            const existingUser = await db.collection('users').findOne({ email });

            if (existingUser) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Usuario ya registrado' }));
                return;
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = { name, email, password: hashedPassword, role };

            await db.collection('users').insertOne(newUser);

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Usuario registrado exitosamente' }));
        } catch (error) {
            console.error('Error al registrar usuario:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Error interno del servidor' }));
        }
    });
}

// Manejar el inicio de sesión
async function handleLogin(req, res) {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
        try {
            const { email, password } = JSON.parse(body);

            const db = await connectToDatabase();
            const user = await db.collection('users').findOne({ email });

            if (!user || !(await bcrypt.compare(password, user.password))) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Credenciales inválidas' }));
                return;
            }

            const token = jwt.sign({ email: user.email, role: user.role }, process.env.SECRET, { expiresIn: '1h' });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ token }));
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Error interno del servidor' }));
        }
    });
}

module.exports = { handleRegister, handleLogin };
