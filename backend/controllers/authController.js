// backend/controllers/auth.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getPool } = require('../config/db');
const dotenv = require('dotenv');
dotenv.config({ path: './datos.env' });

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

async function register(req, res) {
  try {
    const { nombre, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ ok: false, message: 'email y password son requeridos' });

    const pool = getPool();
    const [existing] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existing.length) return res.status(400).json({ ok: false, message: 'Usuario ya existe' });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query('INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)', [nombre || null, email, hashed]);

    const userId = result.insertId;
    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.status(201).json({ ok: true, data: { id: userId, email }, token });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ ok: false, message: 'Error del servidor' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const pool = getPool();
    const [rows] = await pool.query('SELECT id, password, nombre FROM usuarios WHERE email = ?', [email]);
    if (!rows.length) return res.status(401).json({ ok: false, message: 'Credenciales inválidas' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ ok: false, message: 'Credenciales inválidas' });

    const token = jwt.sign({ id: user.id, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ ok: true, data: { id: user.id, nombre: user.nombre, email }, token });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ ok: false, message: 'Error del servidor' });
  }
}

module.exports = { register, login };
