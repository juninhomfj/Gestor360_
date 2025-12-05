import React, { useState } from 'react';
import { Receivable, Sale, FinanceAccount, CommissionDeduction } from '../types';
import { Plus, CheckCircle, Clock, Trash2, Download, AlertTriangle, Edit2, X, DollarSign } from 'lucide-react';
import ImportCommissionsModal from './ImportCommissionsModal';

interface FinanceReceivablesProps {
  receivables: Receivable[]; 
  onUpdate: (items: Receivable[]) => void; 
  sales?: Sale[];
  accounts?: FinanceAccount[];
  darkMode?: boolean;
}

const FinanceReceivables: React.FC<FinanceReceivablesProps> = ({ 
    receivables = [], onUpdate, sales = [], accounts = [], darkMode 
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  
  const [editingItem, setEditingItem] = useState<Receivable | null>(null);
  const [editDedDesc, setEditDedDesc] = useState('');
  const [editDedAmount, setEditDedAmount] = useState('');

  const [formData, setFormData] = useState({ description: '', value: '', date: '', status: 'PENDING' });

  const sortedReceivables = [...receivables].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSaveNew = () => {
      if (!formData.description || !formData.value) return;
      const newItem: Receivable = {
          id: crypto.randomUUID(),
          description: formData.description,
          value: parseFloat(formData.value),
          date: formData.date || new Date().toISOString().split('T')[0],
          status: formData.status as 'PENDING' | 'EFFECTIVE',
          distributed: false,
          deductions: [] 
      };
      onUpdate([...receivables, newItem]);
      setIsFormOpen(false);
      setFormData({ description: '', value: '', date: '', status: 'PENDING' });
  };

  const handleImport = (description: string, totalValue: number, deductions: CommissionDeduction[]) => {
      const dateStr = new Date().toISOString().split('T')[0];
      if (totalValue > 0) {
          const newRec: Receivable = {
              id: crypto.randomUUID(),
              description: description,
              value: totalValue,
              date: dateStr,
              status: 'PENDING',
              distributed: false,
              deductions: deductions 
          };
          onUpdate([...receivables, newRec]);
      }
  };

  const handleDelete = (id: string) => {
      if(confirm('Excluir este recebível?')) {
          onUpdate(receivables.filter(r => r.id !== id));
      }
  };

  const openEditModal = (item: Receivable) => {
      setEditingItem({ ...item, deductions: [...(item.deductions || [])] });
      setEditDedDesc('');
      setEditDedAmount('');
  };

  const handleAddDeductionToEdit = () => {
      if (!editingItem || !editDedDesc || !editDedAmount) return;
      const val = parseFloat(editDedAmount);
      if (val <= 0) return;
      const newDed: CommissionDeduction = { id: crypto.randomUUID(), description: editDedDesc, amount: val };
      setEditingItem({ ...editingItem, deductions: [...(editingItem.deductions || []), newDed] });
      setEditDedDesc('');
      setEditDedAmount('');
  };

  const handleRemoveDeductionFromEdit = (dedId: string) => {
      if (!editingItem) return;
      setEditingItem({ ...editingItem, deductions: editingItem.deductions?.filter(d => d.id !== dedId) || [] });
  };

  const handleSaveEdit = () => {
      if (!editingItem) return;
      onUpdate(receivables.map(r => r.id === editingItem.id ? editingItem : r));
      setEditingItem(null);
  };

  const calculateNet = (r: Receivable) => (r.value - (r.deductions?.reduce((acc, d) => acc + d.amount, 0) || 0));
  const totalPending = receivables.filter(r => r.status === 'PENDING').reduce((acc, r) => acc + calculateNet(r), 0);
  const totalEffective = receivables.filter(r => r.status === 'EFFECTIVE' && !r.distributed).reduce((acc, r) => acc + calculateNet(r), 0);

  const cardClass = darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-800';
  const inputClass = darkMode ? 'bg-black border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>A Receber (Master)</h1>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Gerencie comissões brutas e descontos.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <button onClick={() => setIsImportOpen(true)} className="flex-1 md:flex-none bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center justify-center shadow-lg text-sm font-bold">
                <Download size={18} className="mr-2"/> Importar
            </button>
            <button onClick={() => setIsFormOpen(true)} className="flex-1 md:flex-none bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center shadow-lg text-sm font-bold">
                <Plus size={18} className="mr-2"/> Novo
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-yellow-900/50' : 'bg-yellow-50 border-yellow-100'}`}>
              <div className="flex items-center gap-3 mb-2">
                  <Clock className="text-yellow-500" />
                  <span className={`font-bold ${darkMode ? 'text-yellow-500' : 'text-yellow-700'}`}>Pendente (Líquido)</span>
              </div>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>R$ {totalPending.toFixed(2)}</p>
          </div>
          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-emerald-900/50' : 'bg-emerald-50 border-emerald-100'}`}>
              <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="text-emerald-500" />
                  <span className={`font-bold ${darkMode ? 'text-emerald-500' : 'text-emerald-700'}`}>Disponível p/ Distribuir</span>
              </div>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>R$ {totalEffective.toFixed(2)}</p>
          </div>
      </div>

      {isFormOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className={`rounded-xl p-6 w-full max-w-md ${cardClass}`}>
                  <h3 className="text-xl font-bold mb-4">Novo Recebível Manual</h3>
                  <div className="space-y-4">
                      <input className={`w-full p-2 rounded border ${inputClass}`} placeholder="Descrição" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                      <input type="number" className={`w-full p-2 rounded border ${inputClass}`} placeholder="Valor Bruto (R$)" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} />
                      <input type="date" className={`w-full p-2 rounded border ${inputClass}`} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                      <div className="flex justify-end gap-2">
                          <button onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-gray-500">Cancelar</button>
                          <button onClick={handleSaveNew} className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {editingItem && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className={`rounded-xl w-full max-w-lg flex flex-col max-h-[90vh] ${cardClass}`}>
                  <div className={`p-5 border-b flex justify-between items-center ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                      <h3 className="text-xl font-bold flex items-center gap-2"><Edit2 size={20} className="text-blue-500"/> Gerenciar Recebimento</h3>
                      <button onClick={() => setEditingItem(null)}><X size={20} className="text-gray-400"/></button>
                  </div>
                  <div className="p-6 overflow-y-auto space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-bold mb-1 block opacity-70">Valor Bruto</label>
                              <div className={`flex items-center px-3 py-2 rounded border ${inputClass}`}>
                                  <span className="mr-2 opacity-50">R$</span>
                                  <input type="number" className="bg-transparent outline-none w-full font-bold" value={editingItem.value} onChange={e => setEditingItem({...editingItem, value: parseFloat(e.target.value) || 0})} />
                              </div>
                          </div>
                          <div>
                              <label className="text-xs font-bold mb-1 block opacity-70">Data</label>
                              <input type="date" className={`w-full px-3 py-2 rounded border ${inputClass}`} value={editingItem.date} onChange={e => setEditingItem({...editingItem, date: e.target.value})} />
                          </div>
                          <div className="col-span-2">
                              <label className="text-xs font-bold mb-1 block opacity-70">Descrição</label>
                              <input type="text" className={`w-full px-3 py-2 rounded border ${inputClass}`} value={editingItem.description} onChange={e => setEditingItem({...editingItem, description: e.target.value})} />
                          </div>
                      </div>
                      <div className={`p-4 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                          <h4 className="text-sm font-bold mb-3 flex items-center gap-2"><AlertTriangle size={16} className="text-red-500" /> Descontos na Fonte / Taxas</h4>
                          <div className="flex gap-2 mb-3">
                              <input placeholder="Descrição (Ex: Imposto)" className={`flex-1 px-2 py-1 text-sm rounded border ${inputClass}`} value={editDedDesc} onChange={e => setEditDedDesc(e.target.value)} />
                              <input type="number" placeholder="R$" className={`w-24 px-2 py-1 text-sm rounded border ${inputClass}`} value={editDedAmount} onChange={e => setEditDedAmount(e.target.value)} />
                              <button onClick={handleAddDeductionToEdit} className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600"><Plus size={16} /></button>
                          </div>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                              {editingItem.deductions?.map(d => (
                                  <div key={d.id} className={`flex justify-between items-center text-sm p-2 rounded ${darkMode ? 'bg-slate-800' : 'bg-white border'}`}>
                                      <span>{d.description}</span>
                                      <div className="flex items-center gap-2">
                                          <span className="text-red-500 font-medium">- R$ {d.amount.toFixed(2)}</span>
                                          <button onClick={() => handleRemoveDeductionFromEdit(d.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                                      </div>
                                  </div>
                              ))}
                              {(!editingItem.deductions || editingItem.deductions.length === 0) && (<p className="text-xs text-gray-500 text-center">Nenhum desconto aplicado.</p>)}
                          </div>
                      </div>
                      <div className={`p-4 rounded-lg flex justify-between items-center ${darkMode ? 'bg-black border border-slate-800' : 'bg-blue-50 border border-blue-100'}`}>
                          <div>
                              <p className="text-xs opacity-70">Líquido Final</p>
                              <p className="text-2xl font-bold text-emerald-500">R$ {calculateNet(editingItem).toFixed(2)}</p>
                          </div>
                          <div>
                              <label className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg transition-colors ${editingItem.status === 'EFFECTIVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-600 hover:bg-gray-700'}`}>
                                  <input type="checkbox" className="w-5 h-5 rounded" checked={editingItem.status === 'EFFECTIVE'} onChange={e => setEditingItem({...editingItem!, status: e.target.checked ? 'EFFECTIVE' : 'PENDING'})} />
                                  <span className="text-white font-bold text-sm">EFETIVADO</span>
                              </label>
                          </div>
                      </div>
                  </div>
                  <div className={`p-5 border-t flex justify-end gap-3 ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                      <button onClick={() => setEditingItem(null)} className="px-4 py-2 text-gray-500 hover:text-gray-700">Cancelar</button>
                      <button onClick={handleSaveEdit} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow hover:bg-blue-700">Salvar Alterações</button>
                  </div>
              </div>
          </div>
      )}

      {/* LIST */}
      <div className={`rounded-xl border overflow-hidden ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-sm">
                <thead className={darkMode ? 'bg-slate-900 text-gray-400' : 'bg-gray-50 text-gray-600'}>
                    <tr>
                        <th className="px-4 py-3 text-left">Data/Desc</th>
                        <th className="px-4 py-3 text-right">Bruto</th>
                        <th className="px-4 py-3 text-right">Desc.</th>
                        <th className="px-4 py-3 text-right">Líquido</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-gray-100'}`}>
                    {sortedReceivables.map(r => {
                        const net = calculateNet(r);
                        return (
                            <tr key={r.id} className={darkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-50'}>
                                <td className={`px-4 py-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    <div className="font-medium text-sm">{r.description}</div>
                                    <div className="text-xs opacity-70">{new Date(r.date).toLocaleDateString('pt-BR')}</div>
                                </td>
                                <td className={`px-4 py-3 text-right ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>R$ {r.value.toFixed(2)}</td>
                                <td className="px-4 py-3 text-right text-red-400">-{ (r.value - net).toFixed(2) }</td>
                                <td className="px-4 py-3 text-right font-bold text-emerald-500">R$ {net.toFixed(2)}</td>
                                <td className="px-4 py-3 text-center">{r.distributed ? (<span className="px-2 py-1 rounded text-[10px] bg-purple-100 text-purple-700">Distribuído</span>) : (<button onClick={() => openEditModal(r)} className={`px-2 py-1 rounded text-[10px] font-bold border ${r.status === 'EFFECTIVE' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>{r.status === 'EFFECTIVE' ? 'Efetivado' : 'Pendente'}</button>)}</td>
                                <td className="px-4 py-3 text-center flex justify-center gap-2"><button onClick={() => openEditModal(r)} className="text-blue-400 hover:text-blue-500" title="Editar / Efetivar"><Edit2 size={16} /></button><button onClick={() => handleDelete(r.id)} className="text-gray-400 hover:text-red-500" title="Excluir"><Trash2 size={16} /></button></td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
          </div>
          {/* MOBILE CARDS */}
          <div className="md:hidden p-3 space-y-3">
              {sortedReceivables.map(r => {
                  const net = calculateNet(r);
                  return (
                      <div key={r.id} className={`p-3 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                          <div className="flex justify-between items-start">
                              <div>
                                  <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{r.description}</p>
                                  <p className="text-xs text-gray-500">{new Date(r.date).toLocaleDateString('pt-BR')}</p>
                              </div>
                              <div className="text-right">
                                  <p className="font-bold text-lg text-emerald-500">R$ {net.toFixed(2)}</p>
                                  <p className="text-xs text-gray-500">Líquido</p>
                              </div>
                          </div>
                          <div className={`mt-2 pt-2 border-t flex justify-between items-center ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                              <div>{r.distributed ? (<span className="px-2 py-1 rounded text-[10px] bg-purple-100 text-purple-700">Distribuído</span>) : (<button onClick={() => openEditModal(r)} className={`px-2 py-1 rounded text-[10px] font-bold border ${r.status === 'EFFECTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.status === 'EFFECTIVE' ? 'Efetivado' : 'Pendente'}</button>)}</div>
                              <div className="flex gap-2"><button onClick={() => openEditModal(r)} className="text-blue-500"><Edit2 size={16}/></button><button onClick={() => handleDelete(r.id)} className="text-red-500"><Trash2 size={16}/></button></div>
                          </div>
                      </div>
                  )
              })}
          </div>

        {sortedReceivables.length === 0 && (
            <p className="text-center py-8 text-gray-500">Nenhum recebível cadastrado.</p>
        )}
      </div>

      <ImportCommissionsModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} sales={sales} onImport={handleImport} darkMode={darkMode} />
    </div>
  );
};

export default FinanceReceivables;