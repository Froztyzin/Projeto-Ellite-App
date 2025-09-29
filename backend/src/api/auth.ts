import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { LogActionType, Role } from '../types';
import { addLog } from '../utils/logging';
import authMiddleware, { AuthRequest } from '../middleware/authMiddleware';
import { User, Member } from '../types';
import { db } from '../data';

const router = express.Router();

const sendTokenResponse = (res: express.Response, user: (User | Member) & { role: Role }, message: string) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, passwordResetToken, passwordResetExpires, ...userWithoutSensitiveData } = user;

    const token = jwt.sign(
        { id: user.id, role: user.role, name: user.nome },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '8h' }
    );

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 8 * 60 * 60 * 1000, // 8 hours,
    });

    res.json({ message, user: { ...userWithoutSensitiveData, role: user.role } });
};

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    try {
        const lowerCaseEmail = email.toLowerCase();
        let user: User | Member | undefined = db.users.find(u => u.email.toLowerCase() === lowerCaseEmail);
        let userRole: Role | undefined;

        if (user) {
            userRole = (user as User).role;
        } else {
            user = db.members.find(m => m.email.toLowerCase() === lowerCaseEmail);
            if (user) {
                userRole = Role.ALUNO;
            }
        }
        
        // Step 1: Check if user exists
        if (!user || !userRole) {
            return res.status(401).json({ message: 'Email ou senha inválidos.' });
        }
        
        // Step 2: Check if user has a password
        if (!user.password) {
            console.error(`User ${user.email} has no password set.`);
            return res.status(401).json({ message: 'Email ou senha inválidos.' });
        }
        
        // Step 3: Compare password
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Email ou senha inválidos.' });
        }
        
        // Step 4: Check if user is active
        if (!user.ativo) {
            const message = userRole === Role.ALUNO ? 'Sua matrícula não está ativa.' : 'Este usuário está inativo.';
            return res.status(403).json({ message });
        }
        
        // Step 5: Success, create session
        const userWithRole = { ...user, role: userRole };
        
        await addLog({
            action: LogActionType.LOGIN,
            details: `${userRole === Role.ALUNO ? 'Aluno(a)' : 'Usuário'} ${user.nome} fez login.`,
            userName: user.nome,
            userRole: userRole,
        });

        sendTokenResponse(res, userWithRole, 'Login bem-sucedido');

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie('token').json({ message: 'Logout realizado com sucesso.' });
});

router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Não autenticado." });
    }
    const userFromToken = req.user;
    
    let user: (User | Member | null) & { role?: Role } = null;
    
    if (userFromToken.role === Role.ALUNO) {
        user = db.members.find(m => m.id === userFromToken.id) || null;
    } else {
        user = db.users.find(u => u.id === userFromToken.id) || null;
    }

    if (!user) {
         return res.status(404).json({ message: "Usuário não encontrado." });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, passwordResetToken, passwordResetExpires, ...userToReturn } = user;
    
    res.json({ ...userToReturn, role: userFromToken.role, name: userFromToken.name });
});

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email é obrigatório.' });
    }

    try {
        let user: User | Member | null = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
            user = db.members.find(m => m.email.toLowerCase() === email.toLowerCase());
        }

        if (!user) {
            return res.json({ message: 'Se um usuário com este email existir, um link de redefinição foi enviado.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        console.log(`Password reset link for ${email}: /#/reset-password/${resetToken}`);

        res.json({ message: 'Se um usuário com este email existir, um link de redefinição foi enviado.' });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

router.post('/reset-password/:token', async (req, res) => {
    const { password } = req.body;
    const { token } = req.params;

    if (!password || password.length < 6) {
        return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres.' });
    }

    try {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        
        let user: User | Member | null = db.users.find(u => 
            u.passwordResetToken === hashedToken && u.passwordResetExpires && u.passwordResetExpires > new Date()
        );

        if (!user) {
            user = db.members.find(m => 
                m.passwordResetToken === hashedToken && m.passwordResetExpires && m.passwordResetExpires > new Date()
            );
        }
        
        if (!user) {
            return res.status(400).json({ message: 'Token de redefinição inválido ou expirado.' });
        }

        user.password = await bcrypt.hash(password, 10);
        user.passwordResetToken = null;
        user.passwordResetExpires = null;

        res.json({ message: 'Senha redefinida com sucesso.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

export default router;