

import React, { useState, useEffect } from 'react';
import { TransactionType, FinanceAccount, TransactionCategory, PersonType } from '../types';
import { X, Save, TrendingUp, TrendingDown, ArrowLeftRight, Calendar, RefreshCw } from 'lucide-react';

interface FinanceTransactionFormProps {
  initialType?: TransactionType; // 'INCOME' | 'EXPENSE' | 'TRANSFER'
  accounts: FinanceAccount[];
  categories: TransactionCategory[];
  onSave: (data: any | any[]) => void;
  onCancel: () => void;
  darkMode?: boolean;
}

const FinanceTransactionForm: React.FC<FinanceTransactionFormProps> = ({ 
    initialType = 'EXPENSE', 
    accounts, 
    categories, 
    onSave, 
    onCancel,
    darkMode 
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [targetAccountId, setTargetAccountId] = useState(accounts.length > 1 ? accounts[1].id : '');
  const [categoryId, setCategoryId] = useState('');
  const [subcategory, setSubcategory] = useState(''); // New Subcategory
  const [personType, setPersonType] = useState<PersonType>('PF');
  const [isPaid, setIsPaid] = useState(true);
  
  // Recurring / Provisioning
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceCount, setRecurrenceCount] = useState(2); // Repeat X times

  // Income Calculator State
  const [grossIncome, setGrossIncome] = useState('');
  const [incomeDeductions, setIncomeDeductions] = useState('');

  // Update category options based on type
  const availableCategories = categories.filter(c => c.type === type);
  const selectedCategory = categories.find(c => c.id === categoryId);

  useEffect(() => {
      // Reset category when type changes
      setCategoryId('');
      setSubcategory('');
  }, [type]);

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      const val = parseFloat(amount);
      if (!description || isNaN(val) || val <= 0) {
          alert("Preencha a descrição e um valor válido.");
          return;
      }

      const transactionsToSave = [];

      // Base Transaction
      const baseData: any = {
          description,
          amount: val,
          type,
          categoryId: categoryId || 'uncategorized',
          subcategory: subcategory, // Save Subcategory
          personType: personType,
          accountId
      };

      if (type === 'TRANSFER') {
          if (accountId === targetAccountId) {
              alert("A conta de origem e destino devem ser diferentes.");
              return;
          }
          baseData.targetAccountId = targetAccountId;
          baseData.categoryName = 'Transferência';
      }

      // Logic for Recursion (Provisioning)
      const count = isRecurring ? recurrenceCount : 1;
      
      for (let i = 0; i < count; i++) {
          const d = new Date(date);
          d.setMonth(d.getMonth() + i); // Increment month
          const dateStr = d.toISOString().split('T')[0];

          // If recurring, subsequent items are typically NOT paid yet (Provisions)
          // Exception: The first one respects the checkbox.
          // UPDATE: If it's a recurring expense, future instances are PROVISIONS (Unpaid)
          const paidStatus = i === 0 ? isPaid : false;

          transactionsToSave.push({
              ...baseData,
              id: crypto.randomUUID(),
              date: dateStr,
              isPaid: paidStatus,
              description: i > 0 ? `${description} (${i+1}/${count})` : description
          });
      }

      // Send the array to parent
      onSave(transactionsToSave);
  };

  const handleCalculateNet = () => {
      const gross = parseFloat(grossIncome) || 0;
      const ded = parseFloat(incomeDeductions) || 0;
      setAmount((gross - ded).toFixed(2));
  };

  const bgClass = darkMode ? 'bg-slate-900 text-white' : 'bg-white text-gray-900';
  const inputClass = darkMode ? 'bg-black border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className={`${bgClass} rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]`}>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-700">
            <button 
                onClick={() => setType('INCOME')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${type === 'INCOME' ? 'text-emerald-500 border-b-2 border-emerald-500 bg-emerald-500/10' : 'text-gray-500 hover:text-gray-300'}`}
            >
                <TrendingUp size={18} /> Receita
            </button>
            <button 
                onClick={() => setType('EXPENSE')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${type === 'EXPENSE' ? 'text-red-500 border-b-2 border-red-500 bg-red-500/10' : 'text-gray-500 hover:text-gray-300'}`}
            >
                <TrendingDown size={18} /> Despesa
            </button>
            <button 
                onClick={() => setType('TRANSFER')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${type === 'TRANSFER' ? 'text-blue-500 border-b-2 border-blue-500 bg-blue-500/10' : 'text-gray-500 hover:text-gray-300'}`}
            >
                <ArrowLeftRight size={18} /> Transf.
            </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
            
            {/* Description & Amount */}
            <div>
                <label className="block text-xs text-gray-500 mb-1">Descrição</label>
                <input 
                    className={`w-full p-3 rounded-lg border ${inputClass}`}
                    placeholder={type === 'INCOME' ? 'Ex: Salário, Comissão' : 'Ex: Aluguel, Supermercado'}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    required
                />
            </div>

            {/* Income Calculator (Optional) */}
            {type === 'INCOME' && (
                <div className={`p-3 rounded-lg border border-dashed ${darkMode ? 'border-slate-700 bg-slate-800/50' : 'border-gray-300 bg-gray-50'}`}>
                    <p className="text-xs text-gray-500 mb-2 font-bold">Calculadora Rápida (Opcional)</p>
                    <div className="flex gap-2">
                        <input 
                            type="number" placeholder="Bruto" 
                            className={`w-1/3 p-2 rounded text-sm border ${inputClass}`}
                            value={grossIncome} onChange={e => setGrossIncome(e.target.value)}
                        />
                        <input 
                            type="number" placeholder="Descontos" 
                            className={`w-1/3 p-2 rounded text-sm border ${inputClass}`}
                            value={incomeDeductions} onChange={e => setIncomeDeductions(e.target.value)}
                        />
                        <button type="button" onClick={handleCalculateNet} className="flex-1 bg-emerald-600 text-white rounded text-xs font-bold">
                            Calcular Líquido
                        </button>
                    </div>
                </div>
            )}

            <div>
                <label className="block text-xs text-gray-500 mb-1">Valor (R$)</label>
                <input 
                    type="number" 
                    step="0.01"
                    className={`w-full p-3 rounded-lg border text-lg font-bold ${inputClass}`}
                    placeholder="0,00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Data</label>
                    <div className="relative">
                        <input 
                            type="date" 
                            className={`w-full p-2 rounded-lg border ${inputClass}`}
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            required
                        />
                    </div>
                </div>
                
                {/* Account Selection */}
                <div>
                    <label className="block text-xs text-gray-500 mb-1">
                        {type === 'TRANSFER' ? 'Conta Origem' : 'Conta / Cartão'}
                    </label>
                    <select 
                        className={`w-full p-2 rounded-lg border ${inputClass}`}
                        value={accountId}
                        onChange={e => setAccountId(e.target.value)}
                    >
                        {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {type === 'TRANSFER' && (
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Conta Destino</label>
                    <select 
                        className={`w-full p-2 rounded-lg border ${inputClass}`}
                        value={targetAccountId}
                        onChange={e => setTargetAccountId(e.target.value)}
                    >
                        {accounts.filter(a => a.id !== accountId).map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {type !== 'TRANSFER' && (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Categoria</label>
                        <select 
                            className={`w-full p-2 rounded-lg border ${inputClass}`}
                            value={categoryId}
                            onChange={e => { setCategoryId(e.target.value); setSubcategory(''); }}
                        >
                            <option value="">Sem Categoria</option>
                            {availableCategories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        {/* Subcategory Selector - Only show if category selected has subs */}
                        {selectedCategory && selectedCategory.subcategories && selectedCategory.subcategories.length > 0 && (
                            <select 
                                className={`w-full p-2 rounded-lg border mt-2 text-sm ${inputClass}`}
                                value={subcategory}
                                onChange={e => setSubcategory(e.target.value)}
                            >
                                <option value="">Subcategoria...</option>
                                {selectedCategory.subcategories.map(sub => (
                                    <option key={sub} value={sub}>{sub}</option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Pessoa</label>
                        <div className="flex bg-gray-800 rounded p-1">
                            <button 
                                type="button"
                                onClick={() => setPersonType('PF')}
                                className={`flex-1 text-xs py-1.5 rounded ${personType === 'PF' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}
                            >PF</button>
                            <button 
                                type="button"
                                onClick={() => setPersonType('PJ')}
                                className={`flex-1 text-xs py-1.5 rounded ${personType === 'PJ' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                            >PJ</button>
                        </div>
                    </div>
                </div>
            )}

            <div className={`p-3 rounded-lg border ${darkMode ? 'border-slate-700 bg-slate-800/30' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                    <input 
                        type="checkbox" 
                        id="isPaid" 
                        checked={isPaid} 
                        onChange={e => setIsPaid(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="isPaid" className="text-sm font-bold">
                        {type === 'INCOME' ? 'Recebido' : 'Pago'} (Efetivado)
                    </label>
                </div>
                <p className="text-xs text-gray-500 ml-6">
                    Se desmarcado, será salvo como <strong>Pendente/Provisionado</strong>.
                </p>
            </div>

            {/* Recurring Option */}
            {type !== 'TRANSFER' && (
                <div className={`p-3 rounded-lg border ${darkMode ? 'border-slate-700 bg-slate-800/30' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsRecurring(!isRecurring)}>
                        <RefreshCw size={16} className={isRecurring ? 'text-blue-500' : 'text-gray-400'} />
                        <label className="text-sm font-bold cursor-pointer select-none">
                            Repetir Lançamento (Provisionar)
                        </label>
                        <input 
                            type="checkbox" 
                            checked={isRecurring} 
                            onChange={e => setIsRecurring(e.target.checked)}
                            className="ml-auto w-4 h-4 rounded"
                        />
                    </div>
                    {isRecurring && (
                        <div className="mt-2 text-xs text-gray-400 ml-6">
                            <p className="mb-2">Os lançamentos futuros serão criados como <strong>PENDENTES</strong>.</p>
                            <div className="flex items-center gap-2">
                                <span>Repetir por</span>
                                <input 
                                    type="number" min="2" max="120"
                                    className={`w-16 p-1 text-center rounded border ${inputClass}`}
                                    value={recurrenceCount}
                                    onChange={e => setRecurrenceCount(Number(e.target.value))}
                                />
                                <span>meses</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

        </form>

        {/* Footer */}
        <div className={`p-4 border-t ${darkMode ? 'border-slate-800' : 'border-gray-200'} flex gap-3`}>
            <button 
                onClick={onCancel}
                className={`flex-1 py-3 rounded-lg font-medium border ${darkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-800' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}
            >
                Cancelar
            </button>
            <button 
                onClick={handleSubmit}
                className={`flex-1 py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 ${
                    type === 'INCOME' ? 'bg-emerald-600 hover:bg-emerald-700' :
                    type === 'EXPENSE' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-blue-600 hover:bg-blue-700'
                }`}
            >
                <Save size={18} /> Salvar
            </button>
        </div>

      </div>
    </div>
  );
};

export default FinanceTransactionForm;