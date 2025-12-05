import React, { useState } from 'react';
import { Sale } from '../types';
import { Filter, CalendarCheck, AlertTriangle, Inbox, Search } from 'lucide-react';

interface PendingSalesProps {
  sales: Sale[];
  onBatchUpdate: (ids: string[], newDate: string) => void;
  darkMode?: boolean;
}

const PendingSales: React.FC<PendingSalesProps> = ({ sales, onBatchUpdate, darkMode }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [newDate, setNewDate] = useState('');
  const [filterClient, setFilterClient] = useState('');

  const pendingSales = sales
    .filter(s => !s.date || s.date.length < 8)
    .filter(s => s.client.toLowerCase().includes(filterClient.toLowerCase()))
    .sort((a, b) => new Date(b.completionDate!).getTime() - new Date(a.completionDate!).getTime());

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(pendingSales.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBatchUpdate = () => {
    if (selectedIds.length === 0 || !newDate) {
      alert("Selecione pelo menos uma venda e a data de faturamento.");
      return;
    }
    if (confirm(`Marcar ${selectedIds.length} venda(s) como faturada(s) em ${new Date(newDate).toLocaleDateString('pt-BR')}?`)) {
      onBatchUpdate(selectedIds, newDate);
      setSelectedIds([]);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>📦 Pendentes de Faturamento</h1>
      
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row gap-4 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="relative flex-1">
          <Search size={18} className={`absolute left-3 top-2.5 ${darkMode ? 'text-slate-400' : 'text-gray-400'}`} />
          <input 
            type="text"
            placeholder="Filtrar por cliente..."
            value={filterClient}
            onChange={e => setFilterClient(e.target.value)}
            className={`w-full pl-10 p-2 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-600' : 'bg-white border-gray-300'}`}
          />
        </div>
      </div>

      <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-center gap-4 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-emerald-50 border-emerald-200'}`}>
        <div className="flex-1">
          <label className="block text-sm font-bold mb-1">Marcar Selecionados como Faturado em:</label>
          <input 
            type="date"
            value={newDate}
            onChange={e => setNewDate(e.target.value)}
            className={`p-2 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-600' : 'bg-white border-gray-300'}`}
          />
        </div>
        <button 
          onClick={handleBatchUpdate}
          disabled={selectedIds.length === 0 || !newDate}
          className="w-full md:w-auto px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CalendarCheck size={20} />
          Aplicar em Lote
        </button>
      </div>

      <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
        <table className="w-full text-sm">
          <thead className={darkMode ? 'bg-slate-900' : 'bg-gray-50'}>
            <tr>
              <th className="p-4 w-12"><input type="checkbox" onChange={handleSelectAll} checked={pendingSales.length > 0 && selectedIds.length === pendingSales.length} /></th>
              <th className="p-4 text-left">Cliente</th>
              <th className="p-4 text-left hidden md:table-cell">Data do Pedido</th>
              <th className="p-4 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className={darkMode ? 'divide-y divide-slate-700' : 'divide-y divide-gray-100'}>
            {pendingSales.map(sale => (
              <tr key={sale.id} className={darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50'}>
                <td className="p-4"><input type="checkbox" checked={selectedIds.includes(sale.id)} onChange={() => handleSelectOne(sale.id)} /></td>
                <td className="p-4 font-medium">{sale.client}</td>
                <td className="p-4 hidden md:table-cell">{sale.completionDate ? new Date(sale.completionDate).toLocaleDateString('pt-BR') : '-'}</td>
                <td className="p-4 text-right font-mono font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.valueSold * sale.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {pendingSales.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <Inbox size={48} className="mx-auto mb-4" />
            <p className="font-bold">Nenhuma venda pendente!</p>
            <p>Todas as vendas foram faturadas.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingSales;