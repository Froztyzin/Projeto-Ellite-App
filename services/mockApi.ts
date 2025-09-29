import { faker } from '@faker-js/faker/locale/pt_BR';
import { v4 as uuidv4 } from 'uuid';
import {
  Member, Plan, Enrollment, Invoice, Payment, Expense, Notification, AuditLog, User,
  Role, PlanPeriodicity, EnrollmentStatus, InvoiceStatus, PaymentMethod, NotificationType, NotificationChannel, NotificationStatus, LogActionType
} from '../types';

// Simulate backend latency
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

const SESSION_KEY = 'mock_user_session';

// --- Data Stores ---
let members: Member[] = [];
let plans: Plan[] = [];
let enrollments: Enrollment[] = [];
let invoices: Invoice[] = [];
let payments: Payment[] = [];
let expenses: Expense[] = [];
let notifications: Notification[] = [];
let logs: AuditLog[] = [];
let users: User[] = [];
let settings: any = {
    remindersEnabled: true,
    daysBeforeDue: 3,
    overdueEnabled: true,
    gymName: "Elitte Corpus Academia",
    pixKey: "a1b2c3d4-e5f6-a1b2-c3d4-e5f6a1b2c3d4",
};

// Fake password hash
const FAKE_HASH = '$2a$10$abcdefghijklmnopqrstuv';

// --- Data Generation ---
const generateData = () => {
  // Reset arrays
  members = []; plans = []; enrollments = []; invoices = []; payments = [];
  expenses = []; notifications = []; logs = []; users = [];

  // --- Generate Users ---
  users.push({ id: uuidv4(), nome: 'Admin Master', email: 'admin@elitte.com', role: Role.ADMIN, ativo: true, password: FAKE_HASH });
  users.push({ id: uuidv4(), nome: 'Financeiro User', email: 'financeiro@elitte.com', role: Role.FINANCEIRO, ativo: true, password: FAKE_HASH });
  users.push({ id: uuidv4(), nome: 'Recepção User', email: 'recepcao@elitte.com', role: Role.RECEPCAO, ativo: true, password: FAKE_HASH });
  users.push({ id: uuidv4(), nome: 'Instrutor User', email: 'instrutor@elitte.com', role: Role.INSTRUTOR, ativo: true, password: FAKE_HASH });

  // --- Generate Plans ---
  const planMensal = { id: uuidv4(), nome: 'Plano Mensal', periodicidade: PlanPeriodicity.MENSAL, precoBase: 99.90, ativo: true };
  const planTrimestral = { id: uuidv4(), nome: 'Plano Trimestral', periodicidade: PlanPeriodicity.TRIMESTRAL, precoBase: 270.00, ativo: true };
  const planAnual = { id: uuidv4(), nome: 'Plano Anual', periodicidade: PlanPeriodicity.ANUAL, precoBase: 1000.00, ativo: true };
  plans.push(planMensal, planTrimestral, planAnual);
  plans.push({ id: uuidv4(), nome: 'Plano Crossfit (Inativo)', periodicidade: PlanPeriodicity.MENSAL, precoBase: 150.00, ativo: false });
  const activePlans = [planMensal, planTrimestral, planAnual];

  // --- Generate Members and related data ---
  for (let i = 0; i < 50; i++) {
    const nome = faker.person.fullName();
    const member: Member = {
      id: uuidv4(), nome,
      cpf: faker.string.numeric(11),
      dataNascimento: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
      email: i === 0 ? 'aluno@elitte.com' : faker.internet.email({ firstName: nome.split(' ')[0] }).toLowerCase(),
      telefone: faker.phone.number(),
      password: FAKE_HASH,
      ativo: faker.datatype.boolean(0.9),
      observacoes: i % 10 === 0 ? faker.lorem.sentence() : '',
    };
    members.push(member);

    // Create enrollment for the member
    const plan = faker.helpers.arrayElement(activePlans);
    const startDate = faker.date.past({ years: 2 });
    const enrollment: Enrollment = {
      id: uuidv4(),
      member: member, 
      plan: plan,
      inicio: startDate,
      fim: faker.date.future({ years: 1, refDate: startDate }),
      status: member.ativo ? EnrollmentStatus.ATIVA : EnrollmentStatus.CANCELADA,
      diaVencimento: faker.number.int({ min: 1, max: 28 }),
    };
    enrollments.push(enrollment);

    // Generate invoices for the last 12 months
    for (let j = 0; j < 12; j++) {
        const invoiceDate = new Date();
        invoiceDate.setMonth(invoiceDate.getMonth() - j);
        const isPaid = faker.datatype.boolean(0.8);
        const isOverdue = !isPaid && invoiceDate < new Date();
        let status: InvoiceStatus = isPaid ? InvoiceStatus.PAGA : isOverdue ? InvoiceStatus.ATRASADA : InvoiceStatus.ABERTA;

        const invoice: Invoice = {
            id: uuidv4(),
            member: member,
            competencia: `${invoiceDate.getFullYear()}-${(invoiceDate.getMonth() + 1).toString().padStart(2, '0')}`,
            vencimento: invoiceDate,
            valor: plan.precoBase,
            status,
            payments: [],
        };

        if (status === InvoiceStatus.PAGA) {
            const payment: Payment = {
                id: uuidv4(),
                invoiceId: invoice.id,
                valor: invoice.valor,
                data: faker.date.soon({ days: 5, refDate: invoice.vencimento }),
                metodo: faker.helpers.arrayElement(Object.values(PaymentMethod)),
            };
            payments.push(payment);
            invoice.payments?.push(payment);
        }
        invoices.push(invoice);
    }
  }

  // --- Generate Expenses ---
  for (let i = 0; i < 100; i++) {
    expenses.push({
      id: uuidv4(),
      categoria: faker.helpers.arrayElement(['Aluguel', 'Energia', 'Água', 'Equipamentos', 'Marketing', 'Salários', 'Limpeza', 'Outros']),
      descricao: faker.commerce.productName(),
      valor: parseFloat(faker.commerce.price({ min: 50, max: 2000 })),
      data: faker.date.past({ years: 1 }),
      fornecedor: faker.company.name(),
    });
  }
  
  logs.push({
    id: uuidv4(), timestamp: new Date(), userName: 'Sistema', userRole: Role.SYSTEM,
    action: LogActionType.GENERATE, details: 'Banco de dados de simulação inicializado.'
  });
  

  console.log("In-memory database generated for demonstration.");
};

