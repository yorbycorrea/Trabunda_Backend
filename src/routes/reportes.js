// src/routes/reportes.js
const express = require("express");
const router = express.Router();
const { pool } = require("../db");

//
// === Funciones auxiliares ==============================
//

function esTipoReporteValido(tipo) {
  return ["SANEAMIENTO", "APOYO_HORAS", "TRABAJO_AVANCE"].includes(tipo);
}

function esTurnoValido(turno) {
  return ["Mañana", "Tarde", "Noche", "Día"].includes(turno);
}

// según el tipo_reporte, qué flag de la tabla areas debe estar en 1
function flagParaTipoReporte(tipo) {
  switch (tipo) {
    case "APOYO_HORAS":
      return "es_apoyo_horas";
    case "TRABAJO_AVANCE":
      return "es_trabajo_avance";
    case "SANEAMIENTO":
      // puedes crear un área específica “SANEAMIENTO”; por ahora usamos es_conteo_rapido como ejemplo
      return "es_conteo_rapido";
    default:
      return null;
  }
}

//
// === POST /reportes → crear cabecera ===================
//
router.post("/", async (req, res) => {
  try {
    const {
      fecha,
      turno,
      tipo_reporte,
      area_id,
      creado_por_user_id,
      creado_por_nombre,
      observaciones,
    } = req.body;

    // 1) Validar campos obligatorios
    if (
      !fecha ||
      !turno ||
      !tipo_reporte ||
      !area_id ||
      !creado_por_user_id ||
      !creado_por_nombre
    ) {
      return res.status(400).json({
        error:
          "Faltan campos obligatorios: fecha, turno, tipo_reporte, area_id, creado_por_user_id, creado_por_nombre",
      });
    }

    if (!esTurnoValido(turno)) {
      return res.status(400).json({ error: "turno no válido" });
    }

    if (!esTipoReporteValido(tipo_reporte)) {
      return res.status(400).json({ error: "tipo_reporte no válido" });
    }

    // 2) Validar que el área exista y sea compatible con ese tipo de reporte
    const flag = flagParaTipoReporte(tipo_reporte);
    if (!flag) {
      return res
        .status(400)
        .json({
          error: "No se pudo determinar el módulo para ese tipo_reporte",
        });
    }

    const [areas] = await pool.query(
      `SELECT id, nombre
       FROM areas
       WHERE id = ? AND ${flag} = 1 AND activo = 1`,
      [area_id]
    );

    if (areas.length === 0) {
      return res.status(400).json({
        error: "El área seleccionada no es válida para este tipo de reporte",
      });
    }

    const area = areas[0];

    // 3) Insertar en reportes
    const [result] = await pool.query(
      `INSERT INTO reportes
       (fecha, turno, tipo_reporte, area, area_id, creado_por_user_id, creado_por_nombre, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fecha,
        turno,
        tipo_reporte,
        area.nombre, // rellenamos también la columna area (texto) por compatibilidad
        area_id,
        creado_por_user_id,
        creado_por_nombre,
        observaciones || null,
      ]
    );

    res.status(201).json({
      message: "Reporte creado correctamente",
      reporte_id: result.insertId,
      area_nombre: area.nombre,
    });
  } catch (err) {
    console.error("Error al crear reporte:", err);
    res.status(500).json({ error: "Error interno al crear el reporte" });
  }
});

//
// === GET /reportes/:id → cabecera ======================
//
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT
         r.id,
         r.fecha,
         r.turno,
         r.tipo_reporte,
         r.area_id,
         a.nombre       AS area_nombre,
         r.creado_por_user_id,
         r.creado_por_nombre,
         r.observaciones,
         r.creado_en
       FROM reportes r
       LEFT JOIN areas a ON r.area_id = a.id
       WHERE r.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Reporte no encontrado" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error al obtener reporte:", err);
    res.status(500).json({ error: "Error interno al obtener el reporte" });
  }
});

module.exports = router;
