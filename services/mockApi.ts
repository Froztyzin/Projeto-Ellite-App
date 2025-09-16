





/*
 * =====================================================================================
 * Backend Server Implementation
 * =====================================================================================
 * This file contains the complete Node.js/Express backend.
 * In a real-world scenario, this would be a separate project with its own file structure.
 * It connects to a Postgres database specified by DATABASE_URL.
 *
 * Required npm packages:
 * "express": "^4.18.2",
 * "pg": "^8.11.3",
 * "cors": "^2.8.5",
 * "dotenv": "^16.3.1"
 *
 * To run this server:
 * 1. Create a `backend` directory.
 * 2. Move this file to `backend/server.js`.
 * 3. Run `npm init -y` and `npm install express pg cors dotenv`.
 * 4. Create a `.env` file with `DATABASE_URL=your_postgres_connection_string`.
 * 5. Run `node backend/server.js`.
 * =====================================================================================
 */
// Fix: Declare `require` to satisfy TypeScript compiler for this Node.js example file.
declare var require: any;
// FIX: Added Buffer declaration for Node.js compatibility in a frontend TS environment.
declare var Buffer: any;
// FIX: Removed redeclaration of `process`. It's a global type provided by Node.js type definitions.

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { faker } = require('@faker-js/faker/locale/pt_BR');
// FIX: Renamed `crypto` to `nodeCrypto` to avoid conflict with the browser's global `crypto` object, which caused a redeclaration error.
const nodeCrypto = require('crypto');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// --- DATABASE CONNECTION ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- UTILS ---
const snakeToCamel = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(snakeToCamel);
    return Object.keys(obj).reduce((acc, key) => {
        const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        acc[camelKey] = snakeToCamel(obj[key]);
        return acc;
    }, {});
};

const handle = async (promise) => {
    try {
        const data = await promise;
        return [data, undefined];
    } catch (error) {
        return [undefined, error];
    }
}

// --- PASSWORD HASHING ---
// NOTE: These functions implement secure password hashing.
// Passwords are never stored in plaintext.

const hashPassword = (password) => {
    // Generate a random salt for each password
    // FIX: Use `nodeCrypto` which refers to the Node.js crypto module. `randomBytes` is not available on the browser's crypto object.
    const salt = nodeCrypto.randomBytes(16).toString('hex');
    // Hash the password with the salt using PBKDF2
    // FIX: Use `nodeCrypto` which refers to the Node.js crypto module. `pbkdf2Sync` is not available on the browser's crypto object.
    const hash = nodeCrypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    // Store both salt and hash, separated by a colon
    return `${salt}:${hash}`;
};

const verifyPassword = (password, storedPassword) => {
    try {
        const [salt, originalHash] = storedPassword.split(':');
        // Re-hash the incoming password using the stored salt
        // FIX: Use `nodeCrypto` which refers to the Node.js crypto module. `pbkdf2Sync` is not available on the browser's crypto object.
        const hash = nodeCrypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
        // Compare the hashes securely to prevent timing attacks
        // FIX: Use `nodeCrypto` which refers to the Node.js crypto module. `timingSafeEqual` is not available on the browser's crypto object. Also, `Buffer` is now declared.
        return nodeCrypto.timingSafeEqual(Buffer.from(hash), Buffer.from(originalHash));
    } catch (error) {
        // If storedPassword is not in the "salt:hash" format or any other error occurs
        return false;
    }
};


// --- LOGGING ---
// Note: In a real app, user details would come from an auth middleware.
const addLog = async (action, details, userName = 'Sistema', userRole = 'system') => {
    await pool.query(
        'INSERT INTO audit_logs (id, timestamp, user_name, user_role, action, details) VALUES ($1, $2, $3, $4, $5, $6)',
        [faker.string.uuid(), new Date(), userName, userRole, action, details]
    );
};

// --- API ROUTES ---

