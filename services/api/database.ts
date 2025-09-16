import { Invoice, Member, Plan, Expense, Enrollment, InvoiceStatus, PlanPeriodicity, EnrollmentStatus, PaymentMethod, Payment, Notification, User, Role, AuditLog, LogActionType, NotificationChannel, NotificationStatus, NotificationType } from '../../types';
import { faker } from '@faker-js/faker/locale/pt_BR';

const DB_KEY = 'ACADEMIA_DB';

interface AppDatabase {
    allMembers: Member[];
    plans: Plan[];
    enrollments: Enrollment[];
    invoices: Invoice[];
    expenses: Expense[];
    notifications: Notification[];
    logs: AuditLog[];
    // Fix: Added payments to the database interface to ensure it's saved and loaded correctly.
    payments: Payment[];
}

// In-memory state variables, will be populated by loadDatabase
export let allMembers: Member[] = [];
export let plans: Plan[] = [];
export let enrollments: Enrollment[] = [];
export let invoices: Invoice[] = [];
export let expenses: Expense[] = [];
export let notifications: Notification[] = [];
export let logs: AuditLog[] = [];
// Fix: Export a global payments array to resolve import errors in other modules.
export let payments: Payment[] = [];


// Fix: Export restoreDates to allow its use in other modules for data import.
// Helper function to restore dates after JSON parsing
export const restoreDates = (data: AppDatabase): AppDatabase => {
    if (data.allMembers) data.allMembers.forEach((m: Member) => { m.dataNascimento = new Date(m.dataNascimento); });
    if (data.enrollments) data.enrollments.forEach((e: Enrollment) => { e.inicio = new Date(e.inicio); e.fim = new Date(e.fim); });
    if (data.invoices) data.invoices.forEach((i: Invoice) => { 
        i.vencimento = new Date(i.vencimento);
        i.payments?.forEach(p => { p.data = new Date(p.data); });
    });
    if (data.expenses) data.expenses.forEach((e: Expense) => { e.data = new Date(e.data); });
    if (data.notifications) data.notifications.forEach((n: Notification) => { n.sentAt = new Date(n.sentAt); });
    if (data.logs) data.logs.forEach((l: AuditLog) => { l.timestamp = new Date(l.timestamp); });
    // Fix: Ensure dates within the global payments array are correctly restored from strings.
    if (data.payments) data.payments.forEach((p: Payment) => { p.data = new Date(p.data); });
    return data;
};

// Function to save the entire database state to localStorage
export const saveDatabase = () => {
    // Fix: Include the payments array when saving the database to localStorage.
    const db: AppDatabase = { allMembers, plans, enrollments, invoices, expenses, notifications, logs, payments };
    localStorage.setItem(DB_KEY, JSON.stringify(db));
};

const generateMockData = () => {
    // Plans
    if (plans.length === 0) {
        const planNames = ['Mensal Simples', 'Trimestral Fit', 'Anual Gold'];
        const periodicities = [PlanPeriodicity.MENSAL, PlanPeriodicity.TRIMESTRAL, PlanPeriodicity.ANUAL];
        const prices = [99.90, 279.90, 999.90];
        for (let i = 0; i < 3; i++) {
            plans.push({
                id: faker.string.uuid(),
                nome: `Plano ${planNames[i]}`,
                periodicidade: periodicities[i],
                precoBase: prices[i],
                ativo: true,
            });
        }
    }
    
    // Members, Enrollments, Invoices
    if (allMembers.length === 0) {
        for (let i = 0; i < 50; i++) {
            const member: Member = {
                id: faker.string.uuid(),
                nome: faker.person.fullName(),
                cpf: faker.string.numeric(11),
                dataNascimento: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
                email: faker.internet.email().toLowerCase(),
                telefone: faker.phone.number(),
                ativo: faker.datatype.boolean(0.9), // 90% active
                observacoes: faker.datatype.boolean(0.2) ? faker.lorem.sentence() : undefined,
            };
            allMembers.push(member);

            if (member.ativo) {
                const plan = faker.helpers.arrayElement(plans);
                const inicio = faker.date.past({ years: 2 });
                const fim = new Date(); // Next due date
                fim.setDate(faker.number.int({ min: 1, max: 28 }));
                if (fim < new Date()) fim.setMonth(fim.getMonth() + 1);


                const enrollment: Enrollment = {
                    id: faker.string.uuid(),
                    member, plan, inicio, fim,
                    status: EnrollmentStatus.ATIVA,
                    diaVencimento: fim.getDate(),
                };
                enrollments.push(enrollment);

                // Invoices for this member
                for (let j = 0; j < 12; j++) { // 12 months of invoices
                    const competenciaDate = new Date();
                    competenciaDate.setMonth(competenciaDate.getMonth() - j);
                    const vencimento = new Date(competenciaDate.getFullYear(), competenciaDate.getMonth(), enrollment.diaVencimento);
                    
                    let status = InvoiceStatus.PAGA;
                    if (j === 0) status = faker.helpers.arrayElement([InvoiceStatus.ABERTA, InvoiceStatus.ATRASADA, InvoiceStatus.PAGA]);
                    if (j === 1) status = faker.helpers.arrayElement([InvoiceStatus.PAGA, InvoiceStatus.ATRASADA]);
                    if (vencimento > new Date() && status !== InvoiceStatus.PAGA) status = InvoiceStatus.ABERTA;


                    const invoice: Invoice = {
                        id: faker.string.uuid(),
                        member,
                        competencia: `${competenciaDate.getFullYear()}-${String(competenciaDate.getMonth() + 1).padStart(2, '0')}`,
                        vencimento,
                        valor: plan.precoBase,
                        status,
                        payments: [],
                    };
                    
                    if (status === InvoiceStatus.PAGA) {
                        const payment: Payment = {
                            id: faker.string.uuid(),
                            invoiceId: invoice.id,
                            valor: invoice.valor,
                            data: new Date(vencimento.getTime() - faker.number.int({min: 1, max: 5}) * 24 * 60 * 60 * 1000),
                            metodo: faker.helpers.arrayElement(Object.values(PaymentMethod)),
                        };
                        invoice.payments?.push(payment);
                        // Fix: Populate the global payments array during mock data generation.
                        payments.push(payment);
                    }
                    invoices.push(invoice);
                }
            }
        }
    }
    
    // Expenses
    if (expenses.length === 0) {
        for (let i = 0; i < 100; i++) {
            expenses.push({
                id: faker.string.uuid(),
                categoria: faker.helpers.arrayElement(['Aluguel', 'Energia', 'Água', 'Equipamentos', 'Marketing', 'Salários', 'Limpeza', 'Outros']),
                descricao: faker.commerce.productName(),
                valor: faker.number.float({ min: 50, max: 5000, fractionDigits: 2 }),
                data: faker.date.past({ years: 1 }),
                fornecedor: faker.company.name(),
            });
        }
    }
    saveDatabase();
};


