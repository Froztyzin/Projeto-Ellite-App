import { InvoiceStatus, NotificationType } from '../types';
import React from 'react';

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Fix: Replaced JSX with React.createElement to be compatible with a .ts file.
// JSX syntax is not processed in .ts files, which caused the build errors.
export const getStatusBadge = (status: InvoiceStatus): React.ReactElement => {
  const baseClasses = 'px-3 py-1 text-xs font-medium rounded-full text-white';
  let className: string;
  let text: string;

  switch (status) {
    case InvoiceStatus.PAGA:
      className = `${baseClasses} bg-green-500`;
      text = 'Paga';
      break;
    case InvoiceStatus.ATRASADA:
      className = `${baseClasses} bg-red-500`;
      text = 'Atrasada';
      break;
    case InvoiceStatus.PARCIALMENTE_PAGA:
      className = `${baseClasses} bg-yellow-500`;
      text = 'Parcial';
      break;
    case InvoiceStatus.ABERTA:
      className = `${baseClasses} bg-blue-500`;
      text = 'Aberta';
      break;
    case InvoiceStatus.CANCELADA:
      className = `${baseClasses} bg-gray-500`;
      text = 'Cancelada';
      break;
    default:
      className = `${baseClasses} bg-gray-400`;
      text = 'Desconhecido';
      break;
  }
  return React.createElement('span', { className }, text);
};


export const getActiveStatusBadge = (status: boolean): React.ReactElement => {
  const baseClasses = 'px-3 py-1 text-xs font-medium rounded-full';
  let className: string;
  let text: string;

  if (status) {
    className = `${baseClasses} bg-green-100 text-green-800`;
    text = 'Ativo';
  } else {
    className = `${baseClasses} bg-gray-200 text-gray-800`;
    text = 'Inativo';
  }

  return React.createElement('span', { className }, text);
};


export const getNotificationTypeBadge = (type: NotificationType): React.ReactElement => {
  const baseClasses = 'px-3 py-1 text-xs font-medium rounded-full text-white';
  let className: string;
  let text: string;

  switch (type) {
    case NotificationType.LEMBRETE_VENCIMENTO:
      className = `${baseClasses} bg-blue-500`;
      text = 'Lembrete';
      break;
    case NotificationType.ALERTA_ATRASO:
      className = `${baseClasses} bg-red-500`;
      text = 'Atraso';
      break;
    default:
      className = `${baseClasses} bg-gray-400`;
      text = 'Desconhecido';
      break;
  }
  return React.createElement('span', { className }, text);
};