// Auth
app.post('/api/auth/login', async (req, res) => {
    const { email, credential, userType } = req.body;
    
    if (userType === 'staff') {
        const [userResult, userError] = await handle(pool.query('SELECT * FROM users WHERE email = $1 AND ativo = TRUE', [email]));
        
        if (userError || !userResult || userResult.rows.length === 0) {
            return res.status(401).json({ message: 'Credenciais inválidas ou usuário inativo.' });
        }
        
        const user = userResult.rows[0];
        // Securely verify the provided password against the stored hash
        const isPasswordValid = verifyPassword(credential, user.password_hash);
        
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Credenciais inválidas ou usuário inativo.' });
        }
        
        await addLog('LOGIN', `Usuário ${email} efetuou login.`, user.nome, user.role);
        delete user.password_hash; // Important: Do not send the hash to the client
        res.json(snakeToCamel(user));

    } else { // student login
        const cleanedCpf = credential.replace(/\D/g, '');
        const [userResult] = await handle(pool.query('SELECT id, nome, email, \'aluno\' as role, ativo FROM members WHERE email = $1 AND cpf = $2 AND ativo = TRUE', [email, cleanedCpf]));
        
        if (!userResult || userResult.rows.length === 0) {
            return res.status(401).json({ message: 'Credenciais inválidas ou usuário inativo.' });
        }
        
        await addLog('LOGIN', `Usuário ${email} efetuou login.`, userResult.rows[0].nome, userResult.rows[0].role);
        res.json(snakeToCamel(userResult.rows[0]));
    }
});

// Users (Staff Management)
app.get('/api/users', async (req, res) => {
    const [data, error] = await handle(pool.query("SELECT id, nome, email, role, ativo FROM users WHERE role != 'aluno' ORDER BY nome ASC"));
    if (error) return res.status(500).json({ message: error.message });
    res.json(snakeToCamel(data.rows));
});

app.post('/api/users', async (req, res) => {
    const { nome, email, role, password } = req.body;
    if (!nome || !email || !role || !password) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }
    // Hash the password before storing it
    const passwordHash = hashPassword(password);
    const [data, error] = await handle(pool.query(
        'INSERT INTO users (id, nome, email, role, password_hash, ativo) VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING id, nome, email, role, ativo',
        [faker.string.uuid(), nome, email, role, passwordHash]
    ));
    if (error) {
        if (error.code === '23505') return res.status(409).json({ message: 'Este e-mail já está em uso.' });
        return res.status(500).json({ message: error.message });
    }
    await addLog('CREATE', `Novo usuário da equipe criado: ${nome}`);
    res.status(201).json(snakeToCamel(data.rows[0]));
});

app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, email, role, password } = req.body;
    
    let query, params;
    if (password) {
        // Hash the new password if it's being changed
        const passwordHash = hashPassword(password);
        query = 'UPDATE users SET nome = $1, email = $2, role = $3, password_hash = $4 WHERE id = $5 RETURNING id, nome, email, role, ativo';
        params = [nome, email, role, passwordHash, id];
    } else {
        query = 'UPDATE users SET nome = $1, email = $2, role = $3 WHERE id = $4 RETURNING id, nome, email, role, ativo';
        params = [nome, email, role, id];
    }

    const [data, error] = await handle(pool.query(query, params));
    if (error) {
         if (error.code === '23505') return res.status(409).json({ message: 'Este e-mail já está em uso.' });
        return res.status(500).json({ message: error.message });
    }
    await addLog('UPDATE', `Usuário da equipe atualizado: ${nome}`);
    res.json(snakeToCamel(data.rows[0]));
});

app.post('/api/users/:id/toggle-status', async (req, res) => {
    const { id } = req.params;
    const [data, error] = await handle(pool.query('UPDATE users SET ativo = NOT ativo WHERE id = $1 RETURNING *', [id]));
    if (error) return res.status(500).json({ message: error.message });
    await addLog('UPDATE', `Status do usuário ${data.rows[0].nome} alterado para ${data.rows[0].ativo ? 'ATIVO' : 'INATIVO'}.`);
    res.json(snakeToCamel(data.rows[0]));
});

