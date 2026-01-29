const fs = require('fs');
const path = require('path');
const { getPool } = require('../backend/config/db');

async function initDB() {
    try {
        const pool = getPool();
        const sqlPath = path.join(__dirname, '..', 'setup_puc.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Ejecutando SQL desde:', sqlPath);

        // Split commands if multiple (basic implementation)
        const commands = sql.split(';').filter(cmd => cmd.trim());

        for (const cmd of commands) {
            if (cmd.trim()) {
                await pool.query(cmd);
                console.log('Comando ejecutado exitosamente.');
            }
        }

        console.log('Tabla contabilidad_puc creada/verificada.');
        process.exit(0);
    } catch (error) {
        console.error('Error inicializando DB:', error);
        process.exit(1);
    }
}

initDB();
