require('dotenv').config();
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');

async function createSuperAdmin() {
    const uri = process.env.MONGO_URI; // URI de MongoDB desde el archivo .env
    const dbName = process.env.MONGO_DB_NAME; // Nombre de la base de datos desde el archivo .env

    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        console.log('Conectado a MongoDB');

        const db = client.db(dbName);
        const usersCollection = db.collection('users');

        // Verifica si el usuario ya existe
        const email = 'admin_madrugado@admin.com';
        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
            console.log('El usuario superadmin ya existe.');
            return;
        }

        // Crea el usuario superadmin
        const hashedPassword = await bcrypt.hash('Madrugadores_3.0', 10);
        const superAdmin = {
            name: 'Admin Madrugado',
            email: email,
            password: hashedPassword,
            role: 'superadmin',
        };

        await usersCollection.insertOne(superAdmin);
        console.log('Usuario superadmin creado exitosamente.');
    } catch (error) {
        console.error('Error al crear el usuario superadmin:', error);
    } finally {
        await client.close();
        console.log('Conexión a MongoDB cerrada.');
    }
}

createSuperAdmin();
