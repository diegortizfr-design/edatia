const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const geograficaCtrl = require('../controllers/geograficaController');

// Countries
router.get('/paises', protect, geograficaCtrl.listarPaises);
router.post('/paises', protect, geograficaCtrl.crearPais);
router.put('/paises/:id', protect, geograficaCtrl.actualizarPais);
router.delete('/paises/:id', protect, geograficaCtrl.eliminarPais);

// Departments
router.get('/departamentos', protect, geograficaCtrl.listarDepartamentos);
router.post('/departamentos', protect, geograficaCtrl.crearDepartamento);
router.put('/departamentos/:id', protect, geograficaCtrl.actualizarDepartamento);
router.delete('/departamentos/:id', protect, geograficaCtrl.eliminarDepartamento);

// Cities
router.get('/ciudades', protect, geograficaCtrl.listarCiudades);
router.post('/ciudades', protect, geograficaCtrl.crearCiudad);
router.put('/ciudades/:id', protect, geograficaCtrl.actualizarCiudad);
router.delete('/ciudades/:id', protect, geograficaCtrl.eliminarCiudad);

module.exports = router;
