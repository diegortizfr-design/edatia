const { getPool } = require('../config/db');
const { connectToClientDB } = require('../config/dbFactory');

async function migrate() {
    const pool = getPool();
    let companies = [];

    try {
        const [rows] = await pool.query('SELECT * FROM empresasconfig');
        companies = rows;
    } catch (err) {
        console.error('Error fetching companies:', err);
        return;
    }

    for (const company of companies) {
        console.log(`Processing company: ${company.nombre_empresa} (NIT: ${company.nit})`);
        let clientConn = null;
        try {
            clientConn = await connectToClientDB(company);

            // 1. Roles Table
            await clientConn.query(`
                CREATE TABLE IF NOT EXISTS roles (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nombre VARCHAR(100) NOT NULL UNIQUE,
                    descripcion TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // 2. Cargos Table
            await clientConn.query(`
                CREATE TABLE IF NOT EXISTS cargos (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nombre VARCHAR(100) NOT NULL UNIQUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // 3. Alter Usuarios Table
            const [columns] = await clientConn.query('SHOW COLUMNS FROM usuarios');
            const colNames = columns.map(c => c.Field);

            if (!colNames.includes('rol_id')) {
                await clientConn.query('ALTER TABLE usuarios ADD COLUMN rol_id INT NULL');
            }
            if (!colNames.includes('cargo_id')) {
                await clientConn.query('ALTER TABLE usuarios ADD COLUMN cargo_id INT NULL');
            }
            if (!colNames.includes('estado')) {
                await clientConn.query("ALTER TABLE usuarios ADD COLUMN estado VARCHAR(20) DEFAULT 'Activo'");
            }
            if (!colNames.includes('telefono')) {
                await clientConn.query("ALTER TABLE usuarios ADD COLUMN telefono VARCHAR(50) NULL");
            }

            // 4. Seed Roles if empty
            const [rolesCount] = await clientConn.query('SELECT COUNT(*) as total FROM roles');
            if (rolesCount[0].total === 0) {
                await clientConn.query(`
                    INSERT INTO roles (nombre, descripcion) VALUES 
                    ('Administrador', 'Acceso total al sistema'),
                    ('Vendedor', 'Acceso a POS, Facturación y Clientes'),
                    ('Cajero', 'Acceso a POS y Recibos de Caja'),
                    ('Almacenista', 'Gestión de Inventarios y Productos'),
                    ('Contador', 'Acceso a Reportes y Contabilidad')
                `);
                console.log('Seeded roles.');
            }

            // 5. Seed Cargos if empty
            const [cargosCount] = await clientConn.query('SELECT COUNT(*) as total FROM cargos');
            if (cargosCount[0].total === 0) {
                await clientConn.query(`
                    INSERT INTO cargos (nombre) VALUES 
                    ('Gerente'),
                    ('Vendedor Mostrador'),
                    ('Cajero'),
                    ('Bodeguero'),
                    ('Contador Externo')
                `);
                console.log('Seeded cargos.');
            }

            console.log(`Successfully migrated ${company.nit}`);
        } catch (err) {
            console.error(`Error migrating ${company.nit}:`, err.message);
        } finally {
            if (clientConn) await clientConn.end();
        }
    }

    console.log('All migrations completed.');
    process.exit(0);
}

migrate();
