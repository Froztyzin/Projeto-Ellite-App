import { invoices, expenses, allMembers } from './database';
import { InvoiceStatus } from '../../types';
import { simulateDelay } from './database';

export const getDashboardData = () => {
    const receitaMes = invoices.reduce((totalReceita, inv) => {
        const receitaDaFatura = inv.payments
            ? inv.payments
                .filter(p => new Date(p.data).getMonth() === new Date().getMonth() && new Date(p.data).getFullYear() === new Date().getFullYear())
                .reduce((sum, p) => sum + p.valor, 0)
            : 0;
        return totalReceita + receitaDaFatura;
    }, 0);

    const despesasMes = expenses
        .filter(exp => new Date(exp.data).getMonth() === new Date().getMonth())
        .reduce((sum, exp) => sum + exp.valor, 0);
        
    const inadimplencia = invoices
        .filter(inv => inv.status === InvoiceStatus.ATRASADA)
        .reduce((sum, inv) => sum + inv.valor, 0);

    const activeMembers = allMembers.filter(m => m.ativo).length;

    const cashFlowData = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const month = d.toLocaleString('pt-BR', { month: 'short' });
        
        const revenue = invoices.reduce((totalReceita, inv) => {
            const receitaDaFatura = inv.payments
                ? inv.payments
                    .filter(p => new Date(p.data).getMonth() === d.getMonth() && new Date(p.data).getFullYear() === d.getFullYear())
                    .reduce((sum, p) => sum + p.valor, 0)
                : 0;
            return totalReceita + receitaDaFatura;
        }, 0);

        const expense = expenses
            .filter(exp => new Date(exp.data).getMonth() === d.getMonth() && new Date(exp.data).getFullYear() === d.getFullYear())
            .reduce((sum, exp) => sum + exp.valor, 0);

        return { name: month, Receita: revenue, Despesa: expense };
    }).reverse();

    return simulateDelay({
        kpis: { receitaMes, despesasMes, inadimplencia, activeMembers },
        cashFlowData,
    });
};