app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const userRes = await pool.query('SELECT nome FROM users WHERE id = $1', [id]);
    if (userRes.rows.length === 0) return res.status(404).json({ message: 'Usuário não encontrado.' });
    
    const [data, error] = await handle(pool.query('DELETE FROM users WHERE id = $1', [id]));
    if (error) return res.status(500).json({ message: error.message });
    
    await addLog('DELETE', `Usuário da equipe ${userRes.rows[0].nome} foi excluído.`);
    res.json({ success: true });
});


// Members
app.get('/api/members', async (req, res) => {
    const { query, statusFilter } = req.query;
    let queryString = 'SELECT * FROM members';
    const queryParams = [];
    
    let whereClauses = [];
    if (statusFilter && statusFilter !== 'ALL') {
        queryParams.push(statusFilter === 'ACTIVE');
        whereClauses.push(`ativo = $${queryParams.length}`);
    }
    if (query) {
        queryParams.push(`%${query.toLowerCase()}%`);
        whereClauses.push(`(LOWER(nome) LIKE $${queryParams.length} OR cpf LIKE $${queryParams.length})`);
    }

    if (whereClauses.length > 0) {
        queryString += ' WHERE ' + whereClauses.join(' AND ');
    }
    queryString += ' ORDER BY nome ASC';

    const [data, error] = await handle(pool.query(queryString, queryParams));
    if (error) return res.status(500).json({ message: error.message });
    res.json(snakeToCamel(data.rows));
});

app.post('/api/members', async (req, res) => {
    const { memberData, planId } = req.body;
    const { nome, cpf, dataNascimento, email, telefone } = memberData;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const newMemberId = faker.string.uuid();
        
        const memberRes = await client.query(
            'INSERT INTO members (id, nome, cpf, data_nascimento, email, telefone, ativo) VALUES ($1, $2, $3, $4, $5, $6, TRUE) RETURNING *',
            [newMemberId, nome, cpf, dataNascimento, email, telefone]
        );
        
        if (planId) {
            const planRes = await client.query('SELECT * FROM plans WHERE id = $1', [planId]);
            if(planRes.rows.length > 0){
                 const plan = planRes.rows[0];
                 const now = new Date();
                 let endDate = new Date(now);
                 if (plan.periodicidade === 'MENSAL') endDate.setMonth(endDate.getMonth() + 1);
                 else if (plan.periodicidade === 'TRIMESTRAL') endDate.setMonth(endDate.getMonth() + 3);
                 else if (plan.periodicidade === 'ANUAL') endDate.setFullYear(endDate.getFullYear() + 1);
                
                await client.query(
                    'INSERT INTO enrollments (id, member_id, plan_id, inicio, fim, status, dia_vencimento) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    [faker.string.uuid(), newMemberId, planId, now, endDate, 'ATIVA', now.getDate()]
                );
            }
        }
        await addLog('CREATE', `Novo aluno criado: ${nome}`, 'API', 'SYSTEM');
        await client.query('COMMIT');
        res.status(201).json(snakeToCamel(memberRes.rows[0]));
    } catch (e) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Falha ao criar aluno: ' + e.message });
    } finally {
        client.release();
    }
});

app.get('/api/members/:id', async (req, res) => {
    const { id } = req.params;
    const [data, error] = await handle(pool.query('SELECT * FROM members WHERE id = $1', [id]));
    if (error) return res.status(500).json({ message: error.message });
    if (data.rows.length === 0) return res.status(404).json({ message: 'Member not found' });
    res.json(snakeToCamel(data.rows[0]));
});

