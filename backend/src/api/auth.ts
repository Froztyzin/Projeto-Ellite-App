import { Router, Request, Response } from 'express';
import db from '../db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

// Rota de login para a equipe (admin, financeiro, etc.)
router.post('/login/staff', async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    try {
        // Exemplo de consulta SQL para buscar o usuário
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }
        
        const user = userResult.rows[0];

        // Compara a senha fornecida com o hash armazenado no banco
        // const isMatch = await bcrypt.compare(password, user.password);
        
        // Simulação de verificação de senha para fins de teste
        const isMatch = password === 'password123'; // REMOVER EM PRODUÇÃO

        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        // Gera o token JWT
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '8h' }
        );
        
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...userWithoutPassword } = user;

        res.json({ token, user: userWithoutPassword });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

// Rota de login para alunos
router.post('/login/student', async (req: Request, res: Response) => {
    const { email, cpf } = req.body;
    
    if (!email || !cpf) {
        return res.status(400).json({ message: 'Email e CPF são obrigatórios.' });
    }

    try {
        // Exemplo de consulta SQL para buscar o aluno
        const memberResult = await db.query('SELECT * FROM members WHERE email = $1 AND cpf = $2', [email, cpf.replace(/\D/g, '')]);

        if (memberResult.rows.length === 0) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }
        
        const member = memberResult.rows[0];
        const userPayload = { ...member, role: 'aluno' };

        // Gera o token JWT
        const token = jwt.sign(
            { id: userPayload.id, role: userPayload.role },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '8h' }
        );

        res.json({ token, user: userPayload });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

export default router;
