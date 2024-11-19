const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const uri = process.env.MONGO_URI;
let client = null;
let dbInstance = null;

async function connectToDatabase() {
    if (dbInstance) {
        console.log('Conexión reutilizada a MongoDB');
        return dbInstance;
    }

    try {
        client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        console.log('Conectado a MongoDB');
        dbInstance = client.db(process.env.MONGO_DB_NAME);
        return dbInstance;
    } catch (error) {
        console.error('Error al conectar a MongoDB:', error);
        throw error;
    }
}

async function closeDatabaseConnection() {
    if (client) {
        try {
            await client.close();
            console.log('Conexión a MongoDB cerrada');
            client = null;
            dbInstance = null;
        } catch (error) {
            console.error('Error al cerrar la conexión con MongoDB:', error);
            throw error;
        }
    }
}

module.exports = { connectToDatabase, closeDatabaseConnection };
