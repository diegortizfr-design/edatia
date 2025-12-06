// backend/config/dbFactory.js
const mysql = require('mysql2/promise');

/**
 * Crea una conexión a una base de datos específica de un cliente
 * @param {Object} config Configuración de la DB (host, user, password, database)
 * @returns {Promise<mysql.Connection>} Objeto de conexión
 */
async function connectToClientDB(config) {
    try {
        const connection = await mysql.createConnection({
            host: config.db_host,
            user: config.db_user,
            password: config.db_password,
            database: config.db_name,
            port: config.db_port || 3306
        });
        return connection;
    } catch (error) {
        console.error('Error conectando a DB cliente:', error.message);
        throw new Error('No se pudo conectar a la base de datos de la empresa');
    }
}

module.exports = { connectToClientDB };
