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
      "https://www.diegortizfr.site", // tu dominio principal
      "https://diegortizfr.site",     // sin el "www"
      "http://localhost:3000"         // para pruebas locales
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// --- Parseo JSON ---
app.use(express.json());

// --- Ruta raíz para verificar que el servidor está activo ---
app.get("/", (req, res) => {
  res.send("✅ ERPod API funcionando correctamente");
});

// --- Crear Pool de Conexiones ---
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

// --- RUTA DE LOGIN ---
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

// --- Iniciar Servidor ---
const PORT = process.env.PORT || 10000; // Render asigna automáticamente el puerto
app.listen(PORT, async () => {
  await initDB();
  console.log(`🚀 Servidor API escuchando en el puerto ${PORT}`);
});