// Initialize data
generateData();

const currentUser = (): { name: string; role: Role } => {
    const sessionData = sessionStorage.getItem(SESSION_KEY);
    if (sessionData) {
        const user = JSON.parse(sessionData);
        return { name: user.nome, role: user.role };
    }
    // Fallback for system actions before login
    return { name: 'Sistema', role: Role.SYSTEM };
};

// Fix: Loosen the type for `entry` to allow `userName` and `userRole` to be optional.
// The function implementation correctly falls back to the current user.
const addLogEntry = (entry: Pick<AuditLog, 'action' | 'details'> & Partial<Pick<AuditLog, 'userName' | 'userRole'>>) => {
    const user = currentUser();
    logs.unshift({ 
        id: uuidv4(), 
        timestamp: new Date(), 
        userName: user.name, 
        userRole: user.role, 
        ...entry 
    });
};

// =================================================================
//                      MOCK API FUNCTIONS
// =================================================================

// Auth
export const login = async (email: string, password: string): Promise<{ user: User }> => {
    await sleep(500);
    const lowerEmail = email.toLowerCase();
    
    // Find in system users
    let foundUser: User | Member | undefined = users.find(u => u.email.toLowerCase() === lowerEmail);
    let userRole: Role | undefined = (foundUser as User)?.role;

    // If not found in users, check members
    if (!foundUser) {
        foundUser = members.find(m => m.email.toLowerCase() === lowerEmail);
        if (foundUser) {
            userRole = Role.ALUNO;
        }
    }
    
    // In a real app, you'd check a hashed password. Here, we'll just check if the user exists.
    if (foundUser && password && userRole) {
        if (!foundUser.ativo) {
            const message = userRole === Role.ALUNO ? 'Sua matrícula não está ativa.' : 'Este usuário está inativo.';
            throw new Error(message);
        }

        const userToStore = { ...foundUser, role: userRole };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(userToStore));
        addLogEntry({ action: LogActionType.LOGIN, details: `Usuário ${foundUser.nome} fez login.`, userName: foundUser.nome, userRole });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: p, ...userToReturn } = userToStore;
        return { user: userToReturn as User };
    }
    throw new Error('Email ou senha inválidos.');
};

