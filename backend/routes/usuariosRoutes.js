const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

// USUARIOS
router.get('/', usuariosController.listarUsuarios);
router.post('/', usuariosController.crearUsuario);
router.put('/:id', usuariosController.actualizarUsuario);
router.delete('/:id', usuariosController.eliminarUsuario);

// ROLES
router.get('/roles', usuariosController.listarRoles);
router.post('/roles', usuariosController.crearRol);
router.put('/roles/:id', usuariosController.actualizarRol);
router.delete('/roles/:id', usuariosController.eliminarRol);

// CARGOS
router.get('/cargos', usuariosController.listarCargos);
router.post('/cargos', usuariosController.crearCargo);
router.put('/cargos/:id', usuariosController.actualizarCargo);
router.delete('/cargos/:id', usuariosController.eliminarCargo);

// COLABORADORES
router.get('/colaboradores', usuariosController.listarColaboradores);

module.exports = router;
