const { getPool } = require('./backend/config/db');

async function findNit() {
    const pool = getPool();
    try {
        const [rows] = await pool.query('SELECT nit, nombre_empresa FROM empresasconfig');
        console.log("Empresas configuradas (NITs):");
        console.table(rows);
    } catch (err) {
        console.error("Error consultando empresasconfig:", err);
    } finally {
        process.exit(0);
    }
}

findNit();