export const logout = async (): Promise<void> => {
    await sleep(200);
    sessionStorage.removeItem(SESSION_KEY);
};

export const checkSession = async (): Promise<User> => {
    await sleep(100);
    const sessionData = sessionStorage.getItem(SESSION_KEY);
    if (sessionData) {
        const user = JSON.parse(sessionData);
         // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userToReturn } = user;
        return userToReturn;
    }
    throw new Error("No active session");
};
export const forgotPassword = async (email: string): Promise<{ message: string }> => { await sleep(1000); return { message: 'Se um usuário com este email existir, um link de redefinição foi enviado.' }; };
export const resetPassword = async (token: string, password: string): Promise<{ message: string }> => { await sleep(1000); return { message: 'Senha redefinida com sucesso.' }; };


// Members
export const getMembers = async (query?: string, statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ACTIVE'): Promise<Member[]> => {
    await sleep(300);
    let filtered = [...members];
    if (statusFilter !== 'ALL') {
        filtered = filtered.filter(m => m.ativo === (statusFilter === 'ACTIVE'));
    }
    if (query) {
        filtered = filtered.filter(m => m.nome.toLowerCase().includes(query.toLowerCase()));
    }
    return filtered.sort((a,b) => a.nome.localeCompare(b.nome));
};

export const addMember = async (newMemberData: Omit<Member, 'id' | 'ativo'>, planId: string | null): Promise<Member> => {
    await sleep(500);
    const newMember: Member = {
        id: uuidv4(),
        ...newMemberData,
        ativo: true,
        password: FAKE_HASH
    };
    members.push(newMember);
    if (planId) {
        const plan = plans.find(p => p.id === planId);
        if (plan) {
            enrollments.push({
                id: uuidv4(), member: newMember, plan,
                inicio: new Date(), fim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                status: EnrollmentStatus.ATIVA, diaVencimento: new Date().getDate(),
            });
        }
    }
    addLogEntry({ action: LogActionType.CREATE, details: `Novo aluno "${newMember.nome}" criado.` });
    return newMember;
};

export const updateMember = async (updatedMemberData: Member, planId?: string | null): Promise<Member> => {
    await sleep(500);
    const index = members.findIndex(m => m.id === updatedMemberData.id);
    if (index > -1) {
        members[index] = { ...members[index], ...updatedMemberData };
        addLogEntry({ action: LogActionType.UPDATE, details: `Dados do aluno "${updatedMemberData.nome}" atualizados.` });
        return members[index];
    }
    throw new Error("Member not found");
};

export const toggleMemberStatus = async (memberId: string): Promise<Member> => {
    await sleep(300);
    const index = members.findIndex(m => m.id === memberId);
    if (index > -1) {
        members[index].ativo = !members[index].ativo;
        addLogEntry({ action: LogActionType.UPDATE, details: `Status do aluno "${members[index].nome}" alterado para ${members[index].ativo ? 'ATIVO' : 'INATIVO'}.` });
        return members[index];
    }
    throw new Error("Member not found");
};

export const deleteMember = async (memberId: string): Promise<{ success: boolean }> => {
    await sleep(800);
    const memberName = members.find(m => m.id === memberId)?.nome || 'Desconhecido';
    members = members.filter(m => m.id !== memberId);
    invoices = invoices.filter(i => i.member.id !== memberId);
    enrollments = enrollments.filter(e => e.member.id !== memberId);
    addLogEntry({ action: LogActionType.DELETE, details: `Aluno "${memberName}" e todos os seus dados foram excluídos.` });
    return { success: true };
};

