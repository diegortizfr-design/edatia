// backend/controllers/nominaController.js
const { getPool } = require('../config/db');

exports.getCargos = async (req, res) => {
    try {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM nomina_cargos WHERE activo = 1 ORDER BY nombre ASC');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al obtener cargos' });
    }
};

exports.createCargo = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        const pool = getPool();
        const [result] = await pool.query('INSERT INTO nomina_cargos (nombre, descripcion) VALUES (?, ?)', [nombre, descripcion]);
        res.json({ success: true, id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al crear cargo' });
    }
};

exports.updateCargo = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, activo } = req.body;
        const pool = getPool();
        await pool.query('UPDATE nomina_cargos SET nombre=?, descripcion=?, activo=? WHERE id=?', [nombre, descripcion, activo, id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al actualizar cargo' });
    }
};

exports.deleteCargo = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = getPool();
        await pool.query('UPDATE nomina_cargos SET activo = 0 WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al eliminar cargo' });
    }
};
