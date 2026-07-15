'use strict';

// =============================================================================
// Pagos/PagosContenedor.js — Router del módulo Pagos
// CU-020 Pago manual, CU-021 MercadoPago, CU-022 Validar pago, CU-023 Historial
// =============================================================================
// PLACEHOLDER — se completa al implementar con el prompt 2.5.
// =============================================================================

const express = require('express');
const router = express.Router();

// TODO (CU-020): POST /manual              ← registrar pago manual (admin)
// TODO (CU-021): POST /mp/preferencia      ← crear preferencia MercadoPago
// TODO (CU-021): POST /mp/webhook          ← recibir notificación de MP (TODO: pendiente conocido)
// TODO (CU-022): PUT  /mp/:pagoId/validar  ← validar pago manualmente (admin)
// TODO (CU-023): GET  /historial           ← historial de pagos (admin)

module.exports = router;
