import { faker } from '@faker-js/faker/locale/pt_BR';
import { v4 as uuidv4 } from 'uuid';
import {
  Member, Plan, Enrollment, Invoice, Payment, Expense, Notification, AuditLog, User,
  Role, PlanPeriodicity, EnrollmentStatus, InvoiceStatus, PaymentMethod, NotificationType, NotificationChannel, NotificationStatus, LogActionType, AssistantMessage
} from '../types';

// --- DATABASE SIMULATION ---

const db: {
  members: Member[],
  plans: Plan[],
  enrollments: Enrollment[],
  invoices: Invoice[],
  payments: Payment[],
  expenses: Expense[],
  notifications: Notification[],
  logs: AuditLog[],
  users: User[],
  settings: any,
} = {
  members: [],
  plans: [],
  enrollments: [],
  invoices: [],
  payments: [],
  expenses: [],
  notifications: [],
  logs: [],
  users: [],
  settings: {
    remindersEnabled: true,
    daysBeforeDue: 3,
    overdueEnabled: true,
    gymName: "Elitte Corpus Academia",
    pixKey: "a1b2c3d4-e5f6-a1b2-c3d4-e5f6a1b2c3d4",
  },
};

const generateData = () => {
  // Reset arrays
  db.members = []; db.plans = []; db.enrollments = []; db.invoices = []; db.payments = [];
  db.expenses = []; db.notifications = []; db.logs = []; db.users = [];

  // --- Generate Users ---
  // Using plain text passwords for mock simplicity
  const userPassword = 'password123';
  db.users.push({ id: 'admin-user-id', nome: 'Admin Master', email: 'admin@elitte.com', role: Role.ADMIN, ativo: true, password: userPassword });
  db.users.push({ id: uuidv4(), nome: 'Financeiro User', email: 'financeiro@elitte.com', role: Role.FINANCEIRO, ativo: true, password: userPassword });
  db.users.push({ id: uuidv4(), nome: 'Recepção User', email: 'recepcao@elitte.com', role: Role.RECEPCAO, ativo: true, password: userPassword });
  db.users.push({ id: uuidv4(), nome: 'Instrutor User', email: 'instrutor@elitte.com', role: Role.INSTRUTOR, ativo: true, password: userPassword });

  // --- Generate Plans ---
  const planMensal = { id: uuidv4(), nome: 'Plano Mensal', periodicidade: PlanPeriodicity.MENSAL, precoBase: 99.90, ativo: true };
  const planTrimestral = { id: uuidv4(), nome: 'Plano Trimestral', periodicidade: PlanPeriodicity.TRIMESTRAL, precoBase: 270.00, ativo: true };
  const planAnual = { id: uuidv4(), nome: 'Plano Anual', periodicidade: PlanPeriodicity.ANUAL, precoBase: 1000.00, ativo: true };
  db.plans.push(planMensal, planTrimestral, planAnual);
  db.plans.push({ id: uuidv4(), nome: 'Plano Crossfit (Inativo)', periodicidade: PlanPeriodicity.MENSAL, precoBase: 150.00, ativo: false });
  const activePlans = [planMensal, planTrimestral, planAnual];

  // --- Generate Members and related data ---
  const memberPassword = '123456';
  for (let i = 0; i < 50; i++) {
    const nome = faker.person.fullName();
    const member: Member = {
      id: uuidv4(), nome,
      cpf: faker.string.numeric(11),
      dataNascimento: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
      email: i === 0 ? 'aluno@elitte.com' : faker.internet.email({ firstName: nome.split(' ')[0] }).toLowerCase(),
      telefone: faker.phone.number(),
      password: memberPassword,
      ativo: faker.datatype.boolean(0.9),
      observacoes: i % 10 === 0 ? faker.lorem.sentence() : '',
    };
    db.members.push(member);

    if (!member.ativo) continue;

    const plan = faker.helpers.arrayElement(activePlans);
    const startDate = faker.date.past({ years: 2 });
    db.enrollments.push({
      id: uuidv4(), member: member, plan: plan,
      inicio: startDate,
      fim: faker.date.future({ years: 1, refDate: startDate }),
      status: member.ativo ? EnrollmentStatus.ATIVA : EnrollmentStatus.CANCELADA,
      diaVencimento: faker.number.int({ min: 1, max: 28 }),
    });

    for (let j = 0; j < 12; j++) {
        const invoiceDate = new Date();
        invoiceDate.setMonth(invoiceDate.getMonth() - j);
        const isPaid = faker.datatype.boolean(0.8);
        const isOverdue = !isPaid && invoiceDate < new Date();
        let status: InvoiceStatus = isPaid ? InvoiceStatus.PAGA : isOverdue ? InvoiceStatus.ATRASADA : InvoiceStatus.ABERTA;
        
        // Make some partially paid
        if (isPaid && faker.datatype.boolean(0.2)) {
            status = InvoiceStatus.PARCIALMENTE_PAGA;
        }

        const invoice: Invoice = {
            id: uuidv4(), member: member,
            competencia: `${invoiceDate.getFullYear()}-${(invoiceDate.getMonth() + 1).toString().padStart(2, '0')}`,
            vencimento: invoiceDate, valor: plan.precoBase, status,
            payments: [],
        };
        db.invoices.push(invoice);

        if (status === InvoiceStatus.PAGA) {
            const payment = {
                id: uuidv4(), invoiceId: invoice.id, valor: invoice.valor,
                data: faker.date.soon({ days: 5, refDate: invoice.vencimento }),
                metodo: faker.helpers.arrayElement(Object.values(PaymentMethod)),
            };
            db.payments.push(payment);
            invoice.payments?.push(payment);
        } else if (status === InvoiceStatus.PARCIALMENTE_PAGA) {
             const partialValue = parseFloat((invoice.valor * faker.number.float({ min: 0.3, max: 0.7 })).toFixed(2));
             const payment = {
                id: uuidv4(), invoiceId: invoice.id, valor: partialValue,
                data: faker.date.soon({ days: 5, refDate: invoice.vencimento }),
                metodo: faker.helpers.arrayElement(Object.values(PaymentMethod)),
            };
            db.payments.push(payment);
            invoice.payments?.push(payment);
        }
    }
  }

  // --- Generate Expenses ---
  for (let i = 0; i < 100; i++) {
    db.expenses.push({
      id: uuidv4(),
      categoria: faker.helpers.arrayElement(['Aluguel', 'Energia', 'Água', 'Equipamentos', 'Marketing', 'Salários', 'Limpeza', 'Outros']),
      descricao: faker.commerce.productName(),
      valor: parseFloat(faker.commerce.price({ min: 50, max: 2000 })),
      data: faker.date.past({ years: 1 }),
      fornecedor: faker.company.name(),
    });
  }
  
  db.logs.push({
    id: uuidv4(), timestamp: new Date(), userName: 'Sistema', userRole: Role.SYSTEM,
    action: LogActionType.GENERATE, details: 'Banco de dados de simulação inicializado.'
  });
};

