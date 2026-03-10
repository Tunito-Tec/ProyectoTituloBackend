const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tipo: {
      type: String,
      enum: [
        "tramite_actualizado",
        "firma_pendiente",
        "documento_requerido",
        "pago_recibido",
        "sistema",
      ],
    },
    titulo: String,
    mensaje: String,
    leido: { type: Boolean, default: false },
    fechaLeido: Date,
    link: String, // ruta a la vista relacionada
    datos: mongoose.Schema.Types.Mixed, // datos adicionales
  },
  { timestamps: true },
);

module.exports = mongoose.model("Notification", notificationSchema);
