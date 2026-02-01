const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const dbPath = './backend/config/db.js';
const dbFactoryPath = './backend/config/dbFactory.js';
const sqlPath = './add_config_inventory_col.sql';

if (!fs.existsSync(dbPath) || !fs.existsSync(sqlPath)) {
    console.error(`Missing files. Run from root.`);
    process.exit(1);
}

const { getPool } = require(dbPath);
const { connectToClientDB } = require(dbFactoryPath);

function loadEnv() {
    const paths = ['datos.env', 'backend/datos.env', '.env', 'backend/.env'];
    for (const p of paths) {
        if (fs.existsSync(p)) {
            require('dotenv').config({ path: p });
            return;
        }
    }
}
loadEnv();

async function run() {
    const sql = fs.readFileSync(sqlPath, 'utf8');
    const pool = getPool();

    let tenants = [];
    try {
        const [rows] = await pool.query('SELECT * FROM empresasconfig');
        tenants = rows;
    } catch (e) {
        console.error("Error fetching tenants:", e.message);
        process.exit(1);
    }

    console.log(`Processing ${tenants.length} tenants...`);

    for (const tenant of tenants) {
        console.log(`Tenant: ${tenant.nit}`);
        let conn;
        try {
            conn = await connectToClientDB(tenant);
            try {
                await conn.query(sql);
                console.log("  Success: Column added.");
            } catch (e) {
                if (e.code === 'ER_DUP_FIELDNAME') {
                    console.log("  Skipped: Column already exists.");
                } else {
                    console.error("  Failed:", e.message);
                }
            }
        } catch (e) {
            console.error(`  Connection error: ${e.message}`);
        } finally {
            if (conn) await conn.end();
        }
    }
    await pool.end();
}

run();
