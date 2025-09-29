import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '../types';

export interface JwtPayload {
    id: string;
    role: Role;
    name: string;
}

export type AuthRequest = Request & {
    user?: JwtPayload;
};

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: 'Acesso negado. Nenhum token fornecido.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as JwtPayload;
        req.user = decoded;
        next();
    } catch (error) {
        // Clear invalid cookie from browser
        res.clearCookie('token');
        res.status(400).json({ message: 'Token inválido ou expirado.' });
    }
};

export default authMiddleware;
