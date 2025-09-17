import { Router } from 'express';

const router = Router();

// POST /api/assistant - Processar pergunta para a IA
router.post('/', async (req, res) => {
    const { question } = req.body;

    if (!question) {
        return res.status(400).json({ message: 'A pergunta é obrigatória.' });
    }

    // Lógica de IA (stub):
    // 1. Analisar a 'question' para entender a intenção (ex: "listar alunos", "faturamento do mês").
    // 2. Com base na intenção, montar e executar uma query SQL no banco.
    // 3. Formatar a resposta do banco em uma frase em linguagem natural.
    // 4. Retornar a frase.
    
    const mockResponse = `Esta é uma resposta simulada para a sua pergunta: "${question}". Em uma implementação real, eu buscaria esta informação no banco de dados.`;

    res.json({ response: mockResponse });
});

export default router;
