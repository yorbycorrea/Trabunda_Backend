// src/index.js
const express = require("express");
require("dotenv").config();
const { pool } = require("./db");

// constantes de rutas
const trabajadoresRoutes = require("./routes/trabajadores");
const reportesRoutes = require("./routes/reportes");
const areasRutas = require("./routes/areas");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // para leer JSON en requests

// Endpoint simple para ver que el backend está vivo
app.get("/health", (req, res) => {
  res.json({ ok: true, message: "TRABUNDA backend online ✅" });
});

//rutas
app.use("/trabajadores", trabajadoresRoutes);
app.use("/reportes", reportesRoutes);
app.use("/areas", areasRutas);

app.listen(PORT, () => {
  console.log(`Servidor TRABUNDA escuchandosii ha en http://localhost:${PORT}`);
});