export const getMemberById = async (id: string): Promise<Member | undefined> => {
    await sleep(200);
    return members.find(m => m.id === id);
};

export const getEnrollmentByMemberId = async (memberId: string): Promise<Enrollment | undefined> => {
    await sleep(200);
    return enrollments.find(e => e.member.id === memberId);
};

export const getInvoicesByMemberId = async (memberId: string): Promise<Invoice[]> => {
    await sleep(200);
    return invoices.filter(i => i.member.id === memberId);
};

export const globalSearch = async (query: string): Promise<{ members: Member[], invoices: Invoice[] }> => {
    await sleep(400);
    if (!query) return { members: [], invoices: [] };
    const lowercasedQuery = query.toLowerCase();
    const foundMembers = members.filter(m => m.nome.toLowerCase().includes(lowercasedQuery)).slice(0, 5);
    const foundInvoices = invoices.filter(i => i.member.nome.toLowerCase().includes(lowercasedQuery)).slice(0, 5);
    return { members: foundMembers, invoices: foundInvoices };
};


// Invoices
export const getInvoices = async (): Promise<Invoice[]> => {
    await sleep(400);
    return invoices.sort((a,b) => new Date(b.vencimento).getTime() - new Date(a.vencimento).getTime());
};

export const registerPayment = async (paymentData: { invoiceId: string; valor: number; data: Date; metodo: PaymentMethod; notas?: string; }): Promise<Invoice> => {
    await sleep(600);
    const invoiceIndex = invoices.findIndex(i => i.id === paymentData.invoiceId);
    if (invoiceIndex > -1) {
        const invoice = invoices[invoiceIndex];
        const newPayment: Payment = { id: uuidv4(), ...paymentData };
        payments.push(newPayment);
        invoice.payments = [...(invoice.payments || []), newPayment];

        const totalPaid = invoice.payments.reduce((sum, p) => sum + p.valor, 0);
        invoice.status = totalPaid >= invoice.valor ? InvoiceStatus.PAGA : InvoiceStatus.PARCIALMENTE_PAGA;
        
        addLogEntry({ action: LogActionType.PAYMENT, details: `Pagamento de ${paymentData.valor} registrado para ${invoice.member.nome}.` });
        return invoice;
    }
    throw new Error("Invoice not found");
};

export const generateMonthlyInvoices = async (): Promise<{ generatedCount: number }> => {
    await sleep(1500);
    const count = faker.number.int({min: 0, max: 5});
    addLogEntry({ action: LogActionType.GENERATE, details: `${count} faturas geradas para o próximo mês.` });
    return { generatedCount: count };
};

export const generatePaymentLink = async (invoiceId: string): Promise<{ link: string }> => {
    await sleep(500);
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) throw new Error("Fatura não encontrada");
    return { link: `https://pagamento.elitte.com/pay/${invoiceId}?value=${invoice.valor}` };
};

