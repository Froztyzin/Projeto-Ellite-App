import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

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
const allowedOrigins = [
  process.env.FRONTEND_URL, // Production URL from environment variables
  'http://localhost:5173',  // Local development
  'http://127.0.0.1:5173', // Another local development variant
].filter(Boolean) as string[];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

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
app.get('/api', (req: express.Request, res: express.Response) => {
  res.json({ message: 'API Elitte Corpus está no ar!' });
});

// Middleware de tratamento de erros global
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Algo deu errado!');
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend rodando em http://localhost:${PORT}`);
});