// Function to load the database state from localStorage
const loadDatabase = () => {
    const savedDb = localStorage.getItem(DB_KEY);
    if (savedDb) {
        try {
            const parsedDb: AppDatabase = JSON.parse(savedDb);
            const restoredDb = restoreDates(parsedDb);
            allMembers = restoredDb.allMembers || [];
            plans = restoredDb.plans || [];
            enrollments = restoredDb.enrollments || [];
            invoices = restoredDb.invoices || [];
            expenses = restoredDb.expenses || [];
            notifications = restoredDb.notifications || [];
            logs = restoredDb.logs || [];
            // Fix: Load the payments array from the restored database.
            payments = restoredDb.payments || [];
            
            // If DB is loaded but empty, generate data
            if(allMembers.length === 0) {
                generateMockData();
            }

        } catch (e) {
            console.error("Failed to load database from localStorage, generating fresh data.", e);
            generateMockData();
        }
    } else {
        generateMockData();
    }
};

// --- DATABASE INITIALIZATION ---
loadDatabase();


export const mockUsers: User[] = [
    { id: 'user1', nome: 'Admin Elitte', email: 'admin@academia.com', role: Role.ADMIN, ativo: true },
    { id: 'user2', nome: 'Financeiro', email: 'financeiro@academia.com', role: Role.FINANCEIRO, ativo: true },
    { id: 'user3', nome: 'Recepção', email: 'recepcao@academia.com', role: Role.RECEPCAO, ativo: true },
];

export const restoreDatabase = (data: any) => {
    allMembers = data.allMembers || [];
    plans = data.plans || [];
    enrollments = data.enrollments || [];
    invoices = data.invoices || [];
    expenses = data.expenses || [];
    notifications = data.notifications || [];
    logs = data.logs || [];
    // Fix: Restore the payments array when importing database data.
    payments = data.payments || [];
};

// Fix: Function to mutate database arrays for member deletion, avoiding illegal reassignment in other modules.
export const removeMemberData = (memberId: string) => {
    allMembers = allMembers.filter(m => m.id !== memberId);
    enrollments = enrollments.filter(e => e.member.id !== memberId);
    invoices = invoices.filter(i => i.member.id !== memberId);
    notifications = notifications.filter(n => n.member.id !== memberId);
};

// --- LOGGING ---
const getActor = () => {
    try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            return JSON.parse(storedUser);
        }
    } catch (e) { /* ignore */ }
    return { nome: 'Sistema', role: 'system' };
}

export const addLog = (action: LogActionType, details: string) => {
    const actor = getActor();
    const logEntry: AuditLog = {
        id: faker.string.uuid(),
        timestamp: new Date(),
        userName: actor.nome,
        userRole: actor.role,
        action,
        details,
    };
    logs.unshift(logEntry); // Add to the beginning for chronological order
    if(logs.length > 200) logs.pop(); // Keep logs from getting too big
    saveDatabase();
};

// --- API SIMULATION ---

export const simulateDelay = <T,>(data: T): Promise<T> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(JSON.parse(JSON.stringify(data)));
        }, 300 + Math.random() * 400);
    });
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};