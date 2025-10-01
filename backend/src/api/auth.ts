import express from 'express';
import jwt from 'jsonwebtoken';
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
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
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
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email.toLowerCase(),
            password,
        });

        if (authError || !authData.user) {
            // Check if it's a student trying to log in, give a specific message
            const { data: memberUser } = await supabase.from('members').select('id').eq('email', email.toLowerCase()).single();
            if (memberUser) {
                 return res.status(403).json({ message: 'Acesso de aluno deve ser feito via CPF na aba "Aluno".' });
            }
            return res.status(401).json({ message: 'Email ou senha inválidos.' });
        }
        
        const { data: systemUser } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();
        
        if (!systemUser) {
            await supabase.auth.signOut();
            return res.status(403).json({ message: 'Acesso negado. Este portal é apenas para administradores.' });
        }
        
        if (!systemUser.ativo) {
            await supabase.auth.signOut();
            return res.status(403).json({ message: 'Este usuário está inativo.' });
        }

        const userWithRole: AppUser = { ...toCamelCase<User>(systemUser), role: systemUser.role as Role };
        
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


router.post('/login-student', async (req, res) => {
    const { cpf } = req.body;
    if (!cpf) {
        return res.status(400).json({ message: 'CPF é obrigatório.' });
    }

    const cleanedCpf = cpf.replace(/\D/g, '');
    if (cleanedCpf.length !== 11) {
        return res.status(400).json({ message: 'CPF inválido.' });
    }

    try {
        const { data: memberUser, error: memberError } = await supabase
            .from('members')
            .select('*')
            .eq('cpf', cleanedCpf)
            .single();

        if (memberError || !memberUser) {
            return res.status(404).json({ message: 'CPF não encontrado em nosso sistema.' });
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
    // FIX: Explicitly type the result of toCamelCase to ensure 'password' property is recognized for destructuring.
    const { password, ...userToReturn } = toCamelCase<User | Member>(data);
    res.json({ ...userToReturn, role });
});

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email é obrigatório.' });
    }
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
            redirectTo: `${process.env.FRONTEND_URL}/#/reset-password`,
        });

        if (error) {
            console.error('Supabase forgot password error:', error.message);
        }
        
        res.json({ message: 'Se um usuário com este email existir, um link de redefinição foi enviado.' });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

router.post('/reset-password', async (req, res) => {
    const { password } = req.body;
    const access_token = req.headers['x-access-token'] as string;

    if (!password || password.length < 6) {
        return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres.' });
    }
    if (!access_token) {
        return res.status(400).json({ message: 'Token de acesso é necessário.' });
    }

    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser(access_token);
        if (userError || !user) throw userError || new Error('User not found');
        
        const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, { password });
        if (updateError) throw updateError;
        
        res.json({ message: 'Senha redefinida com sucesso.' });
    } catch (error: any) {
        console.error('Reset password error:', error.message);
        res.status(400).json({ message: error.message || 'Token inválido ou expirado.' });
    }
});

export default router;
