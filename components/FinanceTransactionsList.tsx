
import React, { useState } from 'react';
import { Transaction, TransactionCategory, FinanceAccount } from '../types';
import { Filter, Trash2, CheckCircle2, Clock, PlayCircle, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react';

interface FinanceTransactionsListProps {
  transactions: Transaction[];
  accounts: FinanceAccount[];
  categories: TransactionCategory[];
  onDelete: (id: string) => void;
  onPay?: (transaction: Transaction) => void;
  darkMode?: boolean;
}

const FinanceTransactionsList: React.FC<FinanceTransactionsListProps> = ({ transactions, accounts, categories, onDelete, onPay, darkMode }) => {
  const [viewMode, setViewMode] = useState<'ALL' | 'PENDING'>('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [filterMonth, setFilterMonth] = useState('');

  const filtered = transactions.filter(t => {
      if (viewMode === 'PENDING') {
          if (t.isPaid) return false;
      }
      if (filterType !== 'ALL' && t.type !== filterType) return false;
      if (filterMonth && !t.date.startsWith(filterMonth)) return false;
      return true;
  }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getCategoryName = (id: string) => {
      if (id === 'DISTRIBUTION') return 'Distribuição de Lucros';
      if (id === 'CARD_PAYMENT') return 'Pagamento de Fatura';
      if (id === 'uncategorized') return 'Sem Categoria';
      return categories.find(c => c.id === id)?.name || 'Outros';
  };
  
  const getAccountName = (id?: string) => accounts.find(a => a.id === id)?.name || '-';

  const textClass = darkMode ? 'text-slate-300' : 'text-gray-700';
  const headClass = darkMode ? 'bg-slate-800 text-slate-400' : 'bg-gray-50 text-gray-600';
  const cardBg = darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200 shadow-sm';

  const getTypeIcon = (type: string) => {
      if (type === 'INCOME') return <TrendingUp size={18} className="text-emerald-500" />;
      if (type === 'EXPENSE') return <TrendingDown size={18} className="text-red-500" />;
      return <ArrowLeftRight size={18} className="text-blue-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Lançamentos</h1>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Histórico e Provisionamentos</p>
          </div>
          
          <div className="flex gap-2">
              <div className={`flex p-1 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-gray-200'}`}>
                  <button 
                    onClick={() => setViewMode('ALL')}
                    className={`px-4 py-2 rounded text-sm font-bold ${viewMode === 'ALL' ? (darkMode ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-700 shadow') : 'text-gray-500'}`}
                  >
                      Todos
                  </button>
                  <button 
                    onClick={() => setViewMode('PENDING')}
                    className={`px-4 py-2 rounded text-sm font-bold flex items-center gap-2 ${viewMode === 'PENDING' ? (darkMode ? 'bg-yellow-600 text-white' : 'bg-white text-yellow-700 shadow') : 'text-gray-500'}`}
                  >
                      <Clock size={14} /> Provisionados
                  </button>
              </div>
          </div>
      </div>

      {/* Filters Bar */}
      <div className={`flex gap-2 p-2 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-white border shadow-sm'}`}>
          <select 
            className={`bg-transparent outline-none text-sm ${textClass} w-full md:w-auto`}
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          >
              <option value="ALL">Todos Tipos</option>
              <option value="INCOME">Receitas</option>
              <option value="EXPENSE">Despesas</option>
              <option value="TRANSFER">Transferências</option>
          </select>
          <input 
            type="month" 
            className={`bg-transparent outline-none text-sm ${textClass}`}
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
          />
      </div>

      {/* DESKTOP TABLE */}
      <div className={`hidden md:block rounded-xl border overflow-hidden ${darkMode ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white shadow-sm'}`}>
          <div className="overflow-x-auto">
              <table className="w-full text-sm">
                  <thead className={headClass}>
                      <tr>
                          <th className="px-4 py-4 text-left">Data</th>
                          <th className="px-4 py-4 text-left">Descrição</th>
                          <th className="px-4 py-4 text-left">Categoria</th>
                          <th className="px-4 py-4 text-left">Conta</th>
                          <th className="px-4 py-4 text-right">Valor</th>
                          <th className="px-4 py-4 text-center">Status</th>
                          <th className="px-4 py-4 text-center">Ações</th>
                      </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-gray-100'}`}>
                      {filtered.map(t => (
                          <tr key={t.id} className={`hover:bg-black/5 dark:hover:bg-white/5 transition-colors`}>
                              <td className={`px-4 py-4 whitespace-nowrap ${textClass} text-sm`}>
                                  {new Date(t.date).toLocaleDateString('pt-BR')}
                              </td>
                              <td className={`px-4 py-4 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {t.description}
                              </td>
                              <td className={`px-4 py-4 ${textClass}`}>
                                  <span className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                                      {t.type === 'TRANSFER' ? 'Transferência' : getCategoryName(t.categoryId)}
                                  </span>
                              </td>
                              <td className={`px-4 py-4 ${textClass}`}>
                                  {getAccountName(t.accountId)} 
                                  {t.type === 'TRANSFER' && ` -> ${getAccountName(t.targetAccountId)}`}
                              </td>
                              <td className={`px-4 py-4 text-right font-bold font-mono`}>
                                  <span className={`flex items-center justify-end gap-1 ${
                                      t.type === 'INCOME' ? 'text-emerald-500' : 
                                      t.type === 'EXPENSE' ? 'text-red-500' : 'text-blue-500'
                                  }`}>
                                      {t.type === 'INCOME' ? '+' : '-'} {t.amount.toFixed(2)}
                                  </span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                  {t.isPaid ? (
                                      <span className="text-emerald-500 flex justify-center"><CheckCircle2 size={16}/></span>
                                  ) : (
                                      <div className="flex items-center justify-center gap-1">
                                          {onPay && (
                                              <button 
                                                onClick={() => onPay(t)}
                                                className="text-emerald-500 hover:text-emerald-400 p-1 rounded hover:bg-emerald-500/10 transition-colors"
                                                title="Efetivar (Pagar/Receber)"
                                              >
                                                  <PlayCircle size={18} />
                                              </button>
                                          )}
                                          <span className="text-yellow-500 text-[10px] font-bold px-1.5 py-0.5 bg-yellow-500/10 rounded">PENDENTE</span>
                                      </div>
                                  )}
                              </td>
                              <td className="px-4 py-4 text-center">
                                  <button 
                                    onClick={() => onDelete(t.id)}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                    title="Excluir"
                                  >
                                      <Trash2 size={16} />
                                  </button>
                              </td>
                          </tr>
                      ))}
                      {filtered.length === 0 && (
                          <tr><td colSpan={7} className="text-center py-8 text-gray-500">Nenhum lançamento encontrado.</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="md:hidden space-y-3">
          {filtered.map(t => (
              <div key={t.id} className={`p-4 rounded-xl border ${cardBg}`}>
                  <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                              {getTypeIcon(t.type)}
                          </div>
                          <div>
                              <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'} line-clamp-1`}>{t.description}</h3>
                              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {new Date(t.date).toLocaleDateString('pt-BR')} • {t.type === 'TRANSFER' ? 'Transferência' : getCategoryName(t.categoryId)}
                              </p>
                          </div>
                      </div>
                      <div className="text-right">
                          <p className={`font-bold font-mono ${t.type === 'INCOME' ? 'text-emerald-500' : t.type === 'EXPENSE' ? 'text-red-500' : 'text-blue-500'}`}>
                              {t.amount.toFixed(2)}
                          </p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                              {t.isPaid ? (
                                  <span className="text-[10px] text-emerald-500 flex items-center gap-1"><CheckCircle2 size={10}/> Pago</span>
                              ) : (
                                  <span className="text-[10px] text-yellow-500 flex items-center gap-1"><Clock size={10}/> Pendente</span>
                              )}
                          </div>
                      </div>
                  </div>
                  
                  <div className={`flex justify-between items-center pt-2 mt-2 border-t ${darkMode ? 'border-slate-800' : 'border-gray-100'}`}>
                      <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {getAccountName(t.accountId)} {t.type === 'TRANSFER' && `→ ${getAccountName(t.targetAccountId)}`}
                      </span>
                      <div className="flex gap-3">
                          {!t.isPaid && onPay && (
                              <button onClick={() => onPay(t)} className="text-emerald-500 text-xs font-bold flex items-center gap-1">
                                  <PlayCircle size={14}/> Efetivar
                              </button>
                          )}
                          <button onClick={() => onDelete(t.id)} className="text-red-500 text-xs font-bold flex items-center gap-1">
                              <Trash2 size={14}/> Excluir
                          </button>
                      </div>
                  </div>
              </div>
          ))}
          {filtered.length === 0 && <p className="text-center text-gray-500 py-8">Nada por aqui.</p>}
      </div>
    </div>
  );
};

export default FinanceTransactionsList;
