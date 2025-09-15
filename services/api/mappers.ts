// Mappers to convert between database snake_case and application camelCase

// From Database (snake_case) to Application (camelCase)
export const fromMember = (data: any) => data ? ({
    id: data.id,
    nome: data.nome,
    cpf: data.cpf,
    dataNascimento: new Date(data.data_nascimento),
    email: data.email,
    telefone: data.telefone,
    ativo: data.ativo,
    observacoes: data.observacoes,
}) : null;

export const fromPlan = (data: any) => data ? ({
    id: data.id,
    nome: data.nome,
    periodicidade: data.periodicidade,
    precoBase: data.preco_base,
    ativo: data.ativo,
}) : null;

export const fromEnrollment = (data: any) => data ? ({
    id: data.id,
    member: fromMember(data.members),
    plan: fromPlan(data.plans),
    inicio: new Date(data.inicio),
    fim: new Date(data.fim),
    status: data.status,
    diaVencimento: data.dia_vencimento,
}) : null;

export const fromPayment = (data: any) => data ? ({
    id: data.id,
    invoiceId: data.invoice_id,
    valor: data.valor,
    data: new Date(data.data),
    metodo: data.metodo,
    notas: data.notas,
}) : null;

export const fromInvoice = (data: any) => data ? ({
    id: data.id,
    member: fromMember(data.members),
    competencia: data.competencia,
    vencimento: new Date(data.vencimento),
    valor: data.valor,
    status: data.status,
    payments: data.payments ? data.payments.map(fromPayment) : [],
}) : null;

export const fromExpense = (data: any) => data ? ({
    id: data.id,
    categoria: data.categoria,
    descricao: data.descricao,
    valor: data.valor,
    data: new Date(data.data),
    fornecedor: data.fornecedor,
}) : null;

export const fromNotification = (data: any) => data ? ({
    id: data.id,
    member: fromMember(data.members),
    invoice: fromInvoice(data.invoices),
    type: data.type,
    channel: data.channel,
    status: data.status,
    sentAt: new Date(data.sent_at),
}) : null;

export const fromLog = (data: any) => data ? ({
    id: data.id,
    timestamp: new Date(data.timestamp),
    userName: data.user_name,
    userRole: data.user_role,
    action: data.action,
    details: data.details,
}) : null;

// To Database (snake_case) from Application (camelCase)
export const toMember = (data: any) => ({
    nome: data.nome,
    cpf: data.cpf,
    data_nascimento: data.dataNascimento,
    email: data.email,
    telefone: data.telefone,
    ativo: data.ativo,
    observacoes: data.observacoes,
});

export const toPlan = (data: any) => ({
    nome: data.nome,
    periodicidade: data.periodicidade,
    preco_base: data.precoBase,
    ativo: data.ativo,
});

export const toEnrollment = (data: any) => ({
    member_id: data.memberId,
    plan_id: data.planId,
    inicio: data.inicio,
    fim: data.fim,
    status: data.status,
    dia_vencimento: data.diaVencimento,
});

export const toPayment = (data: any) => ({
    invoice_id: data.invoiceId,
    valor: data.valor,
    data: data.data,
    metodo: data.metodo,
    notas: data.notas,
});

export const toInvoice = (data: any) => ({
    member_id: data.member.id,
    competencia: data.competencia,
    vencimento: data.vencimento,
    valor: data.valor,
    status: data.status,
});

export const toExpense = (data: any) => ({
    categoria: data.categoria,
    descricao: data.descricao,
    valor: data.valor,
    data: data.data,
    fornecedor: data.fornecedor,
});

export const toNotification = (data: any) => ({
    member_id: data.member.id,
    invoice_id: data.invoice.id,
    type: data.type,
    channel: data.channel,
    status: data.status,
    sent_at: data.sentAt,
});

export const toLog = (data: any) => ({
    user_name: data.userName,
    user_role: data.userRole,
    action: data.action,
    details: data.details,
});
