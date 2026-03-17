const TramiteType = require("../models/TramiteType");

// Obtener tipos de trámite activos (público)
const getActiveTramiteTypes = async (req, res) => {
  try {
    const tipos = await TramiteType.find({ activo: true });
    res.json({
      success: true,
      data: tipos,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CRUD para administradores
const createTramiteType = async (req, res) => {
  try {
    // Verificar si ya existe un tipo con ese tipoId
    const existe = await TramiteType.findOne({ tipoId: req.body.tipoId });
    if (existe) {
      return res.status(400).json({
        message: "Ya existe un tipo de trámite con ese ID",
      });
    }

    const tramiteType = await TramiteType.create(req.body);
    res.status(201).json({
      success: true,
      data: tramiteType,
    });
  } catch (error) {
    console.error("Error en createTramiteType:", error);
    res.status(500).json({ message: error.message });
  }
};

const updateTramiteType = async (req, res) => {
  try {
    console.log("Actualizando tipo de trámite con ID:", req.params.id);
    console.log("Datos recibidos:", req.body);

    // Buscar por tipoId en lugar de _id
    const tramiteType = await TramiteType.findOneAndUpdate(
      { tipoId: req.params.id }, // Buscar por el campo tipoId
      req.body,
      { new: true, runValidators: true },
    );

    if (!tramiteType) {
      return res.status(404).json({
        message: "Tipo de trámite no encontrado",
      });
    }

    res.json({
      success: true,
      data: tramiteType,
    });
  } catch (error) {
    console.error("Error en updateTramiteType:", error);

    // Manejar errores de validación
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        message: "Error de validación",
        errors,
      });
    }

    res.status(500).json({ message: error.message });
  }
};

const deleteTramiteType = async (req, res) => {
  try {
    console.log("Eliminando tipo de trámite con ID:", req.params.id);

    // Buscar por tipoId en lugar de _id
    const tramiteType = await TramiteType.findOneAndDelete({
      tipoId: req.params.id,
    });

    if (!tramiteType) {
      return res.status(404).json({
        message: "Tipo de trámite no encontrado",
      });
    }

    res.json({
      success: true,
      message: "Tipo de trámite eliminado",
    });
  } catch (error) {
    console.error("Error en deleteTramiteType:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getActiveTramiteTypes,
  createTramiteType,
  updateTramiteType,
  deleteTramiteType,
};
