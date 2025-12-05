import { Sale, ProductType } from '../types';

/**
 * Utilitário para formatar moeda de forma segura para exibição.
 */
export const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

/**
 * Analisa as vendas e extrai os meses (YYYY-MM) disponíveis para Cesta Básica.
 * Retorna apenas meses que possuem vendas do tipo BASICA.
 */
export const getAvailableBasicPeriods = (sales: Sale[]): string[] => {
  const periods = new Set<string>();
  
  sales.forEach(sale => {
    if (sale.type === ProductType.BASICA && sale.date) {
      try {
        const d = new Date(sale.date);
        if (!isNaN(d.getTime())) {
          // Formato YYYY-MM
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          periods.add(key);
        }
      } catch (e) {
        console.warn('Data inválida encontrada na venda:', sale.id);
      }
    }
  });

  return Array.from(periods).sort().reverse(); // Mais recente primeiro
};

/**
 * Analisa as vendas e extrai os anos disponíveis para Campanha de Natal.
 * Retorna apenas anos que possuem vendas do tipo NATAL.
 */
export const getAvailableNatalYears = (sales: Sale[]): string[] => {
  const years = new Set<string>();

  sales.forEach(sale => {
    if (sale.type === ProductType.NATAL && sale.date) {
      try {
        const d = new Date(sale.date);
        if (!isNaN(d.getTime())) {
          const year = d.getFullYear().toString();
          years.add(year);
        }
      } catch (e) {
        console.warn('Data inválida encontrada na venda:', sale.id);
      }
    }
  });

  return Array.from(years).sort().reverse();
};

/**
 * Filtra as vendas com base no modo e seleção.
 * Regra Natal: 01/Abr a 31/Dez do ano selecionado.
 * Regra Básica: Mês exato.
 */
export const filterSalesByMode = (
  sales: Sale[], 
  mode: 'BASICA' | 'NATAL' | 'CUSTOM', 
  selection: string, // YYYY-MM ou YYYY
  customStart?: string,
  customEnd?: string,
  customType?: ProductType | 'ALL'
): Sale[] => {
  return sales.filter(sale => {
    if (!sale.date) return false;
    
    // Proteção contra datas inválidas
    const d = new Date(sale.date);
    if (isNaN(d.getTime())) return false;

    const saleType = sale.type;
    const saleYear = d.getFullYear();
    const saleMonth = d.getMonth() + 1; // 1-12
    const saleDateStr = sale.date.split('T')[0];

    if (mode === 'BASICA') {
      if (saleType !== ProductType.BASICA) return false;
      if (!selection) return false;
      const [selYear, selMonth] = selection.split('-').map(Number);
      return saleYear === selYear && saleMonth === selMonth;
    }

    if (mode === 'NATAL') {
      if (saleType !== ProductType.NATAL) return false;
      if (!selection) return false;
      const selYear = Number(selection);
      
      // Validação de Ano
      if (saleYear !== selYear) return false;

      // Regra de Negócio: Natal considera lançamentos de Abril (4) a Dezembro (12)
      return saleMonth >= 4 && saleMonth <= 12;
    }

    if (mode === 'CUSTOM') {
       if (customType !== 'ALL' && saleType !== customType) return false;
       if (customStart && saleDateStr < customStart) return false;
       if (customEnd && saleDateStr > customEnd) return false;
       return true;
    }

    return false;
  });
};