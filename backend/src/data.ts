import { faker } from '@faker-js/faker/locale/pt_BR';
import { v4 as uuidv4 } from 'uuid';
import {
  Member, Plan, Enrollment, Invoice, Payment, Expense, Notification, AuditLog, User,
  Role, PlanPeriodicity, EnrollmentStatus, InvoiceStatus, PaymentMethod, NotificationType, NotificationChannel, NotificationStatus, LogActionType
} from './types';

// Data stores
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
    useEmail: true,
    useWhatsapp: false, // Default to false to avoid confusion
    gymName: "Elitte Corpus Academia",
    gymCnpj: "00.000.000/0001-00",
    lateFee: "2",
    interestRate: "0.1",
    pixKey: "a1b2c3d4-e5f6-a1b2-c3d4-e5f6a1b2c3d4",
};


const generateData = () => {
  // Reset arrays
  members = [];
  plans = [];
  enrollments = [];
  invoices = [];
  payments = [];
  expenses = [];
  notifications = [];
  logs = [];
  users = [];

  // --- Generate Users ---
  users.push({ id: uuidv4(), nome: 'Admin Master', email: 'admin@elitte.com', role: Role.ADMIN, ativo: true, password: 'password123' });
  users.push({ id: uuidv4(), nome: 'Financeiro User', email: 'financeiro@elitte.com', role: Role.FINANCEIRO, ativo: true, password: 'password123' });
  users.push({ id: uuidv4(), nome: 'Recepção User', email: 'recepcao@elitte.com', role: Role.RECEPCAO, ativo: true, password: 'password123' });

  // --- Generate Plans ---
  plans.push({ id: 'plan-mensal', nome: 'Plano Mensal', periodicidade: PlanPeriodicity.MENSAL, precoBase: 99.90, ativo: true });
  plans.push({ id: 'plan-trimestral', nome: 'Plano Trimestral', periodicidade: PlanPeriodicity.TRIMESTRAL, precoBase: 270.00, ativo: true });
  plans.push({ id: 'plan-anual', nome: 'Plano Anual', periodicidade: PlanPeriodicity.ANUAL, precoBase: 1000.00, ativo: true });
  plans.push({ id: 'plan-inativo', nome: 'Plano Crossfit (Inativo)', periodicidade: PlanPeriodicity.MENSAL, precoBase: 150.00, ativo: false });


  // --- Generate Members and related data ---
  for (let i = 0; i < 50; i++) {
    const memberId = uuidv4();
    const nome = faker.person.fullName();
    const member: Member = {
      id: memberId,
      nome,
      cpf: faker.finance.accountNumber(11),
      dataNascimento: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
      email: faker.internet.email({ firstName: nome.split(' ')[0], lastName: nome.split(' ')[1] }),
      telefone: faker.phone.number(),
      ativo: faker.datatype.boolean(0.9), // 90% chance of being active
      observacoes: i % 10 === 0 ? faker.lorem.sentence() : '',
    };
    members.push(member);

    // Create enrollment for the member
    const plan = faker.helpers.arrayElement(plans.filter(p => p.ativo));
    const enrollmentId = uuidv4();
    const startDate = faker.date.past({ years: 2 });
    const enrollment: Enrollment = {
      id: enrollmentId,
      memberId: member.id,
      planId: plan.id,
      inicio: startDate,
      fim: faker.date.future({ years: 1, refDate: startDate }),
      status: member.ativo ? EnrollmentStatus.ATIVA : EnrollmentStatus.CANCELADA,
      diaVencimento: faker.number.int({ min: 1, max: 28 }),
    };
    enrollments.push(enrollment);

    // Generate invoices for the last 12 months for this member
    for (let j = 0; j < 12; j++) {
        const invoiceDate = new Date();
        invoiceDate.setMonth(invoiceDate.getMonth() - j);
        
        const isPaid = faker.datatype.boolean(0.8); // 80% are paid
        const isOverdue = !isPaid && invoiceDate < new Date();

        let status: InvoiceStatus;
        if (isPaid) {
            status = InvoiceStatus.PAGA;
        } else if (isOverdue) {
            status = InvoiceStatus.ATRASADA;
        } else {
            status = InvoiceStatus.ABERTA;
        }

        const invoiceId = uuidv4();
        const invoice: Invoice = {
            id: invoiceId,
            memberId: member.id,
            competencia: `${invoiceDate.getFullYear()}-${(invoiceDate.getMonth() + 1).toString().padStart(2, '0')}`,
            vencimento: invoiceDate,
            valor: plan.precoBase,
            status: status,
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
            invoice.payments!.push(payment);
            payments.push(payment);
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
  
  // --- Generate Logs ---
  logs.push({
    id: uuidv4(),
    timestamp: new Date(),
    userName: 'Sistema',
    userRole: Role.SYSTEM,
    action: LogActionType.GENERATE,
    details: 'Banco de dados de simulação inicializado com dados.'
  });
};

// Initial data generation
generateData();

// Export a mutable object
export const db = {
  members,
  plans,
  enrollments,
  invoices,
  payments,
  expenses,
  notifications,
  logs,
  users,
  settings
};
