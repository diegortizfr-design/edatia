import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { register, login, getMe } from '../controllers/authController';
import { getClients, getClientById, createClient, updateClient, deleteClient } from '../controllers/clientController';
import { simulateLoan, createProduct, getProducts, createLoan, renewLoan, getLoanById, getLoans } from '../controllers/loanController';
import { createPayment, getPaymentById, getPayments } from '../controllers/paymentController';
import { getDailyRoute, getRouteCheckout } from '../controllers/routeController';
import { getPortfolioStats } from '../controllers/reportsController';

const router = Router();

// --- AUTHENTICATION ---
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', authenticateToken as any, getMe);

// --- CLIENTS ---
router.get('/clients', authenticateToken as any, getClients);
router.get('/clients/:id', authenticateToken as any, getClientById);
router.post('/clients', authenticateToken as any, createClient);
router.put('/clients/:id', authenticateToken as any, updateClient);
router.delete('/clients/:id', authenticateToken as any, deleteClient);

// --- LOANS & PRODUCTS ---
router.post('/loans/simulate', simulateLoan);
router.post('/loans/products', authenticateToken as any, createProduct);
router.get('/loans/products', authenticateToken as any, getProducts);
router.post('/loans', authenticateToken as any, createLoan);
router.post('/loans/renew', authenticateToken as any, renewLoan);
router.get('/loans', authenticateToken as any, getLoans);
router.get('/loans/:id', authenticateToken as any, getLoanById);

// --- PAYMENTS ---
router.get('/payments', authenticateToken as any, getPayments);
router.post('/payments', authenticateToken as any, createPayment);
router.get('/payments/:id', authenticateToken as any, getPaymentById);

// --- ROUTE ---
router.get('/route', authenticateToken as any, getDailyRoute);
router.get('/route/checkout', authenticateToken as any, getRouteCheckout);

// --- REPORTS / DASHBOARD ---
router.get('/reports/portfolio', authenticateToken as any, getPortfolioStats);

export default router;
