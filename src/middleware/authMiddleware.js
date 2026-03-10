const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { jwtSecret } = require("../config/environment");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Obtener token del header
      token = req.headers.authorization.split(" ")[1];

      // Verificar token
      const decoded = jwt.verify(token, jwtSecret);

      // Obtener usuario del token (excluimos la contraseña)
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "Usuario no encontrado" });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: "Token no válido" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "No autorizado, token faltante" });
  }
};

module.exports = { protect };
