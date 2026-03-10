const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    accion: { type: String, required: true },
    entidad: { type: String }, // 'tramite', 'usuario', 'documento'
    entidadId: mongoose.Schema.Types.ObjectId,
    datosAnteriores: mongoose.Schema.Types.Mixed,
    datosNuevos: mongoose.Schema.Types.Mixed,
    ip: String,
    userAgent: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
    capped: { size: 1024000, max: 10000 }, // colección limitada para logs
  },
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