generateData();

// --- MOCK API FUNCTIONS ---
const simulateDelay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Auth
export const login = async (email: string, password: string): Promise<User> => {
    await simulateDelay();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user && user.password === password) {
        if (!user.ativo) throw new Error("Este usuário está inativo.");
        localStorage.setItem('session', JSON.stringify(user));
        return user;
    }
    throw new Error("Email ou senha inválidos.");
};

export const loginStudent = async (cpf: string): Promise<User> => {
    await simulateDelay();
    const cleanCpf = cpf.replace(/\D/g, '');
    const member = db.members.find(m => m.cpf === cleanCpf);
    if (member) {
        if (!member.ativo) throw new Error("Sua matrícula não está ativa. Entre em contato com a recepção.");
        const studentUser: User = { ...member, role: Role.ALUNO };
        localStorage.setItem('session', JSON.stringify(studentUser));
        return studentUser;
    }
    throw new Error("CPF não encontrado.");
};

export const logout = async (): Promise<void> => {
    await simulateDelay(100);
    localStorage.removeItem('session');
};

export const checkSession = async (): Promise<User> => {
    await simulateDelay(100);
    const session = localStorage.getItem('session');
    if (session) {
        return JSON.parse(session);
    }
    throw new Error("No active session");
};

export const forgotPassword = async (email: string): Promise<{ message: string }> => {
    await simulateDelay();
    console.log(`Password reset requested for ${email}`);
    return { message: 'Se um usuário com este email existir, um link de redefinição foi enviado.' };
};

