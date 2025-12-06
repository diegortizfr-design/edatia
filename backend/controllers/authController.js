// backend/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getPool } = require('../config/db');
const { connectToClientDB } = require('../config/dbFactory');
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
  let clientConn = null;
  try {
    const { usuario, contraseña, nit } = req.body;

    // 1. Validar inputs básicos
    if (!usuario || !contraseña || !nit) {
      return res.status(400).json({ ok: false, message: 'NIT, usuario y contraseña son requeridos' });
    }

    const pool = getPool();

    // 2. Buscar configuración de la empresa por NIT (usando pool principal)
    const [empresas] = await pool.query('SELECT * FROM empresasconfig WHERE nit = ?', [nit]);
    if (!empresas.length) {
      console.log('Empresa no encontrada para NIT:', nit);
      return res.status(404).json({ ok: false, message: 'Empresa no encontrada con ese NIT' });
    }

    const empresaConfig = empresas[0];

    // FIX: Si el host está configurado como 'localhost', '127.0.0.1' o '::1' en la BD
    // debemos usar la IP pública del servidor principal.
    const localHosts = ['localhost', '127.0.0.1', '::1'];
    if (localHosts.includes(empresaConfig.db_host) && process.env.DB_HOST) {
      console.log(`Detectado host local (${empresaConfig.db_host}). Usando IP pública:`, process.env.DB_HOST);
      empresaConfig.db_host = process.env.DB_HOST;
    } else {
      console.log('Host usado (sin cambios):', empresaConfig.db_host);
      console.log('DB_HOST env:', process.env.DB_HOST);
    }

    console.log('Configuración obtenida de BD:', empresaConfig); // DEBUG LOG

    // 3. Conectar a la DB del cliente
    clientConn = await connectToClientDB(empresaConfig);

    // 4. Buscar usuario en la DB del cliente
    const [users] = await clientConn.query('SELECT id, contraseña, nombre FROM usuarios WHERE usuario = ?', [usuario]);

    if (!users.length) {
      return res.status(401).json({ ok: false, message: 'Credenciales inválidas' });
    }

    const user = users[0];
    const match = await bcrypt.compare(contraseña, user.contraseña);

    if (!match) {
      return res.status(401).json({ ok: false, message: 'Credenciales inválidas' });
    }

    // 5. Generar Token
    const token = jwt.sign({
      id: user.id,
      usuario,
      company_id: empresaConfig.cliente_id,
      nit: empresaConfig.nit
    }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({
      ok: true,
      data: {
        id: user.id,
        nombre: user.nombre,
        usuario,
        nombre_carpeta: empresaConfig.nombre_carpeta
      },
      token
    });

  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ ok: false, message: 'Error del servidor: ' + err.message });
  } finally {
    // Importante: Cerrar conexión al cliente
    if (clientConn) await clientConn.end();
  }
}

module.exports = { register, login };
