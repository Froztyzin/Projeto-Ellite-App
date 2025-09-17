import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Estendendo a interface Request do Express para incluir a propriedade 'user'
// Fix: Replaced the 'AuthRequest' interface with a type intersection to resolve an issue
// where properties from the base Express 'Request' type were not being inherited correctly.
// Fix: Use explicit express types to resolve type errors.
type AuthRequest = Request & {
    user?: any; // Você pode definir uma interface mais estrita para o payload do usuário
};

// Fix: Use explicit express types to resolve type errors.
const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Acesso negado. Nenhum token fornecido.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        req.user = decoded; // Adiciona o payload do token decodificado ao objeto de requisição
        next();
    } catch (error) {
        res.status(400).json({ message: 'Token inválido.' });
    }
};

export default authMiddleware;