app.put('/api/members/:id', async (req, res) => {
    const { id } = req.params;
    const { memberData } = req.body;
    const { nome, cpf, dataNascimento, email, telefone, observacoes } = memberData;
    const [data, error] = await handle(pool.query(
        'UPDATE members SET nome = $1, cpf = $2, data_nascimento = $3, email = $4, telefone = $5, observacoes = $6 WHERE id = $7 RETURNING *',
        [nome, cpf, dataNascimento, email, telefone, observacoes, id]
    ));
    if (error) return res.status(500).json({ message: error.message });
    await addLog('UPDATE', `Dados do aluno ${nome} atualizados.`);
    res.json(snakeToCamel(data.rows[0]));
});


app.post('/api/members/:id/toggle-status', async (req, res) => {
    const { id } = req.params;
    const [data, error] = await handle(pool.query('UPDATE members SET ativo = NOT ativo WHERE id = $1 RETURNING *', [id]));
    if (error) return res.status(500).json({ message: error.message });
    await addLog('UPDATE', `Status do aluno ${data.rows[0].nome} alterado para ${data.rows[0].ativo ? 'ATIVO' : 'INATIVO'}.`);
    res.json(snakeToCamel(data.rows[0]));
});

app.delete('/api/members/:id', async (req, res) => {
    const { id } = req.params;
     // Note: In a real app, you might soft-delete instead. Deleting payments/invoices can cause issues with financial records.
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const memberRes = await client.query('SELECT nome FROM members WHERE id = $1', [id]);
        if (memberRes.rows.length === 0) throw new Error('Aluno não encontrado.');
        const memberName = memberRes.rows[0].nome;
        
        await client.query('DELETE FROM payments WHERE invoice_id IN (SELECT id FROM invoices WHERE member_id = $1)', [id]);
        await client.query('DELETE FROM notifications WHERE member_id = $1', [id]);
        await client.query('DELETE FROM invoices WHERE member_id = $1', [id]);
        await client.query('DELETE FROM enrollments WHERE member_id = $1', [id]);
        await client.query('DELETE FROM members WHERE id = $1', [id]);
        
        await addLog('DELETE', `Aluno ${memberName} e todos os seus dados foram excluídos.`);
        await client.query('COMMIT');
        res.json({ success: true });
    } catch(e) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: e.message });
    } finally {
        client.release();
    }
});

// Invoices
app.get('/api/invoices', async (req, res) => {
    const query = `
        SELECT i.*, row_to_json(m.*) as member
        FROM invoices i
        JOIN members m ON i.member_id = m.id
        ORDER BY i.vencimento DESC
    `;
    const [data, error] = await handle(pool.query(query));
    if (error) return res.status(500).json({ message: error.message });

    // Attach payments to each invoice
    const invoiceIds = data.rows.map(i => i.id);
    if(invoiceIds.length > 0) {
        const paymentsRes = await pool.query('SELECT * FROM payments WHERE invoice_id = ANY($1::uuid[])', [invoiceIds]);
        const paymentsByInvoice = paymentsRes.rows.reduce((acc, p) => {
            if (!acc[p.invoice_id]) acc[p.invoice_id] = [];
            acc[p.invoice_id].push(p);
            return acc;
        }, {});

        data.rows.forEach(invoice => {
            invoice.payments = paymentsByInvoice[invoice.id] || [];
        });
    }

    res.json(snakeToCamel(data.rows));
});

app.post('/api/invoices/generate', async (req, res) => {
    // This is a complex operation and should ideally be a scheduled background job.
    // Simplified simulation for the API endpoint.
    // Logic: Find active enrollments, check if an invoice for next month exists, if not, create it.
    await addLog('GENERATE', 'Geração de faturas mensais iniciada.');
    res.json({ generatedCount: 0 }); // Placeholder
});

app.post('/api/invoices/:id/payment-link', async (req, res) => {
    // Mock implementation. A real implementation would integrate with a payment gateway.
    const { id } = req.params;
    const settings = await pool.query("SELECT value FROM settings WHERE key = 'pixKey'");
    if(settings.rows.length === 0 || !settings.rows[0].value) {
        return res.status(400).json({ message: "Chave PIX não configurada nas Configurações."});
    }
    res.json({ link: `https://fake-payment-gateway.com/pay/${id}` });
});

