import React, { useState, useMemo, useEffect } from 'react';
import { Sale, CommissionDeduction, ProductType } from '../types';
import { 
  X, 
  ShoppingBag, 
  Gift, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  Plus, 
  Calendar,
  Filter
} from 'lucide-react';
import { 
  getAvailableBasicPeriods, 
  getAvailableNatalYears, 
  filterSalesByMode,
  formatCurrency
} from '../services/importUtils';

interface ImportCommissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sales: Sale[];
  // Callback limpo: Descrição gerada, Valor Total Bruto, Array de Descontos
  onImport: (description: string, totalValue: number, deductions: CommissionDeduction[]) => void;
  darkMode?: boolean;
}

type ImportMode = 'BASICA' | 'NATAL' | 'CUSTOM';

const ImportCommissionsModal: React.FC<ImportCommissionsModalProps> = ({ 
  isOpen, 
  onClose, 
  sales, 
  onImport, 
  darkMode 
}) => {
  // --- Estados ---
  const [mode, setMode] = useState<ImportMode>('BASICA');
  const [selectedPeriod, setSelectedPeriod] = useState<string>(''); // Armazena YYYY-MM ou YYYY
  
  // Custom Mode
  const [customType, setCustomType] = useState<ProductType | 'ALL'>('ALL');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Estados de Desconto
  const [deductions, setDeductions] = useState<CommissionDeduction[]>([]);
  const [newDedDesc, setNewDedDesc] = useState('');
  const [newDedValue, setNewDedValue] = useState('');

  // --- Memoização de Dados (Evita travamentos/loops) ---
  
  // 1. Listas de opções disponíveis baseadas no histórico de vendas
  const basicOptions = useMemo(() => getAvailableBasicPeriods(sales), [sales]);
  const natalOptions = useMemo(() => getAvailableNatalYears(sales), [sales]);

  // 2. Vendas Filtradas (Recalcula apenas se seleção ou modo mudar)
  const filteredSales = useMemo(() => {
    return filterSalesByMode(sales, mode, selectedPeriod, customStart, customEnd, customType);
  }, [sales, mode, selectedPeriod, customStart, customEnd, customType]);

  // 3. Totais
  const grossTotal = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + (s.commissionValueTotal || 0), 0);
  }, [filteredSales]);

  const totalDeductions = useMemo(() => {
    return deductions.reduce((acc, d) => acc + (d.amount || 0), 0);
  }, [deductions]);

  const netTotal = grossTotal - totalDeductions;

  // --- Efeitos ---

  // Reseta a seleção quando troca o modo para evitar estados inconsistentes
  useEffect(() => {
    setSelectedPeriod('');
    setCustomStart('');
    setCustomEnd('');
  }, [mode]);

  // Se o modal fechar, limpa estados internos
  useEffect(() => {
    if (!isOpen) {
      setDeductions([]);
      setNewDedDesc('');
      setNewDedValue('');
      setSelectedPeriod('');
      setMode('BASICA');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // --- Handlers ---

  const handleAddDeduction = () => {
    const val = parseFloat(newDedValue);
    if (!newDedDesc.trim() || isNaN(val) || val <= 0) return;

    const newDeduction: CommissionDeduction = {
      id: crypto.randomUUID(),
      description: newDedDesc,
      amount: val
    };

    setDeductions(prev => [...prev, newDeduction]);
    setNewDedDesc('');
    setNewDedValue('');
  };

  const handleRemoveDeduction = (id: string) => {
    setDeductions(prev => prev.filter(d => d.id !== id));
  };

  const handleConfirm = () => {
    if (grossTotal <= 0) {
      alert("O valor bruto está zerado. Selecione um período com vendas.");
      return;
    }

    // Gera descrição automática
    let description = '';
    if (mode === 'BASICA') {
      const [year, month] = selectedPeriod.split('-');
      description = `Comissão Básica ${month}/${year}`;
    } else if (mode === 'NATAL') {
      description = `Comissão Natal ${selectedPeriod}`;
    } else {
        description = `Comissão Personalizada`;
    }

    onImport(description, grossTotal, deductions);
    onClose();
  };

  // --- Classes CSS Dinâmicas ---
  const baseBg = darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-gray-900';
  const cardBg = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200';
  const inputBg = darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900';
  const highlightText = darkMode ? 'text-emerald-400' : 'text-emerald-600';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className={`w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] ${baseBg}`}>
        
        {/* Header */}
        <div className={`p-6 border-b flex justify-between items-center ${darkMode ? 'border-slate-800' : 'border-gray-100'}`}>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              Importar Comissões
            </h2>
            <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Traga os dados do módulo de Vendas para o Financeiro.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* 1. Seleção de Modo */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setMode('BASICA')}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
                mode === 'BASICA'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                  : `${cardBg} opacity-60 hover:opacity-100`
              }`}
            >
              <ShoppingBag size={24} />
              <div className="text-center">
                <span className="block font-bold text-sm">Cesta Básica</span>
                <span className="text-[10px] opacity-70">Mensal</span>
              </div>
            </button>

            <button
              onClick={() => setMode('NATAL')}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
                mode === 'NATAL'
                  ? 'border-red-500 bg-red-500/10 text-red-500'
                  : `${cardBg} opacity-60 hover:opacity-100`
              }`}
            >
              <Gift size={24} />
              <div className="text-center">
                <span className="block font-bold text-sm">Cesta de Natal</span>
                <span className="text-[10px] opacity-70">Sazonal (Abr-Dez)</span>
              </div>
            </button>

            <button
              onClick={() => setMode('CUSTOM')}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
                mode === 'CUSTOM'
                  ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                  : `${cardBg} opacity-60 hover:opacity-100`
              }`}
            >
              <Filter size={24} />
              <div className="text-center">
                <span className="block font-bold text-sm">Personalizado</span>
                <span className="text-[10px] opacity-70">Filtro Livre</span>
              </div>
            </button>
          </div>

          {/* 2. Seleção de Período */}
          <div className={`p-5 rounded-xl border ${cardBg}`}>
            <label className="block text-sm font-bold mb-3 flex items-center gap-2">
              <Calendar size={16} className={mode === 'BASICA' ? 'text-emerald-500' : (mode === 'NATAL' ? 'text-red-500' : 'text-blue-500')}/>
              Selecione o Período
            </label>
            
            {mode === 'BASICA' && (
                <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className={`w-full p-3 rounded-lg border outline-none focus:ring-2 ${inputBg} focus:ring-emerald-500`}
                >
                <option value="">-- Selecione o Mês --</option>
                {basicOptions.map(opt => {
                    const [y, m] = opt.split('-');
                    return <option key={opt} value={opt}>{m}/{y}</option>;
                })}
                </select>
            )}

            {mode === 'NATAL' && (
                <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className={`w-full p-3 rounded-lg border outline-none focus:ring-2 ${inputBg} focus:ring-red-500`}
                >
                <option value="">-- Selecione o Ano --</option>
                {natalOptions.map(year => (
                    <option key={year} value={year}>Natal {year}</option>
                ))}
                </select>
            )}

            {mode === 'CUSTOM' && (
                <div className="space-y-3">
                    <select
                        value={customType}
                        onChange={(e) => setCustomType(e.target.value as any)}
                        className={`w-full p-3 rounded-lg border outline-none ${inputBg}`}
                    >
                        <option value="ALL">Todos os Tipos</option>
                        <option value={ProductType.BASICA}>Cesta Básica</option>
                        <option value={ProductType.NATAL}>Cesta de Natal</option>
                    </select>
                    <div className="flex gap-3">
                        <input type="date" className={`flex-1 p-3 rounded border ${inputBg}`} value={customStart} onChange={e => setCustomStart(e.target.value)} />
                        <input type="date" className={`flex-1 p-3 rounded border ${inputBg}`} value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
                    </div>
                </div>
            )}

            {/* Feedback Visual de Vendas Encontradas */}
            <div className="mt-4 flex items-center justify-between text-sm">
                <span className={darkMode ? 'text-slate-400' : 'text-gray-600'}>
                  Vendas encontradas: <strong>{filteredSales.length}</strong>
                </span>
                <span className={`text-lg font-bold ${highlightText}`}>
                  Bruto: {formatCurrency(grossTotal)}
                </span>
            </div>
            
            {(selectedPeriod || (mode === 'CUSTOM' && (customStart || customEnd))) && filteredSales.length === 0 && (
              <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle size={14}/> Nenhuma venda qualificada encontrada neste período.
              </p>
            )}
          </div>

          {/* 3. Descontos na Fonte (Opcional) */}
          <div className={`p-5 rounded-xl border ${cardBg}`}>
            <label className="block text-sm font-bold mb-3">
              Descontos na Fonte (Taxas, Adiantamentos)
            </label>
            
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                placeholder="Descrição (ex: IRRF)" 
                className={`flex-1 p-2 rounded-lg border text-sm ${inputBg}`}
                value={newDedDesc}
                onChange={e => setNewDedDesc(e.target.value)}
              />
              <input 
                type="number" 
                placeholder="R$" 
                className={`w-28 p-2 rounded-lg border text-sm ${inputBg}`}
                value={newDedValue}
                onChange={e => setNewDedValue(e.target.value)}
              />
              <button 
                onClick={handleAddDeduction}
                className="bg-slate-700 text-white p-2 rounded-lg hover:bg-slate-600"
              >
                <Plus size={20} />
              </button>
            </div>

            {deductions.length > 0 ? (
              <div className="space-y-2">
                {deductions.map(ded => (
                  <div key={ded.id} className={`flex justify-between items-center p-2 rounded border text-sm ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                    <span>{ded.description}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-red-500 font-mono font-bold">
                        - {formatCurrency(ded.amount)}
                      </span>
                      <button onClick={() => handleRemoveDeduction(ded.id)} className="text-gray-400 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-center opacity-50 italic">Nenhum desconto aplicado.</p>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className={`p-6 border-t ${darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-gray-100 bg-gray-50'}`}>
          <div className="flex justify-between items-end mb-4">
            <div className="text-right w-full">
              <span className={`text-xs uppercase font-bold ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                Líquido a Receber
              </span>
              <div className={`text-3xl font-bold ${netTotal > 0 ? highlightText : 'text-gray-400'}`}>
                {formatCurrency(netTotal)}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className={`flex-1 py-3 rounded-lg font-bold border transition-colors ${
                darkMode 
                  ? 'border-slate-700 text-slate-400 hover:bg-slate-800' 
                  : 'border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Cancelar
            </button>
            <button 
              onClick={handleConfirm}
              disabled={grossTotal <= 0}
              className={`flex-1 py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 ${
                grossTotal > 0 
                  ? (mode === 'BASICA' ? 'bg-emerald-600 hover:bg-emerald-700' : (mode === 'NATAL' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'))
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle size={20} />
              Confirmar Importação
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ImportCommissionsModal;