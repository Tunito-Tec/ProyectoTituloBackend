// Middleware genérico para permitir solo ciertos roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "No autorizado" });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        message: `Acción prohibida. Se requiere uno de estos roles: ${roles.join(", ")}`,
      });
    }
    next();
  };
};

// Ejemplos de uso específico (opcional)
const isNotary = authorize("notario", "admin");
const isAuxiliary = authorize("auxiliar", "admin");
const isClient = authorize("cliente", "admin");

module.exports = { authorize, isNotary, isAuxiliary, isClient };
