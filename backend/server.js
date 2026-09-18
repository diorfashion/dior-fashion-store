const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

app.use(cookieParser());


// ملفات المتجر
app.use(
  express.static(
    path.join(__dirname, "public")
  )
);


// API تسجيل الدخول
app.use(
  "/api/auth",
  require("./routes/authRoutes")
);


// API المنتجات
app.use(
  "/api/products",
  require("./routes/productRoutes")
);
app.use(
  "/api/orders",
  require("./routes/orderRoutes")
);


// الصفحة الرئيسية
app.get("/", (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      "public",
      "index.html"
    )
  );

});
app.get("/admin/login.html", (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      "public",
      "admin",
      "login.html"
    )
  );
});

// لوحة الإدارة
app.get("/admin", (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      "public",
      "admin",
      "index.html"
    )
  );

});


const PORT =
  process.env.PORT || 3000;


mongoose
  .connect(process.env.MONGODB_URI)

  .then(() => {

    console.log("MongoDB connected");

    app.listen(PORT, () => {

      console.log(
        `Server running on port ${PORT}`
      );

    });

  })

  .catch((error) => {

    console.error(
      "MongoDB connection failed:",
      error.message
    );

  });
