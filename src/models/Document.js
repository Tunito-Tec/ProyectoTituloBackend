const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    tipo: { type: String, enum: ["pdf", "image", "word", "excel"] },
    url: String,
    hash: String,
    tamaño: Number,
    tramite: { type: mongoose.Schema.Types.ObjectId, ref: "Proceeding" },
    subidoPor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    firmado: { type: Boolean, default: false },
    fechaFirma: Date,
    firmadoPor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    version: { type: Number, default: 1 },
    documentoOriginal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
    }, // para versiones
  },
  { timestamps: true },
);

module.exports = mongoose.model("Document", documentSchema);
