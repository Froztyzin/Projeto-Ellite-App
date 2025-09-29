import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/pt_BR';
import bcrypt from 'bcryptjs';
import {
  Role, PlanPeriodicity, EnrollmentStatus, InvoiceStatus, PaymentMethod, LogActionType
} from './types'; // Enums can be shared

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Clean up existing data
  await prisma.workoutPlan.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.member.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.user.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.gymSettings.deleteMany();
  console.log('Cleaned up old data.');

  // --- Create Gym Settings ---
  await prisma.gymSettings.create({
    data: {
      gymName: "Elitte Corpus Academia",
      pixKey: "a1b2c3d4-e5f6-a1b2-c3d4-e5f6a1b2c3d4", // example
    }
  });
  console.log('Created gym settings.');


  // --- Create Users ---
  const hashedPassword = await bcrypt.hash('password123', 10);
  const adminUser = await prisma.user.create({
    data: {
      nome: 'Admin Master',
      email: 'admin@elitte.com',
      password: hashedPassword,
      role: Role.ADMIN,
      ativo: true,
    },
  });
  await prisma.user.create({
    data: {
      nome: 'Financeiro User',
      email: 'financeiro@elitte.com',
      password: hashedPassword,
      role: Role.FINANCEIRO,
      ativo: true,
    },
  });
   await prisma.user.create({
    data: {
      nome: 'Recepção User',
      email: 'recepcao@elitte.com',
      password: hashedPassword,
      role: Role.RECEPCAO,
      ativo: true,
    },
  });
  console.log('Created users.');

  // --- Create Plans ---
  const planMensal = await prisma.plan.create({
    data: { nome: 'Plano Mensal', periodicidade: PlanPeriodicity.MENSAL, precoBase: 99.90, ativo: true },
  });
  const planTrimestral = await prisma.plan.create({
    data: { nome: 'Plano Trimestral', periodicidade: PlanPeriodicity.TRIMESTRAL, precoBase: 270.00, ativo: true },
  });
  const planAnual = await prisma.plan.create({
    data: { nome: 'Plano Anual', periodicidade: PlanPeriodicity.ANUAL, precoBase: 1000.00, ativo: true },
  });
  await prisma.plan.create({
    data: { nome: 'Plano Crossfit (Inativo)', periodicidade: PlanPeriodicity.MENSAL, precoBase: 150.00, ativo: false },
  });
  const activePlans = [planMensal, planTrimestral, planAnual];
  console.log('Created plans.');

  // --- Create Members and related data ---
  const memberPassword = await bcrypt.hash('123456', 10); // Default password for all students
  for (let i = 0; i < 50; i++) {
    const nome = faker.person.fullName();
    const member = await prisma.member.create({
      data: {
        nome,
        cpf: faker.string.numeric(11),
        dataNascimento: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
        email: i === 0 ? 'aluno@elitte.com' : faker.internet.email({ firstName: nome.split(' ')[0] }).toLowerCase(), // First member has a known email
        telefone: faker.phone.number(),
        password: memberPassword,
        ativo: faker.datatype.boolean(0.9),
        observacoes: i % 10 === 0 ? faker.lorem.sentence() : undefined,
      },
    });

    // Create enrollment
    const plan = faker.helpers.arrayElement(activePlans);
    const startDate = faker.date.past({ years: 2 });
    await prisma.enrollment.create({
      data: {
        memberId: member.id,
        planId: plan.id,
        inicio: startDate,
        fim: faker.date.future({ years: 1, refDate: startDate }),
        status: member.ativo ? EnrollmentStatus.ATIVA : EnrollmentStatus.CANCELADA,
        diaVencimento: faker.number.int({ min: 1, max: 28 }),
      },
    });

    // Generate invoices for the last 12 months
    for (let j = 0; j < 12; j++) {
      const invoiceDate = new Date();
      invoiceDate.setMonth(invoiceDate.getMonth() - j);

      const isPaid = faker.datatype.boolean(0.8);
      const isOverdue = !isPaid && invoiceDate < new Date();
      
      let status = isPaid ? InvoiceStatus.PAGA : isOverdue ? InvoiceStatus.ATRASADA : InvoiceStatus.ABERTA;

      const invoice = await prisma.invoice.create({
        data: {
          memberId: member.id,
          competencia: `${invoiceDate.getFullYear()}-${(invoiceDate.getMonth() + 1).toString().padStart(2, '0')}`,
          vencimento: invoiceDate,
          valor: plan.precoBase,
          status: status,
        }
      });
      
      if (status === InvoiceStatus.PAGA) {
          await prisma.payment.create({
              data: {
                  invoiceId: invoice.id,
                  valor: invoice.valor,
                  data: faker.date.soon({ days: 5, refDate: invoice.vencimento }),
                  metodo: faker.helpers.arrayElement(Object.values(PaymentMethod)),
              }
          });
      }
    }
  }
  console.log('Created members, enrollments, and invoices.');

   // --- Generate Expenses ---
  for (let i = 0; i < 100; i++) {
    await prisma.expense.create({
        data: {
            categoria: faker.helpers.arrayElement(['Aluguel', 'Energia', 'Água', 'Equipamentos', 'Marketing', 'Salários', 'Limpeza', 'Outros']),
            descricao: faker.commerce.productName(),
            valor: parseFloat(faker.commerce.price({ min: 50, max: 2000 })),
            data: faker.date.past({ years: 1 }),
            fornecedor: faker.company.name(),
        }
    })
  }
  console.log('Created expenses.');
  
  // --- Create Logs ---
  await prisma.auditLog.create({
      data: {
          userName: 'System',
          userRole: Role.SYSTEM,
          action: LogActionType.GENERATE,
          details: 'Database seeded successfully.'
      }
  })
  console.log('Created initial log entry.');
  
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    (process as any).exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });