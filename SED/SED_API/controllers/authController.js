const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { data, saveData } = require('../config/database');

function handleRegister(req, res) {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
        const { name, email, password, role } = JSON.parse(body);
        if (data.users.some(user => user.email === email)) {
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
        const token = jwt.sign({ email: user.email, role: user.role }, process.env.SECRET, { expiresIn: '1h' });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ token }));
    });
}

module.exports = { handleRegister, handleLogin };
