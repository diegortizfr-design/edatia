const { getPool } = require('../config/db');
const { connectToClientDB } = require('../config/dbFactory');

async function getClientDbConfig(nit) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM empresasconfig WHERE nit = ?', [nit]);
    if (rows.length === 0) return null;
    return rows[0];
}

exports.getCatalog = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.params;
        if (!nit) {
            return res.status(400).json({ success: false, message: 'NIT de empresa es requerido' });
        }

        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) {
            return res.status(404).json({ success: false, message: 'Empresa no encontrada' });
        }

        clientConn = await connectToClientDB(dbConfig);

        // Fetch only products marked for store
        const sql = `
            SELECT id, codigo, nombre, referencia_fabrica, categoria, precio1, 
                   stock_actual, descripcion, imagen_url, 
                   ecommerce_descripcion, ecommerce_imagenes, ecommerce_afecta_inventario
            FROM productos 
            WHERE mostrar_en_tienda = 1 AND activo = 1
        `;

        const [products] = await clientConn.query(sql);

        // Map and format data for the store
        const catalog = products.map(p => {
            const extraImages = (p.ecommerce_imagenes || '').split(',').map(s => s.trim()).filter(s => s);
            const isOutOfStock = p.ecommerce_afecta_inventario && p.stock_actual <= 0;

            return {
                id: p.id,
                sku: p.codigo,
                nombre: p.nombre,
                referencia: p.referencia_fabrica,
                precio: parseFloat(p.precio1),
                categoria: p.categoria,
                stock_real: p.stock_actual,
                descripcion: p.ecommerce_descripcion || p.descripcion,
                imagen_principal: p.imagen_url,
                imagenes: extraImages,
                afecta_inventario: !!p.ecommerce_afecta_inventario,
                agotado: isOutOfStock,
                disponible: !isOutOfStock
            };
        });

        res.json({
            success: true,
            empresa: dbConfig.nombre_comercial,
            count: catalog.length,
            data: catalog
        });

    } catch (err) {
        console.error('Public Catalog API Error:', err);
        res.status(500).json({ success: false, message: 'Error interno al obtener catálogo' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};
