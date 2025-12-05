// backend/controllers/empresaController.js
const { getPool } = require('../config/db');

async function listarEmpresas(req, res) {
    try {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM empresas ORDER BY id DESC LIMIT 200');
        res.json({ ok: true, data: rows });
    } catch (err) {
        console.error('listarEmpresas', err);
        res.status(500).json({ ok: false, message: 'Error del servidor' });
    }
}

async function crearEmpresa(req, res) {
    try {
        const { nombre, nit, direccion } = req.body;
        if (!nombre || !nit) return res.status(400).json({ ok: false, message: 'nombre y nit requeridos' });

        const pool = getPool();
        const [result] = await pool.query('INSERT INTO empresas (nombre, nit, direccion) VALUES (?, ?, ?)', [nombre, nit, direccion || null]);
        res.status(201).json({ ok: true, data: { id: result.insertId, nombre, nit } });
    } catch (err) {
        console.error('crearEmpresa', err);
        res.status(500).json({ ok: false, message: 'Error del servidor' });
    }
}

module.exports = { listarEmpresas, crearEmpresa };