export const resetPassword = async (token: string, password: string): Promise<{ message: string }> => {
    await simulateDelay();
    if (token && password) {
        console.log("Password reset successfully (mock).");
        return { message: 'Senha redefinida com sucesso.' };
    }
    throw new Error('Token inválido ou expirado.');
};


// Members
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';
export const getMembers = async (query?: string, status: StatusFilter = 'ACTIVE'): Promise<Member[]> => {
    await simulateDelay();
    let filtered = db.members;
    if (status === 'ACTIVE') filtered = filtered.filter(m => m.ativo);
    if (status === 'INACTIVE') filtered = filtered.filter(m => !m.ativo);
    if (query) filtered = filtered.filter(m => m.nome.toLowerCase().includes(query.toLowerCase()));
    return [...filtered].sort((a,b) => a.nome.localeCompare(b.nome));
};

export const addMember = async (memberData: Omit<Member, 'id' | 'ativo'>, planId: string | null): Promise<Member> => {
    await simulateDelay();
    const newMember: Member = { ...memberData, id: uuidv4(), ativo: true };
    db.members.unshift(newMember);
    if (planId) {
        const plan = db.plans.find(p => p.id === planId);
        if (plan) {
            db.enrollments.push({
                id: uuidv4(), member: newMember, plan,
                inicio: new Date(), fim: new Date(new Date().setMonth(new Date().getMonth() + 1)),
                status: EnrollmentStatus.ATIVA, diaVencimento: new Date().getDate()
            });
        }
    }
    return newMember;
};

export const updateMember = async (memberData: Member, planId?: string | null): Promise<Member> => {
    await simulateDelay();
    const index = db.members.findIndex(m => m.id === memberData.id);
    if (index !== -1) db.members[index] = { ...db.members[index], ...memberData };
    
    let enrollment = db.enrollments.find(e => e.member.id === memberData.id);
    if (planId) {
        const plan = db.plans.find(p => p.id === planId)!;
        if (enrollment) {
            enrollment.plan = plan;
            enrollment.status = EnrollmentStatus.ATIVA;
        } else {
             db.enrollments.push({
                id: uuidv4(), member: memberData, plan: plan,
                inicio: new Date(), fim: new Date(new Date().setMonth(new Date().getMonth() + 1)),
                status: EnrollmentStatus.ATIVA, diaVencimento: new Date().getDate()
            });
        }
    } else if(enrollment) {
        enrollment.status = EnrollmentStatus.CANCELADA;
    }
    return memberData;
};

export const toggleMemberStatus = async (memberId: string): Promise<Member> => {
    await simulateDelay();
    const member = db.members.find(m => m.id === memberId)!;
    member.ativo = !member.ativo;
    return member;
};

export const deleteMember = async (memberId: string): Promise<{ success: boolean }> => {
    await simulateDelay();
    db.members = db.members.filter(m => m.id !== memberId);
    db.invoices = db.invoices.filter(i => i.member.id !== memberId);
    db.enrollments = db.enrollments.filter(e => e.member.id !== memberId);
    return { success: true };
};

export const getMemberById = async (id: string): Promise<Member | undefined> => {
    await simulateDelay();
    return db.members.find(m => m.id === id);
};

export const getEnrollmentByMemberId = async (memberId: string): Promise<Enrollment | undefined> => {
    await simulateDelay();
    return db.enrollments.find(e => e.member.id === memberId);
};

export const getInvoicesByMemberId = async (memberId: string): Promise<Invoice[]> => {
    await simulateDelay();
    return db.invoices.filter(i => i.member.id === memberId).sort((a,b) => b.vencimento.getTime() - a.vencimento.getTime());
};

// Global Search
export const globalSearch = async (query: string): Promise<{ members: Member[], invoices: Invoice[] }> => {
    await simulateDelay(300);
    if (query.length < 2) return { members: [], invoices: [] };
    const lowerQuery = query.toLowerCase();
    const members = db.members.filter(m => m.nome.toLowerCase().includes(lowerQuery)).slice(0, 5);
    const invoices = db.invoices.filter(i => i.member.nome.toLowerCase().includes(lowerQuery)).slice(0, 5);
    return { members, invoices };
};

// Student Portal
export const getStudentProfileData = async (studentId: string): Promise<{ member: Member, enrollment: Enrollment | null, invoices: Invoice[], plan: Plan | null }> => {
    await simulateDelay();
    const member = db.members.find(m => m.id === studentId)!;
    const enrollment = db.enrollments.find(e => e.member.id === studentId) || null;
    const invoices = db.invoices.filter(i => i.member.id === studentId);
    return { member, enrollment, invoices, plan: enrollment?.plan || null };
};

