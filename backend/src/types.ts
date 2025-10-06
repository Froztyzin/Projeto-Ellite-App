export enum Role {
  ADMIN = 'admin',
  FINANCEIRO = 'financeiro',
  INSTRUTOR = 'instrutor',
  RECEPCAO = 'recepcao',
  ALUNO = 'aluno',
  SYSTEM = 'system',
}

export enum PlanPeriodicity {
  MENSAL = 'MENSAL',
  TRIMESTRAL = 'TRIMESTRAL',
  ANUAL = 'ANUAL',
}

export enum EnrollmentStatus {
  ATIVA = 'ATIVA',
  PAUSADA = 'PAUSADA',
  CANCELADA = 'CANCELADA',
}

export enum InvoiceStatus {
  ABERTA = 'ABERTA',
  PAGA = 'PAGA',
  ATRASADA = 'ATRASADA',
  PARCIALMENTE_PAGA = 'PARCIALMENTE_PAGA',
  CANCELADA = 'CANCELADA',
}

export enum PaymentMethod {
  PIX = 'PIX',
  DINHEIRO = 'DINHEIRO',
}

export enum NotificationType {
  LEMBRETE_VENCIMENTO = 'LEMBRETE_VENCIMENTO',
  ALERTA_ATRASO = 'ALERTA_ATRASO',
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
}

export enum NotificationStatus {
  ENVIADA = 'ENVIADA',
  FALHOU = 'FALHOU',
}


export interface User {
  id: string;
  nome: string;
  email: string;
  role: Role;
  ativo: boolean;
  password?: string;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
}

export interface Profile {
  id: string;
  nome: string;
  role: Role;
  ativo: boolean;
}

export interface Member {
  id: string;
  nome: string;
  cpf: string;
  dataNascimento: Date;
  email: string;
  telefone: string;
  ativo: boolean;
  observacoes?: string;
  // Fix: Add user-related fields to allow members to be treated as users for login.
  password?: string;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
}

export interface Plan {
  id: string;
  nome: string;
  periodicidade: PlanPeriodicity;
  precoBase: number;
  ativo: boolean;
}

export interface Enrollment {
  id: string;
  memberId: string;
  planId: string;
  inicio: Date;
  fim: Date;
  status: EnrollmentStatus;
  diaVencimento: number;
}

export interface Invoice {
  id: string;
  memberId: string;
  competencia: string; // YYYY-MM
  vencimento: Date;
  valor: number;
  status: InvoiceStatus;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  invoiceId: string;
  valor: number;
  data: Date;
  metodo: PaymentMethod;
  notas?: string;
}

export interface Expense {
  id: string;
  categoria: string;
  descricao: string;
  valor: number;
  data: Date;
  fornecedor: string;
}

export interface Notification {
  id: string;
  memberId: string;
  invoiceId: string;
  type: NotificationType;
  channel: NotificationChannel;
  status: NotificationStatus;
  sentAt: Date;
}

export interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}

export enum LogActionType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  GENERATE = 'GENERATE',
  LOGIN = 'LOGIN',
  PAYMENT = 'PAYMENT',
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  userName: string;
  userRole: Role;
  action: LogActionType;
  details: string;
}