const { getPool } = require('./backend/config/db');

async function check() {
    try {
        const pool = getPool();
        const [rows] = await pool.query('SHOW COLUMNS FROM productos');
        console.log('COLUMNS_START');
        console.log(JSON.stringify(rows));
        console.log('COLUMNS_END');
    } catch (err) {
        console.error('ERROR_START');
        console.error(err.message);
        console.error('ERROR_END');
    } finally {
        process.exit(0);
    }
}

check();
