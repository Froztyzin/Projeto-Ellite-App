import { Pool } from 'pg';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Adicione outras configurações de SSL se necessário para produção
  /*
  ssl: {
    rejectUnauthorized: false
  }
  */
});

// Exporta um objeto com um método query para ser usado em toda a aplicação
export default {
  query: (text: string, params?: any[]) => pool.query(text, params),
};
