const { createPool, getPool } = require('./config/db');
const dotenv = require('dotenv');
dotenv.config({ path: './datos.env' });

async function debug() {
    try {
        await createPool();
        const pool = getPool();
        console.log('Querying for NIT: 1143875756');
        const [rows] = await pool.query("SELECT * FROM empresasconfig WHERE nit = '1143875756'");
        console.log('Result:', rows);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

debug();
