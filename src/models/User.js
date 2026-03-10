const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    rut: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Sin select:false por ahora para debug
    rol: { type: String, default: "cliente" },
    telefono: String,
    direccion: String,
  },
  { timestamps: true },
);

// ⚠️ SIN MIDDLEWARE - Todo el hash se hace en el controlador

module.exports = mongoose.model("User", userSchema);
