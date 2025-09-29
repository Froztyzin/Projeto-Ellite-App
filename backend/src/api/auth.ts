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
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email.toLowerCase(),
            password,
        });

        if (authError || !authData.user) {
            return res.status(401).json({ message: 'Email ou senha inválidos.' });
        }

        let userProfile: any = null;
        let userRole: Role | null = null;
        
        // Check if it's a system user first
        const { data: systemUser, error: systemUserError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();
        
        if (systemUser) {
            userProfile = systemUser;
            userRole = systemUser.role;
        } else {
            // If not a system user, check if it's a member
            const { data: memberUser, error: memberUserError } = await supabase
                .from('members')
                .select('*')
                .eq('id', authData.user.id)
                .single();
            
            if (memberUser) {
                userProfile = memberUser;
                userRole = Role.ALUNO;
            }
        }
        
        if (!userProfile || !userRole) {
            await supabase.auth.admin.deleteUser(authData.user.id); // Clean up inconsistent user
            return res.status(404).json({ message: 'Perfil de usuário não encontrado.' });
        }
        
        if (!userProfile.ativo) {
            const message = userRole === Role.ALUNO ? 'Sua matrícula não está ativa.' : 'Este usuário está inativo.';
            return res.status(403).json({ message });
        }

        const userWithRole: AppUser = { ...toCamelCase<User | Member>(userProfile), role: userRole };
        
        await addLog({
            action: LogActionType.LOGIN,
            details: `${userRole === Role.ALUNO ? 'Aluno(a)' : 'Usuário'} ${userWithRole.nome} fez login.`,
            userName: userWithRole.nome,
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
    const { id, role, name } = req.user;
    
    const tableName = role === Role.ALUNO ? 'members' : 'users';
    const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();

    if (error || !data) {
        return res.status(404).json({ message: "Usuário não encontrado." });
    }

    res.json({ ...toCamelCase(data), role, name });
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

router.post('/reset-password/:token', async (req, res) => {
    const { password } = req.body;
    const access_token = req.headers['x-access-token'] as string;

    if (!password || password.length < 6) {
        return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres.' });
    }
    if (!access_token) {
        return res.status(400).json({ message: 'Token de acesso é necessário.' });
    }

    try {
        const { error } = await supabase.auth.updateUser({ password }, {
            jwt: access_token
        });

        if (error) throw error;
        
        res.json({ message: 'Senha redefinida com sucesso.' });
    } catch (error: any) {
        console.error('Reset password error:', error.message);
        res.status(400).json({ message: error.message || 'Token inválido ou expirado.' });
    }
});

export default router;