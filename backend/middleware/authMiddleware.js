const jwt = require("jsonwebtoken");

function requireAdmin(req, res, next) {
  try {
    const token = req.cookies?.adminToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "غير مصرح"
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "ليس لديك صلاحية"
      });
    }

    req.admin = decoded;

    next();

  } catch (error) {

    return res.status(401).json({
      success: false,
      message: "جلسة الإدارة غير صالحة"
    });

  }
}

module.exports = requireAdmin;
