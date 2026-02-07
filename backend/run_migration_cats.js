
const { getPool } = require('./config/db');
require('dotenv').config();

async function runMigration() {
    console.log('Starting migration...');
    const pool = getPool();

    try {
        // Connect to the specific database
        // Note: In this architecture, usually we connect to `admin_db` or similar to find tenants
        // But here we likely want to update the specific tenant DB `diegortizfr_design_erpod`
        // We will maintain the pattern of connecting via pool which might be root or specific.
        // Let's assume pool connects to the server and we can switch DB or query directly.

        // Check current DB
        const [rows] = await pool.query('SELECT DATABASE() as db');
        console.log('Connected to:', rows[0].db);

        // We need to run this on `diegortizfr_design_erpod`
        await pool.query('USE diegortizfr_design_erpod');

        const sql = `
            CREATE TABLE IF NOT EXISTS categorias_productos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL UNIQUE,
                descripcion TEXT,
                activo TINYINT(1) DEFAULT 1,
                empresa_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await pool.query(sql);
        console.log('Table `categorias_productos` created or already exists.');

        const populateSql = `
            INSERT IGNORE INTO categorias_productos (nombre)
            SELECT DISTINCT categoria FROM productos 
            WHERE categoria IS NOT NULL AND categoria != ''
        `;
        const [res] = await pool.query(populateSql);
        console.log(`Populated ${res.affectedRows} categories from existing products.`);

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