export const updateStudentProfile = async (studentId: string, profileData: { email?: string, telefone?: string }): Promise<Member> => {
    await simulateDelay();
    const member = db.members.find(m => m.id === studentId)!;
    if (profileData.email) member.email = profileData.email;
    if (profileData.telefone) member.telefone = profileData.telefone;
    return member;
};

// Plans
export const getPlans = async (): Promise<Plan[]> => {
    await simulateDelay();
    return [...db.plans].sort((a, b) => a.precoBase - b.precoBase);
};

export const addPlan = async (planData: Omit<Plan, 'id' | 'ativo'>): Promise<Plan> => {
    await simulateDelay();
    const newPlan = { ...planData, id: uuidv4(), ativo: true };
    db.plans.push(newPlan);
    return newPlan;
};

export const updatePlan = async (updatedPlan: Plan): Promise<Plan> => {
    await simulateDelay();
    const index = db.plans.findIndex(p => p.id === updatedPlan.id);
    if (index !== -1) db.plans[index] = updatedPlan;
    return updatedPlan;
};

export const togglePlanStatus = async (planId: string): Promise<Plan> => {
    await simulateDelay();
    const plan = db.plans.find(p => p.id === planId)!;
    plan.ativo = !plan.ativo;
    return plan;
};

// Invoices
export const getInvoices = async (): Promise<Invoice[]> => {
    await simulateDelay();
    return [...db.invoices].sort((a,b) => b.vencimento.getTime() - a.vencimento.getTime());
};

export const generateMonthlyInvoices = async (): Promise<{ generatedCount: number }> => {
    await simulateDelay(1000);
    // Mock logic: just add a few new invoices for active members
    const activeEnrollments = db.enrollments.filter(e => e.status === EnrollmentStatus.ATIVA);
    let generatedCount = 0;
    for(let i = 0; i < 3; i++) {
        const enrollment = faker.helpers.arrayElement(activeEnrollments);
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const newInvoice: Invoice = {
            id: uuidv4(), member: enrollment.member,
            competencia: `${nextMonth.getFullYear()}-${(nextMonth.getMonth() + 1).toString().padStart(2, '0')}`,
            vencimento: nextMonth, valor: enrollment.plan.precoBase, status: InvoiceStatus.ABERTA,
        };
        db.invoices.unshift(newInvoice);
        generatedCount++;
    }
    return { generatedCount };
};

export const registerPayment = async (paymentData: { invoiceId: string; valor: number; data: Date; metodo: PaymentMethod; notas?: string; }): Promise<Invoice> => {
    await simulateDelay();
    const invoice = db.invoices.find(i => i.id === paymentData.invoiceId)!;
    const newPayment: Payment = { id: uuidv4(), ...paymentData };
    db.payments.push(newPayment);
    if (!invoice.payments) invoice.payments = [];
    invoice.payments.push(newPayment);

    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.valor, 0);
    if (totalPaid >= invoice.valor) {
        invoice.status = InvoiceStatus.PAGA;
    } else {
        invoice.status = InvoiceStatus.PARCIALMENTE_PAGA;
    }
    return invoice;
};

export const generatePaymentLink = async (invoiceId: string): Promise<{ link: string }> => {
    await simulateDelay();
    const invoice = db.invoices.find(i => i.id === invoiceId)!;
    return { link: `https://pagamento.mock/${invoice.id}?valor=${invoice.valor}` };
};

