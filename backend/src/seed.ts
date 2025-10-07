import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker/locale/pt_BR';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
// Fix: Explicitly import the `process` module to resolve TypeScript type errors for `process.exit`.
import process from 'process';
import {
  Role, PlanPeriodicity, EnrollmentStatus, InvoiceStatus, PaymentMethod, LogActionType
} from './types';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and Service Role Key are required for seeding.');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Start seeding with Supabase client...');

  // --- Clean up existing data ---
  // Order matters due to foreign key constraints
  console.log('Cleaning up old data...');
  await supabaseAdmin.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabaseAdmin.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabaseAdmin.from('invoices').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabaseAdmin.from('enrollments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabaseAdmin.from('members').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabaseAdmin.from('plans').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabaseAdmin.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabaseAdmin.from('audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabaseAdmin.from('gym_settings').delete().neq('id', 0);

  // Clean users from Supabase Auth and public.users table
  const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers();
  for (const user of authUsers) {
    await supabaseAdmin.auth.admin.deleteUser(user.id);
  }
  await supabaseAdmin.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log('Cleaned up old data.');

  // --- Create Gym Settings ---
  const { error: settingsError } = await supabaseAdmin.from('gym_settings').insert({
    gym_name: "Elitte Corpus Academia",
    pix_key: "a1b2c3d4-e5f6-a1b2-c3d4-e5f6a1b2c3d4", // example
  });
  if (settingsError) throw settingsError;
  console.log('Created gym settings.');

  // --- Create Users ---
  const hashedPassword = await bcrypt.hash('password123', 10);
  const usersToCreate = [
    { nome: 'Admin Master', email: 'admin@elitte.com', role: Role.ADMIN },
    { nome: 'Financeiro User', email: 'financeiro@elitte.com', role: Role.FINANCEIRO },
    { nome: 'Recepção User', email: 'recepcao@elitte.com', role: Role.RECEPCAO },
    { nome: 'Instrutor User', email: 'instrutor@elitte.com', role: Role.INSTRUTOR },
  ];

  for (const userData of usersToCreate) {
     const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: 'password123',
        email_confirm: true,
     });
     if (authError) throw authError;

     const { error: profileError } = await supabaseAdmin.from('users').insert({
        id: authUser.user.id,
        nome: userData.nome,
        email: userData.email,
        role: userData.role,
        ativo: true,
     });
     if (profileError) throw profileError;
  }
  console.log('Created users.');


  // --- Create Plans ---
  const { data: plans, error: plansError } = await supabaseAdmin.from('plans').insert([
    { nome: 'Plano Mensal', periodicidade: PlanPeriodicity.MENSAL, preco_base: 99.90, ativo: true },
    { nome: 'Plano Trimestral', periodicidade: PlanPeriodicity.TRIMESTRAL, preco_base: 270.00, ativo: true },
    { nome: 'Plano Anual', periodicidade: PlanPeriodicity.ANUAL, preco_base: 1000.00, ativo: true },
    { nome: 'Plano Crossfit (Inativo)', periodicidade: PlanPeriodicity.MENSAL, preco_base: 150.00, ativo: false },
  ]).select();
  if (plansError) throw plansError;
  const activePlans = plans.filter(p => p.ativo);
  console.log('Created plans.');

  // --- Create Members and related data ---
  for (let i = 0; i < 50; i++) {
    const nome = faker.person.fullName();
    const { data: member, error: memberError } = await supabaseAdmin.from('members').insert({
      nome,
      cpf: faker.string.numeric(11),
      data_nascimento: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
      email: i === 0 ? 'aluno@elitte.com' : faker.internet.email({ firstName: nome.split(' ')[0] }).toLowerCase(),
      telefone: faker.phone.number(),
      ativo: faker.datatype.boolean(0.9),
      observacoes: i % 10 === 0 ? faker.lorem.sentence() : undefined,
    }).select().single();
    if (memberError) throw memberError;

    const plan = faker.helpers.arrayElement(activePlans);
    const startDate = faker.date.past({ years: 2 });
    await supabaseAdmin.from('enrollments').insert({
      member_id: member.id,
      plan_id: plan.id,
      inicio: startDate.toISOString().split('T')[0],
      fim: faker.date.future({ years: 1, refDate: startDate }).toISOString().split('T')[0],
      status: member.ativo ? EnrollmentStatus.ATIVA : EnrollmentStatus.CANCELADA,
      dia_vencimento: faker.number.int({ min: 1, max: 28 }),
    });

    for (let j = 0; j < 12; j++) {
      const invoiceDate = new Date();
      invoiceDate.setMonth(invoiceDate.getMonth() - j);
      const isPaid = faker.datatype.boolean(0.8);
      const isOverdue = !isPaid && invoiceDate < new Date();
      let status = isPaid ? InvoiceStatus.PAGA : isOverdue ? InvoiceStatus.ATRASADA : InvoiceStatus.ABERTA;

      const { data: invoice, error: invoiceError } = await supabaseAdmin.from('invoices').insert({
        member_id: member.id,
        competencia: `${invoiceDate.getFullYear()}-${(invoiceDate.getMonth() + 1).toString().padStart(2, '0')}`,
        vencimento: invoiceDate.toISOString().split('T')[0],
        valor: plan.preco_base,
        status: status,
      }).select().single();
      if (invoiceError) throw invoiceError;

      if (status === InvoiceStatus.PAGA) {
        await supabaseAdmin.from('payments').insert({
          invoice_id: invoice.id,
          valor: invoice.valor,
          data: faker.date.soon({ days: 5, refDate: invoice.vencimento }).toISOString(),
          metodo: faker.helpers.arrayElement(Object.values(PaymentMethod)),
        });
      }
    }
  }
  console.log('Created members, enrollments, and invoices.');

  // --- Generate Expenses ---
  const expensesToCreate = [];
  for (let i = 0; i < 100; i++) {
    expensesToCreate.push({
      categoria: faker.helpers.arrayElement(['Aluguel', 'Energia', 'Água', 'Equipamentos', 'Marketing', 'Salários', 'Limpeza', 'Outros']),
      descricao: faker.commerce.productName(),
      valor: parseFloat(faker.commerce.price({ min: 50, max: 2000 })),
      data: faker.date.past({ years: 1 }).toISOString().split('T')[0],
      fornecedor: faker.company.name(),
    });
  }
  await supabaseAdmin.from('expenses').insert(expensesToCreate);
  console.log('Created expenses.');
  
  // --- Create Logs ---
  await supabaseAdmin.from('audit_logs').insert({
    user_name: 'System',
    user_role: Role.SYSTEM,
    action: LogActionType.GENERATE,
    details: 'Database seeded successfully with Supabase client.'
  });
  console.log('Created initial log entry.');
  
  console.log('Seeding finished.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});