// Dashboard
export const getDashboardData = async () => {
    await sleep(800);
    const receitaMes = payments.filter(p => new Date(p.data).getMonth() === new Date().getMonth()).reduce((sum, p) => sum + p.valor, 0);
    const despesasMes = expenses.filter(e => new Date(e.data).getMonth() === new Date().getMonth()).reduce((sum, e) => sum + e.valor, 0);
    const novosAlunosMes = enrollments.filter(e => new Date(e.inicio).getMonth() === new Date().getMonth()).length;
    
    const atRiskMembersData = invoices
        .filter(i => i.status === 'ATRASADA')
        .slice(0, 5)
        .map(i => ({ id: i.member.id, nome: i.member.nome, reason: 'Fatura Atrasada', details: `Competência ${i.competencia}` }));

    const recentActivity = payments.slice(0,3).map(p => {
        const inv = invoices.find(i => i.id === p.invoiceId);
        return { id: p.id, type: 'payment', valor: p.valor, memberName: inv?.member.nome, data: p.data }
    });
    
    return {
        kpis: {
            receitaMes,
            receitaChange: 10.5,
            despesasMes,
            despesasChange: -5.2,
            lucroLiquido: receitaMes - despesasMes,
            lucroChange: 15.1,
            novosAlunosMes,
            novosAlunosChange: 8.0,
            faturasVencendo: invoices.filter(i => i.status === 'ABERTA' && new Date(i.vencimento) > new Date()).length,
        },
        monthlyGoal: { current: receitaMes, target: 25000 },
        cashFlowData: Array.from({ length: 6 }).map((_, i) => {
             const d = new Date();
             d.setMonth(d.getMonth() - (5-i));
            return {
                name: d.toLocaleString('default', { month: 'short' }),
                receita: faker.number.int({ min: 10000, max: 20000 }),
                despesa: faker.number.int({ min: 5000, max: 10000 }),
            }
        }),
        recentActivity,
        atRiskMembers: atRiskMembersData,
    };
};

// Expenses
export const getExpenses = async (): Promise<Expense[]> => {
    await sleep(300);
    return [...expenses].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
};
export const addExpense = async (expenseData: Omit<Expense, 'id'>): Promise<Expense> => {
    await sleep(500);
    const newExpense = { id: uuidv4(), ...expenseData };
    expenses.push(newExpense);
    addLogEntry({ action: LogActionType.CREATE, details: `Nova despesa "${newExpense.descricao}" registrada.` });
    return newExpense;
};
export const updateExpense = async (updatedExpense: Expense): Promise<Expense> => {
    await sleep(500);
    const index = expenses.findIndex(e => e.id === updatedExpense.id);
    if (index > -1) {
        expenses[index] = updatedExpense;
        addLogEntry({ action: LogActionType.UPDATE, details: `Despesa "${updatedExpense.descricao}" atualizada.` });
        return expenses[index];
    }
    throw new Error("Expense not found");
};

// Plans
export const getPlans = async (): Promise<Plan[]> => {
    await sleep(200);
    return [...plans].sort((a,b) => a.precoBase - b.precoBase);
};
export const addPlan = async (planData: Omit<Plan, 'id' | 'ativo'>): Promise<Plan> => {
    await sleep(500);
    const newPlan: Plan = { id: uuidv4(), ...planData, ativo: true };
    plans.push(newPlan);
    addLogEntry({ action: LogActionType.CREATE, details: `Novo plano "${newPlan.nome}" criado.` });
    return newPlan;
};
export const updatePlan = async (updatedPlan: Plan): Promise<Plan> => {
    await sleep(500);
    const index = plans.findIndex(p => p.id === updatedPlan.id);
    if (index > -1) {
        plans[index] = updatedPlan;
        addLogEntry({ action: LogActionType.UPDATE, details: `Plano "${updatedPlan.nome}" atualizado.` });
        return plans[index];
    }
    throw new Error("Plan not found");
};
export const togglePlanStatus = async (planId: string): Promise<Plan> => {
    await sleep(300);
    const index = plans.findIndex(p => p.id === planId);
    if (index > -1) {
        plans[index].ativo = !plans[index].ativo;
        addLogEntry({ action: LogActionType.UPDATE, details: `Status do plano "${plans[index].nome}" alterado.` });
        return plans[index];
    }
    throw new Error("Plan not found");
};

