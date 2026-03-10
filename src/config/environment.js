// Cargar dotenv al inicio
const dotenv = require("dotenv");
dotenv.config();

// Verificar que las variables se cargaron
console.log("📁 Variables de entorno cargadas:");
console.log("- PORT:", process.env.PORT);
console.log(
  "- MONGO_URI:",
  process.env.MONGO_URI ? "✓ Definida" : "✗ No definida",
);
console.log(
  "- JWT_SECRET:",
  process.env.JWT_SECRET ? "✓ Definida" : "✗ No definida",
);

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || "7d",
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,
  clientUrl: process.env.CLIENT_URL || "http://localhost:3001",
};
