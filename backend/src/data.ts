import { faker } from '@faker-js/faker/locale/pt_BR';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import {
  Member, Plan, Enrollment, Invoice, Payment, Expense, Notification, AuditLog, User, WorkoutPlan,
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
let workoutPlans: WorkoutPlan[] = [];
let settings: any = {
    remindersEnabled: true,
    daysBeforeDue: 3,
    overdueEnabled: true,
    gymName: "Elitte Corpus Academia",
    pixKey: "a1b2c3d4-e5f6-a1b2-c3d4-e5f6a1b2c3d4",
};

const generateData = () => {
  // Reset arrays
  members = []; plans = []; enrollments = []; invoices = []; payments = [];
  expenses = []; notifications = []; logs = []; users = []; workoutPlans = [];

  // --- Generate Users ---
  const userPassword = bcrypt.hashSync('password123', 10);
  users.push({ id: uuidv4(), nome: 'Admin Master', email: 'admin@elitte.com', role: Role.ADMIN, ativo: true, password: userPassword });
  users.push({ id: uuidv4(), nome: 'Financeiro User', email: 'financeiro@elitte.com', role: Role.FINANCEIRO, ativo: true, password: userPassword });
  users.push({ id: uuidv4(), nome: 'Recepção User', email: 'recepcao@elitte.com', role: Role.RECEPCAO, ativo: true, password: userPassword });
  users.push({ id: uuidv4(), nome: 'Instrutor User', email: 'instrutor@elitte.com', role: Role.INSTRUTOR, ativo: true, password: userPassword });

  // --- Generate Plans ---
  const planMensal = { id: uuidv4(), nome: 'Plano Mensal', periodicidade: PlanPeriodicity.MENSAL, precoBase: 99.90, ativo: true };
  const planTrimestral = { id: uuidv4(), nome: 'Plano Trimestral', periodicidade: PlanPeriodicity.TRIMESTRAL, precoBase: 270.00, ativo: true };
  const planAnual = { id: uuidv4(), nome: 'Plano Anual', periodicidade: PlanPeriodicity.ANUAL, precoBase: 1000.00, ativo: true };
  plans.push(planMensal, planTrimestral, planAnual);
  plans.push({ id: uuidv4(), nome: 'Plano Crossfit (Inativo)', periodicidade: PlanPeriodicity.MENSAL, precoBase: 150.00, ativo: false });
  const activePlans = [planMensal, planTrimestral, planAnual];

  // --- Generate Members and related data ---
  const memberPassword = bcrypt.hashSync('123456', 10);
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
    members.push(member);

    const plan = faker.helpers.arrayElement(activePlans);
    const startDate = faker.date.past({ years: 2 });
    enrollments.push({
      id: uuidv4(), memberId: member.id, planId: plan.id,
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

        const invoice: Invoice = {
            id: uuidv4(), memberId: member.id,
            competencia: `${invoiceDate.getFullYear()}-${(invoiceDate.getMonth() + 1).toString().padStart(2, '0')}`,
            vencimento: invoiceDate, valor: plan.precoBase, status,
        };
        invoices.push(invoice);

        if (status === InvoiceStatus.PAGA) {
            payments.push({
                id: uuidv4(), invoiceId: invoice.id, valor: invoice.valor,
                data: faker.date.soon({ days: 5, refDate: invoice.vencimento }),
                metodo: faker.helpers.arrayElement(Object.values(PaymentMethod)),
            });
        }
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

generateData();

export const db = {
  members, plans, enrollments, invoices, payments, expenses, notifications, logs, users, settings, workoutPlans
};
