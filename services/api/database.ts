import { Invoice, Member, Plan, Expense, Enrollment, InvoiceStatus, PlanPeriodicity, EnrollmentStatus, PaymentMethod, Payment, Notification, User, Role } from '../../types';
import { faker } from '@faker-js/faker/locale/pt_BR';


const generateMembers = (count: number): Member[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: faker.string.uuid(),
    nome: faker.person.fullName(),
    cpf: faker.string.numeric(11),
    dataNascimento: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
    email: faker.internet.email().toLowerCase(),
    telefone: faker.phone.number(),
    ativo: faker.datatype.boolean(0.95), // 95% chance of being active
    observacoes: faker.datatype.boolean(0.3) ? faker.lorem.paragraph() : '',
  }));
};

export let plans: Plan[] = [
  { id: 'plan1', nome: 'Plano Mensal Fit', periodicidade: PlanPeriodicity.MENSAL, precoBase: 99.90, ativo: true },
  { id: 'plan2', nome: 'Plano Trimestral Pro', periodicidade: PlanPeriodicity.TRIMESTRAL, precoBase: 279.90, ativo: true },
  { id: 'plan3', nome: 'Plano Anual Gold', periodicidade: PlanPeriodicity.ANUAL, precoBase: 999.90, ativo: true },
  { id: 'plan4', nome: 'Plano Crossfit', periodicidade: PlanPeriodicity.MENSAL, precoBase: 149.90, ativo: false },
];

const generateEnrollments = (members: Member[]): Enrollment[] => {
    return members.map(member => {
        const plan = faker.helpers.arrayElement(plans.filter(p => p.ativo));
        const inicio = faker.date.past({ years: 2 });
        let fim: Date;
        if (plan.periodicidade === PlanPeriodicity.ANUAL) {
            fim = new Date(inicio.getFullYear() + 1, inicio.getMonth(), inicio.getDate());
        } else if (plan.periodicidade === PlanPeriodicity.TRIMESTRAL) {
            fim = new Date(inicio.getFullYear(), inicio.getMonth() + 3, inicio.getDate());
        } else {
            fim = new Date(inicio.getFullYear(), inicio.getMonth() + 1, inicio.getDate());
        }

        return {
            id: faker.string.uuid(),
            member,
            plan,
            inicio,
            fim,
            status: member.ativo ? EnrollmentStatus.ATIVA : EnrollmentStatus.CANCELADA,
            diaVencimento: faker.number.int({ min: 1, max: 28 }),
        };
    });
};


const generateInvoices = (enrollments: Enrollment[]): Invoice[] => {
    const invoices: Invoice[] = [];
    enrollments.forEach(enrollment => {
        if (!enrollment.member.ativo) return;
        
        for (let i = 0; i < 24; i++) { // Generate last 24 months of invoices for better reporting
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const statusOptions = [InvoiceStatus.PAGA, InvoiceStatus.PAGA, InvoiceStatus.PAGA, InvoiceStatus.ATRASADA, InvoiceStatus.ABERTA];
            let status = faker.helpers.arrayElement(statusOptions);
            const vencimento = new Date(date.getFullYear(), date.getMonth(), enrollment.diaVencimento);

            if (status === InvoiceStatus.ATRASADA && vencimento > new Date()) {
                status = InvoiceStatus.ABERTA;
            }
            if (status !== InvoiceStatus.ATRASADA && vencimento < new Date() && status !== InvoiceStatus.PAGA) {
                 status = InvoiceStatus.ATRASADA;
            }
            if(i === 0 && status === InvoiceStatus.PAGA) status = InvoiceStatus.ABERTA;


            const invoice: Invoice = {
                id: faker.string.uuid(),
                member: enrollment.member,
                competencia: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
                vencimento: vencimento,
                valor: enrollment.plan.precoBase,
                status,
                payments: [],
            };
            
            if (status === InvoiceStatus.PAGA) {
                invoice.payments = [{
                    id: faker.string.uuid(),
                    invoiceId: invoice.id,
                    valor: invoice.valor,
                    data: new Date(vencimento.getTime() - faker.number.int({ min: 1, max: 5 }) * 24 * 60 * 60 * 1000),
                    metodo: faker.helpers.arrayElement([PaymentMethod.PIX, PaymentMethod.DINHEIRO]),
                }];
            }
            invoices.push(invoice);
        }
    });
    return invoices;
};

const generateExpenses = (count: number): Expense[] => {
    const categories = ['Aluguel', 'Energia', 'Água', 'Equipamentos', 'Marketing', 'Salários', 'Limpeza'];
    const suppliers = ['Fornecedor A', 'Fornecedor B', 'Governo', 'Loja de Equipamentos'];
    return Array.from({ length: count * 4 }, () => ({
        id: faker.string.uuid(),
        categoria: faker.helpers.arrayElement(categories),
        descricao: faker.lorem.sentence(),
        valor: faker.number.float({ min: 50, max: 2000, fractionDigits: 2 }),
        data: faker.date.past({ years: 2 }),
        fornecedor: faker.helpers.arrayElement(suppliers),
    }));
};

// --- MOCK DATABASE ---

export let allMembers = generateMembers(50);
export let enrollments = generateEnrollments(allMembers);
export let invoices = generateInvoices(enrollments);
export let expenses = generateExpenses(50);
export let notifications: Notification[] = [];

// Create a predictable student user for login testing
const studentMember = allMembers[0];
studentMember.email = 'aluno@test.com';
studentMember.cpf = '12345678900';

export const mockUsers: User[] = [
    { id: 'user1', nome: 'Admin Elitte', email: 'admin@academia.com', role: Role.ADMIN, ativo: true },
    { id: 'user2', nome: 'Financeiro', email: 'financeiro@academia.com', role: Role.FINANCEIRO, ativo: true },
    { id: 'user3', nome: 'Recepção', email: 'recepcao@academia.com', role: Role.RECEPCAO, ativo: true },
    // This is a "User" representation of a "Member" for login purposes
    { id: studentMember.id, nome: studentMember.nome, email: studentMember.email, role: Role.ALUNO, ativo: studentMember.ativo }
];

export const restoreDatabase = (data: any) => {
    allMembers = data.allMembers;
    plans = data.plans;
    enrollments = data.enrollments;
    invoices = data.invoices;
    expenses = data.expenses;
    notifications = data.notifications;
};

// Helper function to restore dates after JSON parsing
export const restoreDates = (data: any) => {
    if (data.allMembers) data.allMembers.forEach((m: Member) => { m.dataNascimento = new Date(m.dataNascimento); });
    if (data.enrollments) data.enrollments.forEach((e: Enrollment) => { e.inicio = new Date(e.inicio); e.fim = new Date(e.fim); });
    if (data.invoices) data.invoices.forEach((i: Invoice) => { 
        i.vencimento = new Date(i.vencimento);
        i.payments?.forEach(p => { p.data = new Date(p.data); });
    });
    if (data.expenses) data.expenses.forEach((e: Expense) => { e.data = new Date(e.data); });
    if (data.notifications) data.notifications.forEach((n: Notification) => { n.sentAt = new Date(n.sentAt); });
    return data;
};


// --- API SIMULATION ---

export const simulateDelay = <T,>(data: T): Promise<T> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(JSON.parse(JSON.stringify(data)));
        }, 500 + Math.random() * 500);
    });
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};