export const generatePixPayment = async (invoiceId: string): Promise<{ qrCode: string; pixKey: string }> => {
    await simulateDelay();
    return {
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${db.settings.pixKey}`,
        pixKey: db.settings.pixKey,
    };
};

export const confirmPixPayment = async (invoiceId: string): Promise<Invoice> => {
    await simulateDelay(2000);
    const invoice = db.invoices.find(i => i.id === invoiceId)!;
    const totalPaid = invoice.payments?.reduce((s, p) => s + p.valor, 0) || 0;
    const remaining = invoice.valor - totalPaid;
    if(remaining > 0) {
        registerPayment({
            invoiceId, valor: remaining, data: new Date(), metodo: PaymentMethod.PIX, notas: 'Pagamento PIX via Portal'
        });
    }
    invoice.status = InvoiceStatus.PAGA;
    return invoice;
};


// Expenses
export const getExpenses = async (): Promise<Expense[]> => {
    await simulateDelay();
    return [...db.expenses].sort((a,b) => b.data.getTime() - a.data.getTime());
};

export const addExpense = async (expenseData: Omit<Expense, 'id'>): Promise<Expense> => {
    await simulateDelay();
    const newExpense = { ...expenseData, id: uuidv4() };
    db.expenses.unshift(newExpense);
    return newExpense;
};

export const updateExpense = async (updatedExpense: Expense): Promise<Expense> => {
    await simulateDelay();
    const index = db.expenses.findIndex(e => e.id === updatedExpense.id);
    if (index !== -1) db.expenses[index] = updatedExpense;
    return updatedExpense;
};


// Users
export const getUsers = async (): Promise<User[]> => {
    await simulateDelay();
    return [...db.users].sort((a,b) => a.nome.localeCompare(b.nome));
};

export const addUser = async (userData: Omit<User, 'id' | 'ativo'>): Promise<User> => {
    await simulateDelay();
    const newUser = { ...userData, id: uuidv4(), ativo: true };
    db.users.push(newUser);
    return newUser;
};

export const updateUser = async (userId: string, userData: Partial<User>): Promise<User> => {
    await simulateDelay();
    const user = db.users.find(u => u.id === userId)!;
    Object.assign(user, userData);
    return user;
};

export const toggleUserStatus = async (userId: string): Promise<User> => {
    await simulateDelay();
    const user = db.users.find(u => u.id === userId)!;
    user.ativo = !user.ativo;
    return user;
};

export const deleteUser = async (userId: string): Promise<{ success: boolean }> => {
    await simulateDelay();
    db.users = db.users.filter(u => u.id !== userId);
    return { success: true };
};


// Settings
export const getSettings = async (): Promise<any> => {
    await simulateDelay();
    return db.settings;
};

export const saveSettings = async (settings: any): Promise<void> => {
    await simulateDelay();
    db.settings = { ...db.settings, ...settings };
};


// Dashboard, Reports, etc.
export const getDashboardData = async () => {
    await simulateDelay();
    const receitaMes = db.payments.filter(p => new Date(p.data).getMonth() === new Date().getMonth()).reduce((sum, p) => sum + p.valor, 0);
    const despesasMes = db.expenses.filter(e => new Date(e.data).getMonth() === new Date().getMonth()).reduce((sum, e) => sum + e.valor, 0);
    return {
        kpis: {
            receitaMes: receitaMes,
            despesasMes: despesasMes,
            lucroLiquido: receitaMes - despesasMes,
            novosAlunosMes: db.members.filter(m => new Date(m.dataNascimento).getMonth() === new Date().getMonth()).length, // Not accurate, but mock
            faturasVencendo: db.invoices.filter(i => i.status === InvoiceStatus.ABERTA && new Date(i.vencimento) > new Date() && new Date(i.vencimento) < new Date(new Date().setDate(new Date().getDate() + 7))).length,
            receitaChange: 15.2,
            despesasChange: -5.1,
            lucroChange: 25.0,
            novosAlunosChange: 10,
        },
        monthlyGoal: { current: receitaMes, target: 25000 },
        cashFlowData: Array.from({ length: 6 }).map((_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            return {
                name: date.toLocaleString('pt-BR', { month: 'short' }),
                receita: faker.number.int({ min: 15000, max: 25000 }),
                despesa: faker.number.int({ min: 5000, max: 10000 }),
                month: date.getMonth() + 1,
                year: date.getFullYear(),
            }
        }).reverse(),
        recentActivity: db.payments.slice(0, 3).map(p => ({
            id: p.id, type: 'payment', valor: p.valor, data: p.data,
            memberName: db.invoices.find(i => i.id === p.invoiceId)!.member.nome
        })),
        atRiskMembers: db.members.filter(m => m.ativo && Math.random() < 0.1).slice(0, 3).map(m => ({
            ...m, reason: 'Faturas em atraso', details: '2 faturas'
        }))
    };
};

export const getReportsData = async (periodInDays: number = 180) => {
    await simulateDelay();
    return {
        kpis: {
            totalRevenue: 125000,
            newMembersCount: 45,
            averageRevenuePerMember: 110.50,
            churnRate: 5.2
        },
        monthlyChartData: Array.from({ length: 6 }).map((_, i) => ({
            name: new Date(2024, i, 1).toLocaleString('pt-BR', { month: 'short' }),
            'Receita': faker.number.int({ min: 15000, max: 25000 }),
            'Despesa': faker.number.int({ min: 5000, max: 10000 }),
            'Novos Alunos': faker.number.int({ min: 5, max: 15 }),
        })),
        revenueByPlan: db.plans.filter(p => p.ativo).map(p => ({
            name: p.nome, value: faker.number.int({ min: 10000, max: 50000 })
        }))
    }
};

export const getMonthlyPaymentsReportData = async (periodInDays: number) => {
    await simulateDelay();
    return {
         kpis: {
            totalPaymentsCount: 150,
            averagePaymentValue: 105.75,
            mostUsedPaymentMethod: 'PIX',
        },
        monthlyPaymentChartData: Array.from({ length: Math.ceil(periodInDays/30) }).map((_, i) => ({
            name: new Date(2024, 3 - i, 1).toLocaleString('pt-BR', { month: 'short' }),
            Pagamentos: faker.number.int({ min: 10000, max: 20000 }),
        })).reverse()
    }
}

export const getReportSummary = async (reportData: any): Promise<string> => {
    await simulateDelay();
    return `Análise Mock: A receita total foi de R$ ${reportData.kpis.totalRevenue.toFixed(2)}. Foram adicionados ${reportData.kpis.newMembersCount} novos alunos. A taxa de churn simulada foi de ${reportData.kpis.churnRate}%.`;
};

// Logs
export const getLogs = async (): Promise<AuditLog[]> => {
    await simulateDelay();
    return [...db.logs].sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
};

// Notifications
export const getNotificationHistory = async (): Promise<Notification[]> => {
    await simulateDelay();
    if (db.notifications.length === 0) {
        // Generate some mock notifications
        db.invoices.filter(i => i.status === InvoiceStatus.ATRASADA).slice(0, 5).forEach(inv => {
            db.notifications.push({
                id: uuidv4(), member: inv.member, invoice: inv, type: NotificationType.ALERTA_ATRASO,
                channel: NotificationChannel.EMAIL, status: NotificationStatus.ENVIADA, sentAt: faker.date.recent({ days: 3 })
            });
        });
         db.invoices.filter(i => i.status === InvoiceStatus.ABERTA).slice(0, 5).forEach(inv => {
            db.notifications.push({
                id: uuidv4(), member: inv.member, invoice: inv, type: NotificationType.LEMBRETE_VENCIMENTO,
                channel: NotificationChannel.WHATSAPP, status: NotificationStatus.ENVIADA, sentAt: faker.date.recent({ days: 2 })
            });
        });
    }
    return [...db.notifications].sort((a,b) => b.sentAt.getTime() - a.sentAt.getTime());
};

export const generateNotifications = async (settings: any): Promise<{ generatedCount: number }> => {
    await simulateDelay();
    return { generatedCount: faker.number.int({min: 0, max: 5}) };
};

export const getNotificationsForStudent = async (studentId: string): Promise<Notification[]> => {
    await simulateDelay();
    const allNotifications = await getNotificationHistory(); // Ensure notifications are generated
    return allNotifications.filter(n => n.member.id === studentId);
};


// Assistant
export const getAiAssistantResponse = async (question: string): Promise<string> => {
    await simulateDelay(1500);
    const q = question.toLowerCase();
    if (q.includes('alunos ativos')) {
        const count = db.members.filter(m => m.ativo).length;
        return `Atualmente, temos ${count} alunos ativos em nosso sistema.`;
    }
    if (q.includes('faturas atrasadas')) {
        const count = db.invoices.filter(i => i.status === InvoiceStatus.ATRASADA).length;
        return `Existem ${count} faturas com pagamento atrasado. É bom verificar isso!`;
    }
    if (q.includes('receita do mês')) {
        const receita = db.payments
            .filter(p => new Date(p.data).getMonth() === new Date().getMonth())
            .reduce((sum, p) => sum + p.valor, 0);
        return `A receita deste mês, até o momento, é de R$ ${receita.toFixed(2)}.`;
    }
    return "Desculpe, sou um assistente simulado e não entendi sua pergunta. Tente perguntar sobre 'alunos ativos' ou 'faturas atrasadas'.";
};
