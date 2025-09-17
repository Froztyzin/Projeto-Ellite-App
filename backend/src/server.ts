import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
// Fix: Add necessary imports for ES module __dirname equivalent.
import { fileURLToPath } from 'url';

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

// Fix: Define __dirname for ES module scope.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors()); // Em produção, restrinja a origem: app.use(cors({ origin: 'URL_DO_SEU_FRONTEND' }));
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

// --- SERVE FRONTEND ---
const staticPath = path.resolve(__dirname, '../../dist');
app.use(express.static(staticPath));

// Rota raiz para verificação de status da API
app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'API Elitte Corpus está no ar!' });
});

// O "catchall" handler: para qualquer requisição que não corresponda a uma rota da API
// ou a um arquivo estático, envia de volta o index.html do React.
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.resolve(staticPath, 'index.html'));
});


// Middleware de tratamento de erros global
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Algo deu errado!');
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend rodando em http://localhost:${PORT}`);
});