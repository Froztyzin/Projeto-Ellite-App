import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importa todas as rotas da aplicação
import authRoutes from './api/auth';
import memberRoutes from './api/members';
import planRoutes from './api/plans';
import invoiceRoutes from './api/invoices';
import expenseRoutes from './api/expenses';
import dashboardRoutes from './api/dashboard';
import reportRoutes from './api/reports';
import notificationRoutes from './api/notifications';
import logRoutes from './api/logs';
import userRoutes from './api/users';
import settingRoutes from './api/settings';
import searchRoutes from './api/search';
import portalRoutes from './api/portal';
// Rota stub para o assistente de IA
import assistantRoutes from './api/assistant';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
// Configure CORS to only accept requests from your frontend's domain in production
app.use(cors({
  origin: process.env.FRONTEND_URL
}));
app.use(express.json()); // Middleware para parsear JSON no corpo das requisições

// Monta as rotas da API sob o prefixo /api
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/assistant', assistantRoutes);

// Rota raiz para verificação de status da API
// Fix: Use explicit express types to resolve type errors.
app.get('/api', (req: express.Request, res: express.Response) => {
  res.json({ message: 'API Elitte Corpus está no ar!' });
});

// Middleware de tratamento de erros global
// Fix: Use explicit express types to resolve type errors.
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Algo deu errado!');
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend rodando em http://localhost:${PORT}`);
});