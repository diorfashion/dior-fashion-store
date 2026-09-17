const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();


// تسجيل الدخول
router.post("/login", (req, res) => {

  const {
    username,
    password
  } = req.body;

  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({
      success: false,
      message: "اسم المستخدم أو كلمة المرور غير صحيحة"
    });
  }

  const token = jwt.sign(
    {
      username,
      role: "admin"
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d"
    }
  );

  res.cookie("adminToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({
    success: true,
    message: "تم تسجيل الدخول"
  });
});


// التحقق من الجلسة
router.get("/me", (req, res) => {

  try {

    const token = req.cookies?.adminToken;

    if (!token) {
      return res.status(401).json({
        success: false
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    res.json({
      success: true,
      admin: {
        username: decoded.username
      }
    });

  } catch (error) {

    res.status(401).json({
      success: false
    });

  }
});


// تسجيل الخروج
router.post("/logout", (req, res) => {

  res.clearCookie("adminToken");

  res.json({
    success: true,
    message: "تم تسجيل الخروج"
  });

});

module.exports = router;
