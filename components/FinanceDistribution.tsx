

import React, { useState } from 'react';
import { Receivable, FinanceAccount } from '../types';
import { ArrowRight, DollarSign, Percent, Save } from 'lucide-react';

interface FinanceDistributionProps {
  receivables: Receivable[];
  accounts: FinanceAccount[];
  onDistribute: (receivableId: string, distributions: { accountId: string, value: number }[]) => void;
  darkMode?: boolean;
}

const FinanceDistribution: React.FC<FinanceDistributionProps> = ({ receivables, accounts, onDistribute, darkMode }) => {
  const [selectedId, setSelectedId] = useState<string>('');
  const [pjPercent, setPjPercent] = useState(30);
  const [pfPercent, setPfPercent] = useState(0);
  const [cardPercent, setCardPercent] = useState(70);
  
  // Find effective and undistributed items
  const availableItems = receivables.filter(r => r.status === 'EFFECTIVE' && !r.distributed);
  const selectedItem = availableItems.find(r => r.id === selectedId);

  // Accounts (Use name matching instead of types which caused TS errors)
  const pjAccount = accounts.find(a => a.name.toUpperCase().includes('PJ')) || accounts[0];
  const pfAccount = accounts.find(a => a.name.toUpperCase().includes('PF')) || accounts[0];
  const cardAccount = accounts.find(a => a.type === 'INTERNAL' || a.name.toLowerCase().includes('cartão')) || accounts[0];

  const getNetValue = (item: Receivable) => {
      const deductions = item.deductions?.reduce((acc, d) => acc + d.amount, 0) || 0;
      return item.value - deductions;
  };

  const calculateValues = () => {
      if (!selectedItem) return { pj: 0, pf: 0, card: 0 };
      const netVal = getNetValue(selectedItem);
      return {
          pj: (netVal * pjPercent) / 100,
          pf: (netVal * pfPercent) / 100,
          card: (netVal * cardPercent) / 100
      };
  };

  const values = calculateValues();
  const totalPercent = pjPercent + pfPercent + cardPercent;

  const handleConfirm = () => {
      if (!selectedItem) return;
      if (totalPercent !== 100) {
          alert('A soma das porcentagens deve ser 100%');
          return;
      }
      
      const dists = [];
      if (values.pj > 0 && pjAccount) dists.push({ accountId: pjAccount.id, value: values.pj });
      if (values.pf > 0 && pfAccount) dists.push({ accountId: pfAccount.id, value: values.pf });
      if (values.card > 0 && cardAccount) dists.push({ accountId: cardAccount.id, value: values.card });

      onDistribute(selectedItem.id, dists);
      setSelectedId('');
  };

  const bgClass = darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-800';
  const inputClass = darkMode ? 'bg-black border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900';

  return (
    <div className="space-y-6">
       <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Distribuição</h1>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Divida o valor LÍQUIDO entre as contas</p>
       </div>

       {availableItems.length === 0 ? (
           <div className={`p-12 text-center rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800 text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
               <p>Não há valores efetivados disponíveis para distribuição no momento.</p>
               <p className="text-sm mt-2">Vá em "A Receber" e marque um item como efetivado.</p>
           </div>
       ) : (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               {/* Selection List */}
               <div className={`col-span-1 p-4 rounded-xl border ${bgClass}`}>
                   <h3 className="font-bold mb-4">Disponível para Distribuir</h3>
                   <div className="space-y-2">
                       {availableItems.map(item => {
                           const net = getNetValue(item);
                           return (
                               <button
                                 key={item.id}
                                 onClick={() => setSelectedId(item.id)}
                                 className={`w-full text-left p-3 rounded border transition-all ${selectedId === item.id ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-transparent hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                               >
                                   <p className="font-medium">{item.description}</p>
                                   <div className="flex justify-between items-center mt-1">
                                       <span className="text-xs text-gray-500">Líquido:</span>
                                       <span className="text-emerald-600 font-bold">R$ {net.toFixed(2)}</span>
                                   </div>
                               </button>
                           );
                       })}
                   </div>
               </div>

               {/* Distributor Panel */}
               <div className={`col-span-1 lg:col-span-2 p-6 rounded-xl border ${bgClass}`}>
                   {selectedItem ? (
                       <>
                           <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                               <DollarSign className="text-emerald-500" />
                               Distribuindo: R$ {getNetValue(selectedItem).toFixed(2)}
                           </h3>

                           <div className="space-y-6">
                               {/* Sliders or Inputs */}
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                   <div className={`p-4 rounded border ${darkMode ? 'border-slate-600 bg-slate-900' : 'border-gray-200 bg-gray-50'}`}>
                                       <label className="block text-sm font-bold mb-2">Conta PJ (30%)</label>
                                       <div className="flex items-center gap-2">
                                           <input 
                                             type="number" 
                                             className={`w-16 p-1 rounded border ${inputClass}`}
                                             value={pjPercent}
                                             onChange={e => setPjPercent(Number(e.target.value))}
                                           />
                                           <span>%</span>
                                       </div>
                                       <p className="mt-2 text-lg font-bold text-blue-500">R$ {values.pj.toFixed(2)}</p>
                                       <p className="text-xs opacity-70 truncate">{pjAccount?.name}</p>
                                   </div>

                                   <div className={`p-4 rounded border ${darkMode ? 'border-slate-600 bg-slate-900' : 'border-gray-200 bg-gray-50'}`}>
                                       <label className="block text-sm font-bold mb-2">Conta PF</label>
                                       <div className="flex items-center gap-2">
                                           <input 
                                             type="number" 
                                             className={`w-16 p-1 rounded border ${inputClass}`}
                                             value={pfPercent}
                                             onChange={e => setPfPercent(Number(e.target.value))}
                                           />
                                           <span>%</span>
                                       </div>
                                       <p className="mt-2 text-lg font-bold text-purple-500">R$ {values.pf.toFixed(2)}</p>
                                       <p className="text-xs opacity-70 truncate">{pfAccount?.name}</p>
                                   </div>

                                   <div className={`p-4 rounded border ${darkMode ? 'border-slate-600 bg-slate-900' : 'border-gray-200 bg-gray-50'}`}>
                                       <label className="block text-sm font-bold mb-2">Cartão/Reserva</label>
                                       <div className="flex items-center gap-2">
                                           <input 
                                             type="number" 
                                             className={`w-16 p-1 rounded border ${inputClass}`}
                                             value={cardPercent}
                                             onChange={e => setCardPercent(Number(e.target.value))}
                                           />
                                           <span>%</span>
                                       </div>
                                       <p className="mt-2 text-lg font-bold text-pink-500">R$ {values.card.toFixed(2)}</p>
                                       <p className="text-xs opacity-70 truncate">{cardAccount?.name}</p>
                                   </div>
                               </div>

                               <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-slate-700">
                                   <div className="text-sm">
                                       Total: <span className={totalPercent === 100 ? 'text-emerald-500 font-bold' : 'text-red-500 font-bold'}>{totalPercent}%</span>
                                   </div>
                                   <button 
                                     onClick={handleConfirm}
                                     disabled={totalPercent !== 100}
                                     className={`px-6 py-3 rounded-lg font-bold text-white flex items-center gap-2 ${totalPercent === 100 ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-400 cursor-not-allowed'}`}
                                   >
                                       <Save size={20} />
                                       Confirmar & Lançar
                                   </button>
                               </div>
                           </div>
                       </>
                   ) : (
                       <div className="h-full flex items-center justify-center text-gray-400">
                           <p>Selecione um item à esquerda.</p>
                       </div>
                   )}
               </div>
           </div>
       )}
    </div>
  );
};

export default FinanceDistribution;
