const { getPool } = require('./backend/config/db');

async function explore() {
    const pool = getPool();
    try {
        // 1. List branches
        const [branches] = await pool.query("SELECT id, nombre FROM sucursales");
        console.log("Sucursales encontradas:");
        console.table(branches);

        const actualicell = branches.find(b => b.nombre.toUpperCase().includes("ACTUALICELL"));
        if (!actualicell) {
            console.error("No se encontró la sucursal ACTUALICELL");
            process.exit(1);
        }

        const sucursalId = actualicell.id;
        console.log(`ID de ACTUALICELL: ${sucursalId}`);

        // 2. Count products with stock but no branch record
        const [discrepancies] = await pool.query(`
            SELECT COUNT(*) as count 
            FROM productos p
            WHERE p.stock_actual > 0 
            AND NOT EXISTS (
                SELECT 1 FROM inventario_sucursales isuc 
                WHERE isuc.producto_id = p.id AND isuc.sucursal_id = ?
            )
        `, [sucursalId]);

        console.log(`Productos con stock global pero sin registro en ACTUALICELL: ${discrepancies[0].count}`);

        // 3. Optional: List some of them
        if (discrepancies[0].count > 0) {
            const [samples] = await pool.query(`
                SELECT id, nombre, stock_actual 
                FROM productos p
                WHERE p.stock_actual > 0 
                AND NOT EXISTS (
                    SELECT 1 FROM inventario_sucursales isuc 
                    WHERE isuc.producto_id = p.id AND isuc.sucursal_id = ?
                )
                LIMIT 5
            `, [sucursalId]);
            console.log("Muestra de productos a migrar:");
            console.table(samples);
        }

    } catch (err) {
        console.error("Error en exploración:", err);
    } finally {
        process.exit(0);
    }
}

explore();
