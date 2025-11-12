const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

async function main() {
  // Conexión MySQL con pool
  const db = mysql.createPool({
    host: "217.21.77.0",
    user: "u818415914_d13g0",
    password: "D13g0*0rt1z.",
    database: "u818415914_ERPod",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  console.log("✅ Conectado a MySQL correctamente (pool activo)");

  // --- RUTA DE LOGIN ---
  app.post("/actualystore/login", async (req, res) => {
    try {
      const { usuario, contrasena } = req.body;

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
        "clave-secreta-erpod",
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
      console.error("❌ Error en login:", error.message);
      res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
  });

  const PORT = 3000;
  app.listen(PORT, () => console.log(`🚀 Servidor API escuchando en http://localhost:${PORT}`));
}
// Llamar función principal
main().catch(err => console.error("❌ Error iniciando el servidor:", err));
