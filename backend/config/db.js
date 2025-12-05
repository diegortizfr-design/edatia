// backend/config/db.js
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config({ path: './datos.env' }); // o '.env'

const {
    DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_CONNECTION_LIMIT
} = process.env;

let pool;

function createPool() {
    pool = mysql.createPool({
        host: DB_HOST || '127.0.0.1',
        port: DB_PORT ? Number(DB_PORT) : 3306,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
        waitForConnections: true,
        connectionLimit: DB_CONNECTION_LIMIT ? Number(DB_CONNECTION_LIMIT) : 10,
        queueLimit: 0,
        timezone: '+00:00'
    });

    // opcional: comprobar conexión
    pool.getConnection()
        .then(conn => {
            return conn.ping()
                .then(() => {
                    conn.release();
                    console.log('MySQL pool conectado');
                });
        })
        .catch(err => {
            console.error('Error conectando a MySQL pool:', err.message);
        });

    return pool;
}

function getPool() {
    if (!pool) createPool();
    return pool;
}

module.exports = { createPool, getPool };
