

import React, { useState } from 'react';
import { TransactionCategory } from '../types';
import { Tag, Plus, Trash2, Check, X } from 'lucide-react';

interface FinanceCategoriesProps {
  categories: TransactionCategory[];
  onUpdate: (cats: TransactionCategory[]) => void;
  darkMode?: boolean;
}

const FinanceCategories: React.FC<FinanceCategoriesProps> = ({ categories, onUpdate, darkMode }) => {
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  
  // Subcategory Editing
  const [expandedCatId, setExpandedCatId] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState('');

  const handleAdd = () => {
      if (newCatName) {
          const newCat: TransactionCategory = {
              id: crypto.randomUUID(),
              name: newCatName,
              type: newCatType,
              personType: 'PF',
              subcategories: []
          };
          onUpdate([...categories, newCat]);
          setNewCatName('');
      }
  };

  const handleDelete = (id: string) => {
      if (confirm("Excluir categoria?")) {
          onUpdate(categories.filter(c => c.id !== id));
      }
  };

  const handleAddSubcategory = (catId: string) => {
      if (!newSubName) return;
      onUpdate(categories.map(c => {
          if (c.id === catId) {
              return { ...c, subcategories: [...(c.subcategories || []), newSubName] };
          }
          return c;
      }));
      setNewSubName('');
  };

  const handleRemoveSubcategory = (catId: string, sub: string) => {
      onUpdate(categories.map(c => {
          if (c.id === catId) {
              return { ...c, subcategories: c.subcategories.filter(s => s !== sub) };
          }
          return c;
      }));
  };

  const incomeCats = categories.filter(c => c.type === 'INCOME');
  const expenseCats = categories.filter(c => c.type === 'EXPENSE');

  const bgClass = darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200 shadow-sm';
  const textClass = darkMode ? 'text-white' : 'text-gray-800';
  const subTextClass = darkMode ? 'text-gray-400' : 'text-gray-600';

  return (
    <div className="space-y-6">
       <div>
           <h1 className={`text-3xl font-bold mb-2 ${textClass}`}>Categorias & Subcategorias</h1>
           <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Organize suas transações com detalhes</p>
       </div>

       {/* Add Form */}
       <div className={`${bgClass} border p-4 rounded-xl flex flex-col md:flex-row gap-4 items-end`}>
           <div className="flex-1 w-full">
               <label className={`text-xs mb-1 block ${subTextClass} font-bold`}>Nome da Categoria</label>
               <input 
                 className={`w-full border rounded p-2 ${darkMode ? 'bg-black border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                 placeholder="Ex: Alimentação"
                 value={newCatName}
                 onChange={e => setNewCatName(e.target.value)}
               />
           </div>
           <div className="w-full md:w-auto">
                <label className={`text-xs mb-1 block ${subTextClass} font-bold`}>Tipo</label>
                <div className={`flex rounded p-1 border ${darkMode ? 'bg-black border-slate-700' : 'bg-gray-100 border-gray-200'}`}>
                    <button 
                        onClick={() => setNewCatType('INCOME')}
                        className={`px-3 py-1 text-sm rounded ${newCatType === 'INCOME' ? 'bg-emerald-600 text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}
                    >Entrada</button>
                    <button 
                        onClick={() => setNewCatType('EXPENSE')}
                        className={`px-3 py-1 text-sm rounded ${newCatType === 'EXPENSE' ? 'bg-red-600 text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}
                    >Saída</button>
                </div>
           </div>
           <button onClick={handleAdd} className="bg-blue-600 text-white p-2 rounded h-10 w-full md:w-10 flex items-center justify-center hover:bg-blue-700 shadow-md">
               <Plus size={20} />
           </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* INCOME */}
           <div className={`rounded-xl p-6 border ${darkMode ? 'bg-gradient-to-br from-emerald-900/20 to-black border-emerald-500/20' : 'bg-white border-emerald-100 shadow-md'}`}>
               <h2 className="text-xl font-bold text-emerald-500 mb-4 flex items-center gap-2"><Tag size={20}/> Entradas</h2>
               <div className="space-y-3">
                   {incomeCats.map(c => (
                       <div key={c.id} className={`rounded border overflow-hidden ${darkMode ? 'bg-slate-900/50 border-emerald-500/10' : 'bg-emerald-50 border-emerald-200'}`}>
                           <div className="flex justify-between items-center p-3">
                               <span className={`${textClass} font-medium`}>{c.name}</span>
                               <div className="flex gap-2">
                                   <button 
                                     onClick={() => setExpandedCatId(expandedCatId === c.id ? null : c.id)}
                                     className={`text-xs px-2 py-1 rounded border ${darkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-emerald-300 hover:bg-emerald-200'} transition-colors`}
                                   >
                                       {expandedCatId === c.id ? 'Fechar' : 'Subcategorias'}
                                   </button>
                                   <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                               </div>
                           </div>
                           
                           {/* Subcategories Panel */}
                           {expandedCatId === c.id && (
                               <div className={`p-3 border-t text-sm ${darkMode ? 'bg-black/30 border-slate-700' : 'bg-white/50 border-emerald-200'}`}>
                                   <div className="flex flex-wrap gap-2 mb-3">
                                       {c.subcategories?.map(sub => (
                                           <span key={sub} className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-white border border-gray-200 text-gray-700'}`}>
                                               {sub}
                                               <button onClick={() => handleRemoveSubcategory(c.id, sub)} className="hover:text-red-500"><X size={12}/></button>
                                           </span>
                                       ))}
                                   </div>
                                   <div className="flex gap-2">
                                       <input 
                                         className={`flex-1 text-xs p-1 rounded border ${darkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                                         placeholder="Nova subcategoria..."
                                         value={newSubName}
                                         onChange={e => setNewSubName(e.target.value)}
                                       />
                                       <button onClick={() => handleAddSubcategory(c.id)} className="bg-emerald-600 text-white px-2 rounded text-xs"><Plus size={14}/></button>
                                   </div>
                               </div>
                           )}
                       </div>
                   ))}
                   {incomeCats.length === 0 && <p className="text-gray-500 italic text-sm">Nenhuma categoria.</p>}
               </div>
           </div>

           {/* EXPENSE */}
           <div className={`rounded-xl p-6 border ${darkMode ? 'bg-gradient-to-br from-red-900/20 to-black border-red-500/20' : 'bg-white border-red-100 shadow-md'}`}>
               <h2 className="text-xl font-bold text-red-500 mb-4 flex items-center gap-2"><Tag size={20}/> Saídas</h2>
               <div className="space-y-3">
                   {expenseCats.map(c => (
                       <div key={c.id} className={`rounded border overflow-hidden ${darkMode ? 'bg-slate-900/50 border-red-500/10' : 'bg-red-50 border-red-200'}`}>
                           <div className="flex justify-between items-center p-3">
                               <span className={`${textClass} font-medium`}>{c.name}</span>
                               <div className="flex gap-2">
                                   <button 
                                     onClick={() => setExpandedCatId(expandedCatId === c.id ? null : c.id)}
                                     className={`text-xs px-2 py-1 rounded border ${darkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-red-300 hover:bg-red-200'} transition-colors`}
                                   >
                                       {expandedCatId === c.id ? 'Fechar' : 'Subcategorias'}
                                   </button>
                                   <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                               </div>
                           </div>

                           {/* Subcategories Panel */}
                           {expandedCatId === c.id && (
                               <div className={`p-3 border-t text-sm ${darkMode ? 'bg-black/30 border-slate-700' : 'bg-white/50 border-red-200'}`}>
                                   <div className="flex flex-wrap gap-2 mb-3">
                                       {c.subcategories?.map(sub => (
                                           <span key={sub} className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-white border border-gray-200 text-gray-700'}`}>
                                               {sub}
                                               <button onClick={() => handleRemoveSubcategory(c.id, sub)} className="hover:text-red-500"><X size={12}/></button>
                                           </span>
                                       ))}
                                   </div>
                                   <div className="flex gap-2">
                                       <input 
                                         className={`flex-1 text-xs p-1 rounded border ${darkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                                         placeholder="Nova subcategoria..."
                                         value={newSubName}
                                         onChange={e => setNewSubName(e.target.value)}
                                       />
                                       <button onClick={() => handleAddSubcategory(c.id)} className="bg-red-600 text-white px-2 rounded text-xs"><Plus size={14}/></button>
                                   </div>
                               </div>
                           )}
                       </div>
                   ))}
                    {expenseCats.length === 0 && <p className="text-gray-500 italic text-sm">Nenhuma categoria.</p>}
               </div>
           </div>
       </div>
    </div>
  );
};

export default FinanceCategories;