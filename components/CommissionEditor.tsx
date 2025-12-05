
import React, { useState } from 'react';
import { CommissionRule, ProductType } from '../types';
import { Save, Plus, Trash2, AlertCircle } from 'lucide-react';

interface CommissionEditorProps {
  initialRules: CommissionRule[];
  type: ProductType;
  onSave: (rules: CommissionRule[]) => void;
}

const CommissionEditor: React.FC<CommissionEditorProps> = ({ initialRules, type, onSave }) => {
  // Helper to handle inputs as strings to allow typing decimals
  const [rules, setRules] = useState<{
      id: string;
      minPercent: string;
      maxPercent: string;
      commissionRate: string; // Stored as percentage string (e.g. "5" for 5%)
  }[]>(
    [...initialRules]
    .sort((a, b) => a.minPercent - b.minPercent)
    .map(r => ({
        id: r.id,
        minPercent: r.minPercent.toString(),
        maxPercent: r.maxPercent === null ? '' : r.maxPercent.toString(),
        commissionRate: (r.commissionRate * 100).toString()
    }))
  );
  
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = (id: string, field: string, value: string) => {
    setRules(prev => prev.map(r => {
      if (r.id !== id) return r;
      return { ...r, [field]: value };
    }));
    setIsDirty(true);
  };

  const addRule = () => {
    const newRule = {
      id: crypto.randomUUID(),
      minPercent: '0',
      maxPercent: '0',
      commissionRate: '0'
    };
    setRules([...rules, newRule]);
    setIsDirty(true);
  };

  const removeRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
    setIsDirty(true);
  };

  const handleSave = () => {
    const finalRules: CommissionRule[] = rules.map(r => ({
        id: r.id,
        minPercent: parseFloat(r.minPercent) || 0,
        maxPercent: r.maxPercent === '' ? null : (parseFloat(r.maxPercent) || 0),
        commissionRate: (parseFloat(r.commissionRate) || 0) / 100
    }));

    const sorted = finalRules.sort((a, b) => a.minPercent - b.minPercent);
    onSave(sorted);
    
    // Update local state to match sorted structure
    setRules(sorted.map(r => ({
        id: r.id,
        minPercent: r.minPercent.toString(),
        maxPercent: r.maxPercent === null ? '' : r.maxPercent.toString(),
        commissionRate: (r.commissionRate * 100).toString()
    })));
    
    setIsDirty(false);
  };

  const colorClass = type === ProductType.BASICA ? 'emerald' : 'red';
  const title = type === ProductType.BASICA ? 'Cesta Básica' : 'Cesta de Natal';

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden`}>
      <div className={`p-4 border-b border-gray-100 bg-${colorClass}-50 flex justify-between items-center`}>
        <h3 className={`text-lg font-bold text-${colorClass}-800`}>Tabela: {title}</h3>
        {isDirty && (
            <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-1 rounded flex items-center">
                <AlertCircle size={12} className="mr-1"/> Não Salvo
            </span>
        )}
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-12 gap-2 mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <div className="col-span-3">De (%)</div>
          <div className="col-span-3">Até (%) <span className="text-[10px] lowercase font-normal">(vazio = acima de)</span></div>
          <div className="col-span-4">Comissão (%)</div>
          <div className="col-span-2 text-center">Ação</div>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {rules.map((rule) => (
            <div key={rule.id} className="grid grid-cols-12 gap-2 items-center group">
              <div className="col-span-3">
                <input 
                  type="number" 
                  step="0.01"
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded p-1.5 text-sm"
                  value={rule.minPercent}
                  onChange={(e) => handleChange(rule.id, 'minPercent', e.target.value)}
                />
              </div>
              <div className="col-span-3">
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="∞"
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded p-1.5 text-sm"
                  value={rule.maxPercent}
                  onChange={(e) => handleChange(rule.id, 'maxPercent', e.target.value)}
                />
              </div>
              <div className="col-span-4 relative">
                <input 
                  type="number" 
                  step="0.01"
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded p-1.5 text-sm pr-6 font-semibold"
                  value={rule.commissionRate}
                  onChange={(e) => handleChange(rule.id, 'commissionRate', e.target.value)}
                />
                <span className="absolute right-2 top-1.5 text-gray-400 text-sm">%</span>
              </div>
              <div className="col-span-2 flex justify-center">
                <button 
                  onClick={() => removeRule(rule.id)}
                  className="text-gray-300 hover:text-red-500 p-1 rounded-md transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-between items-center pt-4 border-t border-gray-100">
           <button 
            onClick={addRule}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center"
          >
            <Plus size={16} className="mr-1" />
            Adicionar Faixa
          </button>

          <button 
            onClick={handleSave}
            disabled={!isDirty}
            className={`px-4 py-2 rounded-lg flex items-center font-medium shadow-sm transition-all ${
                isDirty 
                ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Save size={18} className="mr-2" />
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommissionEditor;
