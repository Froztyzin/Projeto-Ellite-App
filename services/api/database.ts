import { Invoice, Member, Plan, Expense, Enrollment, InvoiceStatus, PlanPeriodicity, EnrollmentStatus, PaymentMethod, Payment, Notification, User, Role, AuditLog, LogActionType, NotificationChannel, NotificationStatus, NotificationType } from '../../types';
import { faker } from '@faker-js/faker/locale/pt_BR';

const DB_KEY = 'ACADEMIA_DB_V3';

interface AppDatabase {
    members: Member[];
    plans: Plan[];
    enrollments: Enrollment[];
    invoices: Invoice[];
    expenses: Expense[];
    notifications: Notification[];
    logs: AuditLog[];
    payments: Payment[];
    users: User[];
    settings: any;
}

// In-memory state variables
let db: AppDatabase | null = null;

// Helper to restore dates after JSON parsing
const restoreDates = (data: AppDatabase): AppDatabase => {
    if (data.members) data.members.forEach(m => { m.dataNascimento = new Date(m.dataNascimento); });
    if (data.enrollments) data.enrollments.forEach(e => { e.inicio = new Date(e.inicio); e.fim = new Date(e.fim); });
    if (data.invoices) data.invoices.forEach(i => { i.vencimento = new Date(i.vencimento); });
    if (data.payments) data.payments.forEach(p => { p.data = new Date(p.data); });
    if (data.expenses) data.expenses.forEach(e => { e.data = new Date(e.data); });
    if (data.notifications) data.notifications.forEach(n => { n.sentAt = new Date(n.sentAt); });
    if (data.logs) data.logs.forEach(l => { l.timestamp = new Date(l.timestamp); });
    return data;
};


