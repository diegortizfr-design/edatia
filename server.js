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

// --- Función principal ---
async function main() {
  // Conexión MySQL
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  console.log("✅ Conectado a MySQL correctamente (pool activo)");

  // --- RUTA DE LOGIN ---
  app.post("/actualystore/login", async (req, res) => {
    try {
      const { usuario, contrasena } = req.body;

      if (!usuario || !contrasena) {
        return res.status(400).json({ success: false, message: "Faltan credenciales" });
      }

      const [rows] = await db.execute(
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

  // --- Iniciar servidor ---
  const PORT = process.env.PORT || 10000; // Render asigna automáticamente este puerto
  app.listen(PORT, () =>
    console.log(`🚀 Servidor API escuchando en el puerto ${PORT}`)
  );
}

// --- Ejecutar servidor ---
main().catch((err) =>
  console.error("❌ Error iniciando el servidor:", err)
);
