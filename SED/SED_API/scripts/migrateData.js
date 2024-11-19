const fs = require('fs');
const connectToDatabase = require('../config/database');

async function migrateData() {
    const db = await connectToDatabase();
    const eventsCollection = db.collection('events');
    const usersCollection = db.collection('users');

    // Lee el archivo data.json
    const data = JSON.parse(fs.readFileSync('./data.json', 'utf-8'));

    // Inserta eventos
    if (data.events && data.events.length > 0) {
        await eventsCollection.insertMany(data.events);
        console.log('Eventos migrados a MongoDB');
    }

    // Inserta usuarios
    if (data.users && data.users.length > 0) {
        await usersCollection.insertMany(data.users);
        console.log('Usuarios migrados a MongoDB');
    }

    process.exit();
}

migrateData().catch(err => {
    console.error('Error en la migración:', err);
    process.exit(1);
});
