// =======================
// 🚀 ERPod API - ActualyStore
// =======================

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();

// --- 🔒 Configuración CORS ---
app.use(
  cors({
    origin: [
      "https://www.diegortizfr.site", // dominio principal
      "https://diegortizfr.site",     // sin www
      "http://localhost:3000"         // desarrollo local
    ],
    methods: ["GET", "POST", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// --- Middleware JSON ---
app.use(express.json());

// --- Ruta raíz para verificar que el servidor está activo ---
app.get("/", (req, res) => {
  res.send("✅ ERPod API funcionando correctamente");
});

// ==========================
// 🧩 CONEXIÓN A BASE DE DATOS
// ==========================
let pool;
async function initDB() {
  pool = await mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  console.log("✅ Pool de conexión MySQL inicializado correctamente");
}

// ==========================
// 🔐 LOGIN DE USUARIOS
// ==========================
app.post("/actualystore/login", async (req, res) => {
  try {
    const { usuario, contrasena } = req.body;

    if (!usuario || !contrasena) {
      return res.status(400).json({ success: false, message: "Faltan credenciales" });
    }

    const [rows] = await pool.execute(
      "SELECT * FROM usuarios_actualystore WHERE usuario = ? AND estado = 'Activo' LIMIT 1",
      [usuario]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: "Usuario no encontrado" });
    }

    const user = rows[0];
    const match = await bcrypt.compare(contrasena, user.contrasena);

    if (!match) {
      return res.status(401).json({ success: false, message: "Contraseña incorrecta" });
    }

    const token = jwt.sign(
      { id: user.id, usuario: user.usuario, rol: user.rol },
      process.env.JWT_SECRET || "clave-secreta-erpod",
      { expiresIn: "4h" }
    );

    res.json({
      success: true,
      token,
      usuario: {
        nombre: user.nombre_completo,
        rol: user.rol,
        permisos: JSON.parse(user.permisos || "[]")
      }
    });
  } catch (error) {
    console.error("❌ Error en login:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
});

// ==========================
// ⚙️ CONFIGURACIÓN - EMPRESA
// ==========================

// Obtener datos de empresa
app.get("/actualystore/empresa", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM empresa_actualystore LIMIT 1");

    if (rows.length > 0) {
      return res.json({ success: true, empresa: rows[0] });
    }

    res.json({ success: true, empresa: null });
  } catch (error) {
    console.error("❌ Error al obtener empresa:", error);
    res.status(500).json({ success: false, message: "Error al obtener datos de la empresa" });
  }
});

// Guardar o actualizar empresa
app.post("/actualystore/empresa", async (req, res) => {
  try {
    const datos = req.body;
    const [rows] = await pool.execute("SELECT id FROM empresa_actualystore LIMIT 1");

    if (rows.length > 0) {
      // Actualiza si ya existe
      await pool.execute(
        `UPDATE empresa_actualystore SET 
          tipo_figura=?, nombre_fiscal=?, nombre_comercial=?, nit=?, dv=?, 
          direccion=?, telefono=?, correo=?, web=?, estado=? 
        WHERE id=?`,
        [
          datos.tipo_figura, datos.nombre_fiscal, datos.nombre_comercial,
          datos.nit, datos.dv, datos.direccion, datos.telefono,
          datos.correo, datos.web, datos.estado, rows[0].id
        ]
      );
    } else {
      // Inserta si no existe
      await pool.execute(
        `INSERT INTO empresa_actualystore 
          (tipo_figura, nombre_fiscal, nombre_comercial, nit, dv, direccion, telefono, correo, web, estado)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          datos.tipo_figura, datos.nombre_fiscal, datos.nombre_comercial,
          datos.nit, datos.dv, datos.direccion, datos.telefono,
          datos.correo, datos.web, datos.estado
        ]
      );
    }

    res.json({ success: true, message: "Datos de empresa guardados correctamente" });
  } catch (error) {
    console.error("❌ Error al guardar empresa:", error);
    res.status(500).json({ success: false, message: "Error al guardar datos de la empresa" });
  }
});

// ==========================
// 🚀 INICIAR SERVIDOR
// ==========================
const PORT = process.env.PORT || 10000;
app.listen(PORT, async () => {
  await initDB();
  console.log(`🚀 Servidor API escuchando en el puerto ${PORT}`);
});