// Expenses
app.get('/api/expenses', async (req, res) => {
    const [data, error] = await handle(pool.query('SELECT * FROM expenses ORDER BY data DESC'));
    if (error) return res.status(500).json({ message: error.message });
    res.json(snakeToCamel(data.rows));
});

// Plans
app.get('/api/plans', async (req, res) => {
    const [data, error] = await handle(pool.query('SELECT * FROM plans ORDER BY preco_base ASC'));
    if (error) return res.status(500).json({ message: error.message });
    res.json(snakeToCamel(data.rows));
});


// Dashboard
app.get('/api/dashboard', async (req, res) => {
    // This endpoint would run multiple complex queries to aggregate data.
    // Returning a mocked structure for brevity.
    const mockData = {
        kpis: {
            receitaMes: Math.random() * 20000, despesasMes: Math.random() * 5000,
            lucroLiquido: Math.random() * 15000, novosAlunosMes: Math.floor(Math.random() * 20),
            faturasVencendo: Math.floor(Math.random() * 10),
            receitaChange: (Math.random() - 0.5) * 20, despesasChange: (Math.random() - 0.5) * 20,
            lucroChange: (Math.random() - 0.5) * 20, novosAlunosChange: (Math.random() - 0.5) * 20,
        },
        monthlyGoal: { current: 15000, target: 25000 },
        cashFlowData: Array.from({length: 6}, (_, i) => ({ 
            name: new Date(2023, i, 1).toLocaleString('default', { month: 'short' }),
            Receita: 15000 + Math.random() * 10000,
            Despesa: 4000 + Math.random() * 3000,
            month: i,
            year: 2023,
        })),
        recentActivity: [], atRiskMembers: [],
    };
    res.json(mockData);
});


// Other Entity Endpoints (Simplified)

// Student profile data
app.get('/api/students/:id/profile', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        const memberRes = await client.query('SELECT * FROM members WHERE id = $1', [id]);
        if (memberRes.rows.length === 0) return res.status(404).json({ message: 'Student not found' });
        
        const enrollmentRes = await client.query('SELECT e.*, row_to_json(p.*) as plan FROM enrollments e JOIN plans p ON e.plan_id = p.id WHERE e.member_id = $1 AND e.status = \'ATIVA\'', [id]);
        const invoicesRes = await client.query('SELECT * FROM invoices WHERE member_id = $1 ORDER BY vencimento DESC', [id]);

        res.json(snakeToCamel({
            member: memberRes.rows[0],
            enrollment: enrollmentRes.rows.length > 0 ? enrollmentRes.rows[0] : null,
            invoices: invoicesRes.rows,
            plan: enrollmentRes.rows.length > 0 ? enrollmentRes.rows[0].plan : null,
        }));
    } catch(e) {
        res.status(500).json({ message: e.message });
    } finally {
        client.release();
    }
});


// Reports
app.get('/api/reports/main', async (req, res) => { res.status(501).json({message: 'Not implemented'}); });
app.get('/api/reports/payments', async (req, res) => { res.status(501).json({message: 'Not implemented'}); });
app.post('/api/reports/summary', async (req, res) => { res.json({ summary: "A análise por IA está em desenvolvimento. Os dados parecem promissores." }); });

// Notifications
app.get('/api/notifications', async (req, res) => {
    const [data, error] = await handle(pool.query('SELECT n.*, row_to_json(m.*) as member, row_to_json(i.*) as invoice FROM notifications n JOIN members m ON n.member_id = m.id JOIN invoices i ON n.invoice_id = i.id ORDER BY n.sent_at DESC'));
    if (error) return res.status(500).json({ message: error.message });
    res.json(snakeToCamel(data.rows));
});
app.post('/api/notifications/generate', async (req, res) => {
    await addLog('GENERATE', 'Geração de notificações iniciada.');
    res.json({ generatedCount: 0 }); // Placeholder
});
app.get('/api/students/:id/notifications', async (req, res) => {
    const { id } = req.params;
    const [data, error] = await handle(pool.query('SELECT n.*, row_to_json(m.*) as member, row_to_json(i.*) as invoice FROM notifications n JOIN members m ON n.member_id = m.id JOIN invoices i ON n.invoice_id = i.id WHERE n.member_id = $1 ORDER BY n.sent_at DESC', [id]));
    if (error) return res.status(500).json({ message: error.message });
    res.json(snakeToCamel(data.rows));
});


