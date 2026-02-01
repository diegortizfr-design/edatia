const { getPool } = require('../config/db');
const { connectToClientDB } = require('../config/dbFactory');

async function fixAllTenants() {
    try {
        console.log("Starting Generic Schema Fix for ALL Tenants...");

        const pool = getPool();
        const [companies] = await pool.query('SELECT * FROM empresasconfig');

        if (companies.length === 0) {
            console.log("No companies found in global configuration.");
            process.exit(0);
        }

        console.log(`Found ${companies.length} companies. Processing...`);

        for (const dbConfig of companies) {
            console.log(`\n--- Processing Company: ${dbConfig.nombre_comercial} (NIT: ${dbConfig.nit}) ---`);
            let clientConn = null;
            try {
                clientConn = await connectToClientDB(dbConfig);

                // 1. ADD UNIQUE INDEX TO PRODUCTOS (CODIGO)
                try {
                    await clientConn.query("ALTER TABLE productos ADD UNIQUE INDEX unique_codigo (codigo)");
                    console.log("[OK] Added UNIQUE index to 'codigo'.");
                } catch (e) {
                    if (e.code === 'ER_DUP_ENTRY') {
                        console.warn("[WARN] Duplicate entries exist. Unique index FAILED. Please clean duplicates manually.");
                        // Optional: Show duplicates?
                        const [dups] = await clientConn.query("SELECT codigo, COUNT(*) c FROM productos WHERE codigo IS NOT NULL GROUP BY codigo HAVING c > 1");
                        console.log("Duplicate Codes:", dups);
                    } else if (e.code === 'ER_DUP_KEYNAME') {
                        console.log("[INFO] Index 'unique_codigo' already exists.");
                    } else {
                        console.error("[ERROR] Failed to add index:", e.message);
                    }
                }

            } catch (err) {
                console.error(`[ERROR] Connection failed for ${dbConfig.name}:`, err.message);
            } finally {
                if (clientConn) await clientConn.end();
            }
        }

        console.log("\nAll tenants processed.");
        process.exit(0);

    } catch (e) {
        console.error("Global Script Error:", e);
        process.exit(1);
    }
}

fixAllTenants();
