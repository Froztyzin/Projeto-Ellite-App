import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { LogActionType, Role, User, Member } from '../types';
import { addLog } from '../utils/logging';
import authMiddleware, { AuthRequest } from '../middleware/authMiddleware';
import { supabase } from '../lib/supabaseClient';
import { toCamelCase } from '../utils/mappers';

const router = express.Router();

type AppUser = (User | Member) & { role: Role };

const sendTokenResponse = (res: express.Response, user: AppUser, message: string) => {
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
        sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'strict',
        maxAge: 8 * 60 * 60 * 1000, // 8 hours
    });

    res.json({ message, user: { ...userWithoutSensitiveData, role: user.role } });
};

// Admin/Staff Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    try {
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email.toLowerCase())
            .single();

        if (userError || !user) {
            return res.status(401).json({ message: 'Email ou senha inválidos.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Email ou senha inválidos.' });
        }
        
        if (!user.ativo) {
            return res.status(403).json({ message: 'Este usuário está inativo.' });
        }

        const userWithRole: AppUser = { ...toCamelCase<User>(user), role: user.role as Role };
        
        await addLog({
            action: LogActionType.LOGIN,
            details: `Usuário ${userWithRole.nome} fez login.`,
            userName: userWithRole.nome,
            userRole: userWithRole.role,
        });

        sendTokenResponse(res, userWithRole, 'Login bem-sucedido');

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Student Login
router.post('/login-student', async (req, res) => {
    const { cpf, password } = req.body;
    if (!cpf || !password) {
        return res.status(400).json({ message: 'CPF e senha são obrigatórios.' });
    }
    const cleanedCpf = cpf.replace(/\D/g, '');

    try {
        const { data: memberUser, error: memberError } = await supabase
            .from('members')
            .select('*')
            .eq('cpf', cleanedCpf)
            .single();

        if (memberError || !memberUser) {
            return res.status(404).json({ message: 'CPF ou senha inválidos.' });
        }

        const isPasswordValid = await bcrypt.compare(password, memberUser.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'CPF ou senha inválidos.' });
        }

        if (!memberUser.ativo) {
            return res.status(403).json({ message: 'Sua matrícula não está ativa. Entre em contato com a recepção.' });
        }

        const userWithRole: AppUser = { ...toCamelCase<Member>(memberUser), role: Role.ALUNO };

        await addLog({
            action: LogActionType.LOGIN,
            details: `Aluno(a) ${userWithRole.nome} fez login pelo portal.`,
            userName: userWithRole.nome,
            userRole: Role.ALUNO,
        });

        sendTokenResponse(res, userWithRole, 'Login bem-sucedido');

    } catch (error) {
        console.error('Student login error:', error);
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
    const { id, role } = req.user;
    
    const tableName = role === Role.ALUNO ? 'members' : 'users';
    const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();

    if (error || !data) {
        res.clearCookie('token');
        return res.status(404).json({ message: "Usuário não encontrado." });
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userToReturn } = toCamelCase<User | Member>(data);
    res.json({ ...userToReturn, role });
});

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email é obrigatório.' });
    }
    // This is a mock implementation as we are not using Supabase Auth for staff.
    // In a real app with Supabase Auth, you would use supabase.auth.resetPasswordForEmail
    console.log(`Password reset requested for ${email}`);
    res.json({ message: 'Se um usuário com este email existir, um link de redefinição foi enviado.' });
});

router.post('/reset-password', async (req, res) => {
    const { password, token } = req.body;
    // Mock implementation. In a real app, you would validate the token and update the user's password hash.
    if(token === "mock-reset-token" && password) {
        console.log("Password has been reset (mock).");
        return res.json({ message: 'Senha redefinida com sucesso.' });
    }
    res.status(400).json({ message: 'Token inválido ou expirado.' });
});

export default router;