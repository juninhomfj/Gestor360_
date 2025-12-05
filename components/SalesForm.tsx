import React, { useEffect, useState } from 'react';
import { ProductType, Sale, SaleFormData, CommissionRule } from '../types';
import { findCommissionRate } from '../services/logic';
import { Save, X, Calculator, CalendarCheck, Calendar, Clock } from 'lucide-react';

interface SalesFormProps {
  initialData?: Sale;
  onSubmit: (data: SaleFormData) => void;
  onCancel: () => void;
  rulesBasic: CommissionRule[];
  rulesNatal: CommissionRule[];
}

const SalesForm: React.FC<SalesFormProps> = ({ initialData, onSubmit, onCancel, rulesBasic, rulesNatal }) => {
  const [client, setClient] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [type, setType] = useState<ProductType>(ProductType.BASICA);
  const [valueProposed, setValueProposed] = useState('0');
  const [valueSold, setValueSold] = useState('0');
  
  // Datas
  const [date, setDate] = useState(''); // Faturamento
  const [isPendingDate, setIsPendingDate] = useState(false); // Checkbox state
  const [completionDate, setCompletionDate] = useState(new Date().toISOString().split('T')[0]); // Pedido

  const [observations, setObservations] = useState('');
  const [marginPercent, setMarginPercent] = useState('0');

  // Preview State
  const [preview, setPreview] = useState({ commission: 0, commissionRate: 0 });

  useEffect(() => {
    if (initialData) {
      setClient(initialData.client);
      setQuantity(initialData.quantity.toString());
      setType(initialData.type);
      setValueProposed(initialData.valueProposed.toString());
      setValueSold(initialData.valueSold.toString());
      
      // Parse Faturamento Date
      let dateStr = '';
      try {
          if (initialData.date) {
            const d = new Date(initialData.date);
            if (!isNaN(d.getTime())) dateStr = d.toISOString().split('T')[0];
          }
      } catch (e) {}
      
      setDate(dateStr);
      setIsPendingDate(!dateStr); // Se não tem data, marca como pendente

      // Parse Completion Date
      let compDateStr = new Date().toISOString().split('T')[0];
      try {
          if (initialData.completionDate) {
            const d = new Date(initialData.completionDate);
            if (!isNaN(d.getTime())) compDateStr = d.toISOString().split('T')[0];
          }
      } catch (e) {}
      setCompletionDate(compDateStr);
      
      setObservations(initialData.observations || '');
      setMarginPercent((initialData.marginPercent || 0).toString());
    } else {
        // Nova venda: Padrão pendente
        setIsPendingDate(true);
        setDate('');
    }
  }, [initialData]);

  // Real-time calculation
  useEffect(() => {
    const activeRules = type === ProductType.BASICA ? rulesBasic : rulesNatal;
    const margin = parseFloat(marginPercent) || 0;
    const qty = parseFloat(quantity) || 0;
    const vlrProp = parseFloat(valueProposed) || 0;

    const rate = findCommissionRate(margin, activeRules);
    const commission = (qty * vlrProp) * rate;

    setPreview({
      commissionRate: rate,
      commission
    });
  }, [type, marginPercent, quantity, valueProposed, rulesBasic, rulesNatal]);

  const handlePendingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const checked = e.target.checked;
      setIsPendingDate(checked);
      if (checked) {
          setDate(''); 
      } else {
          setDate(new Date().toISOString().split('T')[0]); 
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData: SaleFormData = {
        client,
        quantity: parseFloat(quantity) || 0,
        type,
        valueProposed: parseFloat(valueProposed) || 0,
        valueSold: parseFloat(valueSold) || 0,
        date: isPendingDate ? '' : date,
        completionDate, 
        observations,
        marginPercent: parseFloat(marginPercent) || 0
    };
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <Calculator className="mr-2 text-emerald-600" size={20}/>
            {initialData ? 'Editar Venda' : 'Nova Venda'}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* ... (Campos de Produto/Cliente/Valores iguais) ... */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Produto</label>
              <select 
                value={type} 
                onChange={e => setType(e.target.value as ProductType)}
                className="w-full bg-white text-gray-900 border-gray-300 rounded-lg shadow-sm p-2 border"
              >
                <option value={ProductType.BASICA}>Cesta Básica</option>
                <option value={ProductType.NATAL}>Cesta de Natal</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <input 
                type="text" 
                required
                value={client} 
                onChange={e => setClient(e.target.value)}
                className="w-full bg-white text-gray-900 border-gray-300 rounded-lg shadow-sm p-2 border"
              />
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${type === ProductType.BASICA ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-3 text-gray-600">Dados Financeiros</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Quantidade</label>
                <input 
                  type="number" 
                  min="1"
                  value={quantity} 
                  onChange={e => setQuantity(e.target.value)}
                  className="w-full bg-white text-gray-900 border-gray-300 rounded-md p-2 border text-right"
                />
              </div>
               <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                  Vlr Proposto
                  <span title="Base para comissão" className="text-gray-400 cursor-help text-[10px]">(Base)</span>
                </label>
                <input 
                  type="number" 
                  step="0.01"
                  value={valueProposed} 
                  onChange={e => setValueProposed(e.target.value)}
                  className="w-full bg-white text-gray-900 border-emerald-300 ring-2 ring-emerald-100 rounded-md p-2 border text-right font-semibold"
                />
              </div>
               <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Vlr Venda</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={valueSold} 
                  onChange={e => setValueSold(e.target.value)}
                  className="w-full bg-white text-gray-900 border-gray-300 rounded-md p-2 border text-right"
                />
              </div>
               <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Margem (%)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={marginPercent} 
                  onChange={e => setMarginPercent(e.target.value)}
                  className="w-full bg-white text-gray-900 border-blue-300 ring-2 ring-blue-100 rounded-md p-2 border text-right font-bold"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-800 text-white rounded-lg p-4 grid grid-cols-2 gap-4 text-center">
             <div>
              <span className="block text-xs text-slate-400 uppercase">Faixa Comissão</span>
              <span className="text-xl font-bold text-yellow-400">
                {(preview.commissionRate * 100).toFixed(2)}%
              </span>
            </div>
             <div>
              <span className="block text-xs text-slate-400 uppercase">Comissão Total</span>
              <span className="text-xl font-bold text-emerald-400">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(preview.commission)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
            {/* DATA FINALIZAÇÃO (PEDIDO) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <CalendarCheck size={16} className="text-blue-500" />
                Data Finalização (Pedido)
              </label>
              <input 
                type="date" 
                value={completionDate} 
                onChange={e => setCompletionDate(e.target.value)}
                className="w-full bg-white text-gray-900 border-gray-300 rounded-lg p-2 border"
                required
              />
            </div>
            
            {/* DATA FATURAMENTO (NF) + CHECKBOX */}
            <div className="relative flex flex-col">
              <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar size={16} className="text-emerald-500" />
                    Data Faturamento
                  </label>
                  
                  {/* PENDING CHECKBOX - REFORÇADO */}
                  <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1 rounded border border-orange-200 hover:bg-orange-50 transition-colors select-none shadow-sm">
                      <input 
                        type="checkbox" 
                        checked={isPendingDate} 
                        onChange={handlePendingChange}
                        className="rounded text-orange-500 focus:ring-orange-500 w-4 h-4 cursor-pointer accent-orange-500"
                      />
                      <span className="text-xs font-bold text-orange-600">Pendente</span>
                  </label>
              </div>

              <div className="relative flex-1">
                  <input 
                    type="date" 
                    value={date} 
                    onChange={e => setDate(e.target.value)}
                    disabled={isPendingDate}
                    className={`w-full h-10 bg-white text-gray-900 border-gray-300 rounded-lg p-2 border transition-all ${isPendingDate ? 'opacity-40 cursor-not-allowed bg-gray-100' : ''}`}
                  />
                  {isPendingDate && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-xs font-bold text-orange-600 bg-orange-100/90 px-3 py-1 rounded-full border border-orange-200 flex items-center gap-1 shadow-sm backdrop-blur-sm">
                              <Clock size={12}/> Aguardando NF
                          </span>
                      </div>
                  )}
              </div>
            </div>
          </div>

          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <input 
                type="text" 
                value={observations} 
                onChange={e => setObservations(e.target.value)}
                className="w-full bg-white text-gray-900 border-gray-300 rounded-lg p-2 border"
                placeholder="Detalhes adicionais..."
              />
          </div>

        </form>

        <div className="p-6 border-t bg-gray-50 rounded-b-xl flex justify-end space-x-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium flex items-center shadow-md"
          >
            <Save size={18} className="mr-2" />
            Salvar Venda
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesForm;