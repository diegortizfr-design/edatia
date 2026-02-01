const express = require('express');
const router = express.Router();
const contabilidadController = require('../controllers/contabilidadController');
const { protect } = require('../middlewares/authMiddleware'); // Asumiendo middleware de auth existente

// Rutas protegidas - PUC
router.get('/puc', protect, contabilidadController.getPUC);
router.post('/puc', protect, contabilidadController.createAccount);
router.put('/puc/:codigo', protect, contabilidadController.updateAccount);
router.delete('/puc/:codigo', protect, contabilidadController.deleteAccount);
router.post('/puc/bulk', protect, contabilidadController.bulkImportPUC);

// Comprobantes
router.get('/comprobantes', protect, contabilidadController.getComprobantes);
router.get('/comprobantes/:id', protect, contabilidadController.getComprobanteById);
router.post('/comprobantes', protect, contabilidadController.createComprobante);
router.put('/comprobantes/:id', protect, contabilidadController.updateComprobante);
router.delete('/comprobantes/:id', protect, contabilidadController.deleteComprobante);
router.post('/comprobantes/:id/contabilizar', protect, contabilidadController.contabilizarComprobante);

// Reportes
router.get('/libro-diario', protect, contabilidadController.getLibroDiario);
router.get('/balance-general', protect, contabilidadController.getBalanceGeneral);

module.exports = router;
