import { Router } from 'express';
import { supabase } from '../lib/supabaseClient';
import { InvoiceStatus } from '../types';
import { GoogleGenAI } from '@google/genai';

const router = Router();

// Ensure API key is available
if (!process.env.API_KEY) {
    console.warn("API_KEY for Gemini is not set. AI Assistant will not work.");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
const model = 'gemini-2.5-flash';

const generateResponse = async (prompt: string) => {
    if (!process.env.API_KEY) {
         return "A funcionalidade de assistente de IA está desativada. O administrador precisa configurar uma chave de API.";
    }
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: 'Você é um assistente prestativo para um software de gerenciamento de academia chamado Elitte Corpus. Responda de forma concisa e amigável em português do Brasil.',
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error generating AI response:", error);
        return "Desculpe, não consegui processar a informação no momento. Tente novamente mais tarde.";
    }
};

router.post('/', async (req, res) => {
    const { question } = req.body;
    if (!question) {
        return res.status(400).json({ message: 'A pergunta é obrigatória.' });
    }
    
    const q = question.toLowerCase();

    try {
        let prompt = '';
        let aiResponse = '';

        if (q.includes('alunos ativos')) {
            const { count, error } = await supabase.from('members').select('*', { count: 'exact', head: true }).eq('ativo', true);
            if(error) throw error;
            prompt = `O usuário perguntou "quantos alunos ativos?". O banco de dados retornou o número ${count}. Formule uma resposta direta e amigável.`;
            aiResponse = await generateResponse(prompt);

        } else if (q.includes('faturas atrasadas')) {
            const { count, error } = await supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', InvoiceStatus.ATRASADA);
            if(error) throw error;
            prompt = `O usuário perguntou "quantas faturas atrasadas?". O banco de dados retornou o número ${count}. Formule uma resposta direta e amigável. Se o número for maior que zero, inclua um tom de alerta.`;
            aiResponse = await generateResponse(prompt);
            
        } else if (q.includes('encontre o aluno') || q.includes('procurar por')) {
            const nameMatch = q.split(/aluno |por /).pop()?.trim();
            if (nameMatch) {
                const { data, error } = await supabase.from('members').select('nome').ilike('nome', `%${nameMatch}%`).limit(5);
                if(error) throw error;

                if (data && data.length > 0) {
                    const names = data.map(m => m.nome).join(', ');
                    prompt = `O usuário procurou por um aluno com o nome "${nameMatch}". Encontrei ${data.length} resultado(s): ${names}. Formule uma resposta amigável com essa informação.`;
                } else {
                    prompt = `O usuário procurou por um aluno com o nome "${nameMatch}", mas não encontrei nenhum resultado. Formule uma resposta informando isso.`;
                }
                aiResponse = await generateResponse(prompt);
            }
        } else if (q.includes('receita do mês')) {
             const now = new Date();
             const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
             const { data, error } = await supabase.rpc('get_revenue_in_date_range', {
                 p_start_date: startOfMonth,
                 p_end_date: now.toISOString()
             });
             if (error) throw error;

            prompt = `O usuário perguntou sobre a receita do mês. O valor atual é de R$ ${data.toFixed(2)}. Formule uma resposta clara e direta.`;
            aiResponse = await generateResponse(prompt);
        }

        if (aiResponse) {
             res.json({ response: aiResponse });
        } else {
            // Fallback for general questions
            const response = await generateResponse(question);
            res.json({ response });
        }
        
    } catch (error) {
        console.error("Error in assistant endpoint:", error);
        res.status(500).json({ message: "Ocorreu um erro ao processar sua solicitação." });
    }
});

export default router;