// Logs
app.get('/api/logs', async (req, res) => {
    const [data, error] = await handle(pool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 200'));
    if (error) return res.status(500).json({ message: error.message });
    res.json(snakeToCamel(data.rows));
});

// Settings (using a simple key-value table)
app.get('/api/settings', async (req, res) => {
    const [data, error] = await handle(pool.query('SELECT * FROM settings'));
    if (error) return res.status(500).json({ message: error.message });
    const settingsObj = data.rows.reduce((acc, row) => {
        try {
            acc[snakeToCamel(row.key)] = JSON.parse(row.value);
        } catch (e) {
            acc[snakeToCamel(row.key)] = row.value;
        }
        return acc;
    }, {});
    res.json(settingsObj);
});

app.post('/api/settings', async (req, res) => {
    const settings = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const key in settings) {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            const value = JSON.stringify(settings[key]);
            await client.query(
                'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
                [snakeKey, value]
            );
        }
        await addLog('UPDATE', 'Configurações do sistema foram atualizadas.');
        await client.query('COMMIT');
        res.status(200).send();
    } catch(e) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: e.message });
    } finally {
        client.release();
    }
});


// AI Assistant (Mock)
app.post('/api/assistant/query', async (req, res) => {
    const { question } = req.body;
    // Basic mock logic, a real implementation would query the DB and use a GenAI model
    if (question.toLowerCase().includes('quantos alunos ativos')) {
        const result = await pool.query('SELECT COUNT(*) FROM members WHERE ativo = TRUE');
        res.json({ response: `Atualmente, temos ${result.rows[0].count} alunos ativos.` });
    } else {
        res.json({ response: "Desculpe, ainda estou aprendendo. Tente perguntar 'quantos alunos ativos temos?'" });
    }
});

// --- SERVER INITIALIZATION ---

const ensureAdminUserExists = async () => {
    const client = await pool.connect();
    try {
        const adminResult = await client.query("SELECT * FROM users WHERE role = 'admin' LIMIT 1");
        if (adminResult.rows.length === 0) {
            console.log("Nenhum usuário administrador encontrado. Criando um usuário padrão...");
            const adminEmail = 'admin@academia.com';
            // Generate a secure, random password instead of using a hardcoded one.
            const adminPassword = nodeCrypto.randomBytes(8).toString('hex'); // Creates a 16-character hex string password
            
            // Hash the generated admin password before storing
            const passwordHash = hashPassword(adminPassword);
            
            await client.query(
                'INSERT INTO users (id, nome, email, role, password_hash, ativo) VALUES ($1, $2, $3, $4, $5, TRUE)',
                [faker.string.uuid(), 'Admin Padrão', adminEmail, 'admin', passwordHash]
            );
            console.log("\n=====================================");
            console.log("IMPORTANTE: Usuário Administrador Padrão Criado");
            console.log("As credenciais abaixo são para o primeiro acesso. Guarde-as em um local seguro.");
            console.log(`Email: ${adminEmail}`);
            console.log(`Senha Provisória: ${adminPassword}`); // Log the generated password
            console.log("Recomenda-se alterar a senha após o primeiro login.");
            console.log("=====================================\n");
        }
    } catch (err) {
        console.error("Erro ao verificar/criar usuário admin:", err);
    } 
    finally {
        client.release();
    }
};

app.listen(port, () => {
  ensureAdminUserExists().catch(console.error);
  console.log(`Server running on http://localhost:${port}`);
});