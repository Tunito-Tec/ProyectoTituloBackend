// ==============================================
// 1. IMPORTACIONES Y CONFIGURACIÓN
// ==============================================
const express = require("express");
const colors = require("colors");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const connectDB = require("./src/config/database");
const { port, clientUrl, nodeEnv } = require("./src/config/environment");

// Importar Rutas - VERIFICA QUE TODAS EXISTAN
const authRoutes = require("./src/routes/authRoutes");
const clientRoutes = require("./src/routes/clientRoutes");
const auxiliaryRoutes = require("./src/routes/auxiliaryRoutes");
const notaryRoutes = require("./src/routes/notaryRoutes");
const adminRoutes = require("./src/routes/adminRoutes"); // ← Este debe existir ahora

const tramiteTypeRoutes = require("./src/routes/tramiteTypeRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const auditRoutes = require("./src/routes/auditRoutes");

// ==============================================
// 2. INICIALIZAR APP Y CONEXIONES
// ==============================================
const app = express();

// Conectar a MongoDB
connectDB();

// ==============================================
// 3. MIDDLEWARES GLOBALES
// ==============================================
app.use(helmet());

app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  }),
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message:
    "Demasiadas peticiones desde esta IP, por favor intenta de nuevo después de 15 minutos",
});
app.use("/api", limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==============================================
// 4. RUTAS DE LA API
// ==============================================
app.get("/", (req, res) => {
  res.send("🚀 API SINotarial funcionando!");
});

// Registrar las rutas por módulo
app.use("/api/auth", authRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/auxiliar", auxiliaryRoutes);
app.use("/api/notario", notaryRoutes);
app.use("/api/admin", adminRoutes); // ← Esta línea ahora funcionará
app.use("/api/tramite-types", tramiteTypeRoutes);
app.use("/api/notificaciones", notificationRoutes);
app.use("/api/auditoria", auditRoutes);

// ==============================================
// 5. MIDDLEWARE DE MANEJO DE ERRORES
// ==============================================
// ==============================================
// 5. MIDDLEWARE DE MANEJO DE ERRORES MEJORADO
// ==============================================
app.use((err, req, res, next) => {
  console.error("❌ Error detectado:".red);
  console.error(err.stack?.red || err);

  // Errores de validación de Mongoose
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      message: "Error de validación",
      errors,
    });
  }

  // Error de clave duplicada (RUT o email ya existen)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      message: `El ${field} ya está registrado en el sistema`,
      field,
    });
  }

  // Error de JSON mal formado
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ message: "JSON mal formado" });
  }

  // Error por defecto
  res.status(500).json({
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Error interno del servidor",
  });
});
// ==============================================
// 6. INICIAR SERVIDOR
// ==============================================
app.listen(port, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${port}`.yellow.bold);
  console.log(`🌍 Modo: ${nodeEnv}`.cyan);
});