// Save the entire database state to localStorage
export const saveDatabase = () => {
    if (!db) return;
    try {
        localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (e) {
        console.error("Error saving to localStorage", e);
    }
};

const generateMockData = (): AppDatabase => {
    console.log("Generating new mock data set for DB_V3...");

    const localDb: AppDatabase = {
        members: [], plans: [], enrollments: [], invoices: [], expenses: [],
        notifications: [], logs: [], payments: [], users: [], settings: {
            remindersEnabled: true, daysBeforeDue: 3, overdueEnabled: true, useEmail: true,
            useWhatsapp: true, gymName: "Elitte Corpus Academia", gymCnpj: "00.000.000/0001-00",
            lateFee: "2", interestRate: "0.1", pixKey: faker.finance.bitcoinAddress(),
        }
    };
    
    // Create Users
    localDb.users.push({ id: faker.string.uuid(), nome: 'Admin Elitte', email: 'admin@academia.com', role: Role.ADMIN, ativo: true });
    localDb.users.push({ id: faker.string.uuid(), nome: 'Financeiro Staff', email: 'financeiro@academia.com', role: Role.FINANCEIRO, ativo: true });
    localDb.users.push({ id: faker.string.uuid(), nome: 'Recepção Staff', email: 'recepcao@academia.com', role: Role.RECEPCAO, ativo: true });

    // Create Plans
    const planData = [
        { nome: 'Plano Mensal', periodicidade: PlanPeriodicity.MENSAL, precoBase: 119.90 },
        { nome: 'Plano Trimestral', periodicidade: PlanPeriodicity.TRIMESTRAL, precoBase: 329.90 },
        { nome: 'Plano Anual', periodicidade: PlanPeriodicity.ANUAL, precoBase: 1199.90 },
    ];
    planData.forEach(data => {
        localDb.plans.push({ id: faker.string.uuid(), ...data, ativo: true });
    });
    
    // Create Members and Enrollments
    for (let i = 0; i < 50; i++) {
        const member: Member = {
            id: faker.string.uuid(),
            nome: faker.person.fullName(),
            cpf: faker.finance.accountNumber(11),
            dataNascimento: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
            email: faker.internet.email(),
            telefone: faker.phone.number(),
            ativo: faker.datatype.boolean(0.9), // 90% active
            observacoes: faker.datatype.boolean(0.2) ? faker.lorem.sentence() : '',
        };
        localDb.members.push(member);

        // Create an enrollment for the member
        const plan = faker.helpers.arrayElement(localDb.plans);
        const startDate = faker.date.past({ years: 2 });
        let endDate = new Date(startDate);
        if (plan.periodicidade === 'MENSAL') endDate.setMonth(endDate.getMonth() + 1);
        else if (plan.periodicidade === 'TRIMESTRAL') endDate.setMonth(endDate.getMonth() + 3);
        else endDate.setFullYear(endDate.getFullYear() + 1);

        const enrollment: Enrollment = {
            id: faker.string.uuid(), member, plan,
            inicio: startDate, fim: endDate,
            status: member.ativo ? EnrollmentStatus.ATIVA : EnrollmentStatus.CANCELADA,
            diaVencimento: startDate.getDate(),
        };
        localDb.enrollments.push(enrollment);
    }
    
    // Create Invoices and Payments based on enrollments
    localDb.enrollments.filter(e => e.status === EnrollmentStatus.ATIVA).forEach(enrollment => {
        for (let i = -6; i <= 1; i++) { // Generate invoices for last 6 months up to next month
            const now = new Date();
            const dueDate = new Date(now.getFullYear(), now.getMonth() + i, enrollment.diaVencimento);
            
            let status = InvoiceStatus.ABERTA;
            if (dueDate < now) status = InvoiceStatus.ATRASADA;

            const invoice: Invoice = {
                id: faker.string.uuid(),
                member: enrollment.member,
                competencia: `${dueDate.getFullYear()}-${(dueDate.getMonth() + 1).toString().padStart(2, '0')}`,
                vencimento: dueDate,
                valor: enrollment.plan.precoBase,
                status: status,
                payments: []
            };
            
            // Simulate payments for past invoices
            if (i < 0) {
                 if (faker.datatype.boolean(0.85)) { // 85% chance of being paid
                    const payment: Payment = {
                        id: faker.string.uuid(),
                        invoiceId: invoice.id,
                        valor: invoice.valor,
                        data: new Date(dueDate.getTime() - faker.number.int({ min: 1, max: 5 }) * 24 * 3600 * 1000),
                        metodo: faker.helpers.arrayElement(Object.values(PaymentMethod)),
                    };
                    localDb.payments.push(payment);
                    invoice.payments!.push(payment);
                    invoice.status = InvoiceStatus.PAGA;
                }
            }

            localDb.invoices.push(invoice);
        }
    });

    // Create Expenses
    for (let i = 0; i < 30; i++) {
        localDb.expenses.push({
            id: faker.string.uuid(),
            categoria: faker.helpers.arrayElement(['Aluguel', 'Energia', 'Água', 'Equipamentos', 'Marketing', 'Salários', 'Limpeza', 'Outros']),
            descricao: faker.commerce.productName(),
            // Fix: Replaced deprecated `precision` with `fractionDigits` for faker.js v8+.
            valor: faker.number.float({ min: 50, max: 2000, fractionDigits: 2 }),
            data: faker.date.recent({ days: 180 }),
            fornecedor: faker.company.name(),
        });
    }

    localDb.logs.push({
        id: faker.string.uuid(), timestamp: new Date(), userName: 'System', userRole: Role.SYSTEM,
        action: LogActionType.GENERATE, details: 'Base de dados inicial gerada com dados de exemplo.'
    });

    return localDb;
};


// Initialize the database from localStorage or generate new data
export const initDatabase = () => {
    if (db) return; // Already initialized

    try {
        const storedDb = localStorage.getItem(DB_KEY);
        if (storedDb) {
            console.log("Loading database from localStorage...");
            db = restoreDates(JSON.parse(storedDb));
        } else {
            console.log("No database found in localStorage, generating mock data...");
            db = generateMockData();
            saveDatabase();
        }
    } catch (e) {
        console.error("Failed to initialize database, generating mock data as a fallback.", e);
        db = generateMockData();
        saveDatabase();
    }
};

export const getDB = (): AppDatabase => {
    if (!db) {
        initDatabase();
    }
    return db!;
};

export const addLog = (action: LogActionType, details: string) => {
    const userJson = localStorage.getItem('user');
    const currentUser = userJson ? JSON.parse(userJson) : { nome: 'Sistema', role: Role.SYSTEM };
    
    getDB().logs.unshift({
        id: faker.string.uuid(),
        timestamp: new Date(),
        userName: currentUser.nome,
        userRole: currentUser.role,
        action,
        details
    });
    // Keep logs to a reasonable size
    if (getDB().logs.length > 500) {
        getDB().logs.pop();
    }
    saveDatabase();
};

// Helper to simulate network delay
export const simulateDelay = <T>(data: T, delay = 300): Promise<T> => {
    return new Promise(resolve => setTimeout(() => resolve(data), delay));
};

// Ensure DB is initialized on load
initDatabase();