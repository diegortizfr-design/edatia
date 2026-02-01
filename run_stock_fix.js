const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Adjust paths based on running from root
const dbPath = './backend/config/db.js';
const dbFactoryPath = './backend/config/dbFactory.js';

if (!fs.existsSync(dbPath)) {
    console.error(`Cannot find ${dbPath}. Make sure you are running from the project root.`);
    process.exit(1);
}

const { createPool, getPool } = require(dbPath);
const { connectToClientDB } = require(dbFactoryPath);

// Manually load env
function loadEnv() {
    const paths = ['datos.env', 'backend/datos.env', '.env', 'backend/.env'];
    for (const p of paths) {
        if (fs.existsSync(p)) {
            console.log(`Loading env from ${p}`);
            require('dotenv').config({ path: p });
            return;
        }
    }
    console.warn("No .env file found!");
}

loadEnv();

async function run() {
    console.log("Starting stock_minimo fix...");
    const pool = getPool();

    // Get all tenants
    let tenants = [];
    try {
        const [rows] = await pool.query('SELECT * FROM empresasconfig');
        tenants = rows;
    } catch (e) {
        console.error("Error fetching tenants:", e.message);
        process.exit(1);
    }

    console.log(`Found ${tenants.length} tenants.`);

    for (const tenant of tenants) {
        console.log(`Processing tenant: ${tenant.nombre_comercial || 'Unknown'} (NIT: ${tenant.nit})`);
        let conn;
        try {
            conn = await connectToClientDB(tenant);

            // 1. Check if column exists and modify default
            console.log("  > Modifying DEFAULT value...");
            try {
                // We don't check existence, we just try to modify. 
                // If it fails, it might mean table doesn't exist, which is fine to catch.
                await conn.query(`ALTER TABLE productos MODIFY COLUMN stock_minimo INT DEFAULT 5`);
                console.log("    Success.");
            } catch (e) {
                console.error(`    Failed: ${e.message}`);
            }

            // 2. Update existing records
            console.log("  > Updating existing 0 values to 5...");
            try {
                const [res] = await conn.query(`UPDATE productos SET stock_minimo = 5 WHERE stock_minimo = 0`);
                console.log(`    Success: ${res.changedRows} rows updated.`);
            } catch (e) {
                console.error(`    Failed: ${e.message}`);
            }

        } catch (e) {
            console.error(`  Error connecting/processing tenant ${tenant.nit}: ${e.message}`);
        } finally {
            if (conn) await conn.end();
        }
    }

    console.log("Finished.");
    await pool.end();
}

run().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});