// Reports
export const getReportsData = async (periodInDays: number = 180) => {
    await sleep(1000);
    // This is a simplified version of the backend logic
    return {
        kpis: { totalRevenue: 125000, newMembersCount: 45, averageRevenuePerMember: 250, churnRate: 5.2 },
        monthlyChartData: Array.from({ length: 6 }).map((_, i) => ({
             name: `Mês ${i+1}`,
             Receita: faker.number.int({ min: 15000, max: 30000 }),
             Despesa: faker.number.int({ min: 8000, max: 15000 }),
             "Novos Alunos": faker.number.int({ min: 5, max: 15 }),
        })),
        revenueByPlan: plans.filter(p => p.ativo).map(p => ({ name: p.nome, value: faker.number.int({ min: 10000, max: 50000 }) })),
    };
};
export const getMonthlyPaymentsReportData = async (periodInDays: number) => {
    await sleep(800);
    return {
        kpis: { totalPaymentsCount: 150, averagePaymentValue: 110, mostUsedPaymentMethod: 'PIX' },
        monthlyPaymentChartData: Array.from({ length: 3 }).map((_, i) => ({
             name: `Mês ${i+1}`,
             Pagamentos: faker.number.int({ min: 10000, max: 20000 }),
        })),
    };
};
export const getReportSummary = async (reportData: any): Promise<string> => {
    await sleep(1500);
    return "Análise da IA: O desempenho financeiro é forte, com crescimento constante na receita. A aquisição de novos alunos está saudável. Recomenda-se focar na retenção para diminuir a taxa de churn simulada de 5.2%.";
};

// Settings
export const getSettings = async (): Promise<any> => {
    await sleep(100);
    return settings;
};
export const saveSettings = async (newSettings: any): Promise<void> => {
    await sleep(600);
    settings = { ...settings, ...newSettings };
    addLogEntry({ action: LogActionType.UPDATE, details: `Configurações gerais atualizadas.` });
};

