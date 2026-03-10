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
    const tramiteType = await TramiteType.create(req.body);
    res.status(201).json({
      success: true,
      data: tramiteType,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTramiteType = async (req, res) => {
  try {
    const tramiteType = await TramiteType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );
    res.json({
      success: true,
      data: tramiteType,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteTramiteType = async (req, res) => {
  try {
    await TramiteType.findByIdAndDelete(req.params.id);
    res.json({
      success: true,
      message: "Tipo de trámite eliminado",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getActiveTramiteTypes,
  createTramiteType,
  updateTramiteType,
  deleteTramiteType,
};
