const {
  validateRUT,
  validateEmail,
  validatePhone,
} = require("../utils/validators");

// Middleware para validar RUT
const validateRUTMiddleware = (req, res, next) => {
  const { rut } = req.body;

  if (rut && !validateRUT(rut)) {
    return res.status(400).json({
      message: "RUT no válido",
      field: "rut",
    });
  }

  next();
};

// Middleware para validar email
const validateEmailMiddleware = (req, res, next) => {
  const { email } = req.body;

  if (email && !validateEmail(email)) {
    return res.status(400).json({
      message: "Email no válido",
      field: "email",
    });
  }

  next();
};

// Middleware para sanitizar inputs
const sanitizeMiddleware = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === "string") {
        req.body[key] = req.body[key].trim();
      }
    });
  }
  next();
};

module.exports = {
  validateRUTMiddleware,
  validateEmailMiddleware,
  sanitizeMiddleware,
};