// Notifications
export const getNotificationHistory = async (): Promise<Notification[]> => {
    await sleep(300);
    // Lazy-generate some notifications if empty
    if (notifications.length === 0) {
        invoices.slice(0, 10).forEach(inv => {
            notifications.push({
                id: uuidv4(),
                member: inv.member,
                invoice: inv,
                type: inv.status === 'ATRASADA' ? NotificationType.ALERTA_ATRASO : NotificationType.LEMBRETE_VENCIMENTO,
                channel: NotificationChannel.EMAIL,
                status: NotificationStatus.ENVIADA,
                sentAt: faker.date.recent({days: 30}),
            });
        });
    }
    return notifications.sort((a,b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
};
export const generateNotifications = async (settings: any): Promise<{ generatedCount: number }> => {
    await sleep(1000);
    const count = faker.number.int({min: 0, max: 3});
    addLogEntry({ action: LogActionType.GENERATE, details: `${count} notificações geradas.`, userName: 'Sistema', userRole: Role.SYSTEM });
    return { generatedCount: count };
};

// Assistant
export const getAiAssistantResponse = async (question: string): Promise<string> => {
    await sleep(1200);
    const q = question.toLowerCase();
     if (q.includes('alunos ativos')) {
        const count = members.filter(m => m.ativo).length;
        return `Atualmente, a academia tem ${count} alunos ativos.`;
    } else if (q.includes('faturas atrasadas')) {
        const count = invoices.filter(i => i.status === InvoiceStatus.ATRASADA).length;
        return `Existem ${count} faturas atrasadas no sistema.`;
    } else if (q.includes('encontre o aluno') || q.includes('procurar por')) {
        const nameMatch = q.split(/aluno |por /).pop()?.trim();
        if (nameMatch) {
            const found = members.filter(m => m.nome.toLowerCase().includes(nameMatch));
            if (found.length > 0) return `Encontrei ${found.length} aluno(s): ${found.map(m => m.nome).join(', ')}.`;
            return `Não encontrei nenhum aluno com o nome parecido com "${nameMatch}".`;
        }
    }
    return "Desculpe, não entendi. Tente perguntar sobre 'alunos ativos' ou 'faturas atrasadas'.";
};

// Logs
export const getLogs = async (): Promise<AuditLog[]> => {
    await sleep(400);
    return logs;
};

// Users
export const getUsers = async (): Promise<User[]> => {
    await sleep(300);
    return users.map(({password, ...user}) => user);
};
export const addUser = async (userData: Omit<User, 'id' | 'ativo'> & { password?: string }): Promise<User> => {
    await sleep(500);
    const newUser = { id: uuidv4(), ...userData, ativo: true, password: FAKE_HASH };
    users.push(newUser);
    addLogEntry({ action: LogActionType.CREATE, details: `Novo usuário "${newUser.nome}" criado.` });
    const { password, ...userToReturn } = newUser;
    return userToReturn;
};
export const updateUser = async (userId: string, userData: Omit<User, 'id' | 'ativo'>): Promise<User> => {
    await sleep(500);
    const index = users.findIndex(u => u.id === userId);
    if (index > -1) {
        users[index] = { ...users[index], ...userData };
        addLogEntry({ action: LogActionType.UPDATE, details: `Usuário "${users[index].nome}" atualizado.` });
        const { password, ...userToReturn } = users[index];
        return userToReturn;
    }
    throw new Error("User not found");
};
export const toggleUserStatus = async (userId: string): Promise<User> => {
    await sleep(300);
    const index = users.findIndex(u => u.id === userId);
    if (index > -1) {
        users[index].ativo = !users[index].ativo;
        addLogEntry({ action: LogActionType.UPDATE, details: `Status do usuário "${users[index].nome}" alterado.` });
        const { password, ...userToReturn } = users[index];
        return userToReturn;
    }
    throw new Error("User not found");
};
export const deleteUser = async (userId: string): Promise<{ success: boolean }> => {
    await sleep(800);
    const userName = users.find(u => u.id === userId)?.nome || 'Desconhecido';
    users = users.filter(u => u.id !== userId);
    addLogEntry({ action: LogActionType.DELETE, details: `Usuário "${userName}" excluído.` });
    return { success: true };
};

// Portal
export const getStudentProfileData = async (studentId: string) => {
    await sleep(500);
    const member = members.find(m => m.id === studentId);
    if(!member) throw new Error("Aluno não encontrado");
    const memberEnrollment = enrollments.find(e => e.member.id === studentId);
    const memberInvoices = invoices.filter(i => i.member.id === studentId);
    return {
        member,
        enrollment: memberEnrollment || null,
        invoices: memberInvoices,
        plan: memberEnrollment?.plan || null,
    };
};
export const updateStudentProfile = async (studentId: string, profileData: { email?: string; telefone?: string }): Promise<Member> => {
    await sleep(600);
    const index = members.findIndex(m => m.id === studentId);
    if (index > -1) {
        members[index] = { ...members[index], ...profileData };
        addLogEntry({ action: LogActionType.UPDATE, details: `Aluno ${members[index].nome} atualizou seu perfil.`, userName: members[index].nome, userRole: Role.ALUNO });
        return members[index];
    }
    throw new Error("Member not found");
};
export const getNotificationsForStudent = async (studentId: string): Promise<Notification[]> => {
    await sleep(300);
    return notifications.filter(n => n.member.id === studentId);
};
export const generatePixPayment = async (invoiceId: string): Promise<{ qrCode: string; pixKey: string }> => {
    await sleep(1000);
    if (!settings.pixKey) throw new Error("Chave PIX não configurada.");
    return { qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${settings.pixKey}`, pixKey: settings.pixKey };
};
export const confirmPixPayment = async (invoiceId: string): Promise<Invoice> => {
    await sleep(2000);
    const invoiceIndex = invoices.findIndex(i => i.id === invoiceId);
    if (invoiceIndex > -1) {
        const invoice = invoices[invoiceIndex];
        const remaining = invoice.valor - (invoice.payments?.reduce((s, p) => s + p.valor, 0) || 0);
        if (remaining > 0) {
            const payment = { id: uuidv4(), invoiceId, valor: remaining, data: new Date(), metodo: PaymentMethod.PIX };
            payments.push(payment);
            invoice.payments = [...(invoice.payments || []), payment];
        }
        invoice.status = InvoiceStatus.PAGA;
        addLogEntry({ action: LogActionType.PAYMENT, details: `Pagamento PIX confirmado para ${invoice.member.nome}.`, userName: invoice.member.nome, userRole: Role.ALUNO });
        return invoice;
    }
    throw new Error("Invoice not found");
};
