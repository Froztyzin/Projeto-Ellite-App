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
    // Reset all data arrays to ensure a clean state
    allMembers = [];
    enrollments = [];
    invoices = [];
    expenses = [];
    notifications = [];
    payments = [];
    logs = [];
    plans = []; // Also reset plans to be re-added below

    // Plans - We create a fresh set of base plans for the new, empty database
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

    saveDatabase(); // Save the new, empty-except-for-plans database
};


// Function to load the database state from localStorage
const loadDatabase = () => {
    // This line will clear any existing data from localStorage on app load.
    // After running the app once to clear the data, you can remove this line
    // to allow new data to be saved persistently.
    localStorage.removeItem(DB_KEY);

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