import React, { useState, useEffect } from 'react';
import { Sale, ProductType } from '../types';
import { Edit2, Plus, Download, Upload, Trash2, History, Settings, Filter, RotateCcw, Calendar, DollarSign, User, AlertTriangle, Clock, CheckCircle, X, CalendarCheck } from 'lucide-react';

interface SalesListProps {
  sales: Sale[];
  onEdit: (sale: Sale) => void;
  onDelete: (sale: Sale) => void;
  onNew: () => void;
  onExportTemplate: () => void;
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearAll: () => void;
  onRestore: () => void;
  onOpenBulkAdvanced: () => void;
  onUndo: () => void;
  // New Props for Single/Bulk Billing
  onBillSale: (sale: Sale, date: string) => void;
  onBillBulk: (ids: string[], date: string) => void;
  onDeleteBulk: (ids: string[]) => void;
  
  hasUndo: boolean;
  onNotify?: (type: 'SUCCESS' | 'ERROR', msg: string) => void;
}

const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const SalesList: React.FC<SalesListProps> = ({ 
    sales, 
    onEdit,
    onDelete,
    onNew, 
    onExportTemplate, 
    onImportFile, 
    onClearAll, 
    onRestore, 
    onOpenBulkAdvanced, 
    onUndo,
    onBillSale,
    onBillBulk,
    onDeleteBulk,
    hasUndo,
    onNotify
}) => {
  // Filters
  const [filterType, setFilterType] = useState<ProductType | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'BILLED'>('ALL');
  const [filterMonth, setFilterMonth] = useState<string>(''); 
  const [filterYear, setFilterYear] = useState<string>(''); 
  const [searchTerm, setSearchTerm] = useState('');

  // UI State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Billing Modal
  const [billingModal, setBillingModal] = useState<{ isOpen: boolean, ids: string[] }>({ isOpen: false, ids: [] });
  const [billingDate, setBillingDate] = useState(new Date().toISOString().split('T')[0]);

  // --- FILTER LOGIC ---
  const filteredSales = sales.filter(sale => {
    // 1. Search
    if (searchTerm && !sale.client.toLowerCase().includes(searchTerm.toLowerCase())) return false;

    // 2. Type
    if (filterType !== 'ALL' && sale.type !== filterType) return false;
    
    // 3. Status
    const isPending = !sale.date;
    if (filterStatus === 'PENDING' && !isPending) return false;
    if (filterStatus === 'BILLED' && isPending) return false;

    // 4. Date Filters
    if (filterMonth) {
        if (isPending) {
             const compDate = sale.completionDate;
             if (!compDate || !compDate.startsWith(filterMonth)) return false;
        } else {
             if (!sale.date.startsWith(filterMonth)) return false;
        }
    }

    if (filterYear && sale.type === ProductType.NATAL) {
      const d = sale.date || sale.completionDate;
      if (!d || d.split('-')[0] !== filterYear) return false;
    }

    return true;
  }).sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return -1; 
      if (!b.date) return 1; 
      return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // --- SELECTION HANDLERS ---
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
          setSelectedIds(filteredSales.map(s => s.id));
      } else {
          setSelectedIds([]);
      }
  };

  const handleSelectOne = (id: string) => {
      setSelectedIds(prev => 
          prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
  };

  // --- BILLING ACTIONS ---
  const openBillModal = (ids: string[]) => {
      setBillingModal({ isOpen: true, ids });
      setBillingDate(new Date().toISOString().split('T')[0]);
  };

  const confirmBilling = () => {
      if (!billingDate) {
          if(onNotify) onNotify('ERROR', 'Selecione uma data.');
          return;
      }
      
      if (billingModal.ids.length === 1) {
          const sale = sales.find(s => s.id === billingModal.ids[0]);
          if (sale) onBillSale(sale, billingDate);
      } else {
          onBillBulk(billingModal.ids, billingDate);
      }
      
      setBillingModal({ isOpen: false, ids: [] });
      setSelectedIds([]); 
  };

  const handleBulkDelete = () => {
      if (confirm(`Excluir ${selectedIds.length} vendas selecionadas?`)) {
          onDeleteBulk(selectedIds);
          setSelectedIds([]);
      }
  };

  // Totals
  const totalBase = filteredSales.reduce((acc, s) => acc + s.commissionBaseTotal, 0);
  const totalCommission = filteredSales.reduce((acc, s) => acc + s.commissionValueTotal, 0);

  return (
    <div className="space-y-6 relative">
      
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Relatório de Vendas</h1>
        
        <div className="flex gap-2 flex-wrap items-center w-full md:w-auto">
            <button 
                onClick={onExportTemplate}
                className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center shadow-sm text-sm"
                title="Modelo CSV"
            >
                <Download size={18} className="mr-2" /> <span className="hidden md:inline">Modelo</span>
            </button>
            
            <label className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center shadow-sm text-sm cursor-pointer">
                <Upload size={18} className="mr-2" /> <span className="hidden md:inline">Importar</span>
                <input type="file" className="hidden" accept=".csv,.xlsx,.xls" onChange={onImportFile} />
            </label>

            <div className="relative">
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="bg-white border border-gray-300 text-gray-700 p-2 rounded-lg hover:bg-gray-50 flex items-center shadow-sm transition-colors"
                >
                    <Settings size={20} />
                </button>
                {isMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)}></div>
                        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
                            {hasUndo && (
                                <button onClick={() => { onUndo(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-amber-700 bg-amber-50 hover:bg-amber-100 flex items-center border-b border-gray-100">
                                    <RotateCcw size={16} className="mr-2" /> Desfazer Ação
                                </button>
                            )}
                            <button onClick={() => { onRestore(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                                <History size={16} className="mr-2 text-blue-500" /> Restaurar Backup
                            </button>
                            <button onClick={() => { onClearAll(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center border-t border-gray-100">
                                <Trash2 size={16} className="mr-2" /> Limpar Base
                            </button>
                        </div>
                    </>
                )}
            </div>

            <div className="w-px h-8 bg-gray-300 mx-2 hidden md:block"></div>

            <button onClick={onNew} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center shadow-sm text-sm font-medium">
                <Plus size={20} className="mr-2" /> Nova Venda
            </button>
        </div>
      </div>

      {/* FILTERS BAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-64">
             <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Busca</label>
             <input 
               type="text" 
               placeholder="Cliente..." 
               className="w-full border border-gray-300 rounded-md p-2 text-sm"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
          </div>
          
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Status</label>
                  <select className="w-full border border-gray-300 rounded-md p-2 text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
                      <option value="ALL">Todos</option>
                      <option value="PENDING">Pendentes</option>
                      <option value="BILLED">Faturados</option>
                  </select>
              </div>
              <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tipo</label>
                  <select className="w-full border border-gray-300 rounded-md p-2 text-sm" value={filterType} onChange={e => setFilterType(e.target.value as any)}>
                      <option value="ALL">Todos</option>
                      <option value={ProductType.BASICA}>Básica</option>
                      <option value={ProductType.NATAL}>Natal</option>
                  </select>
              </div>
              <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Mês</label>
                  <input type="month" className="w-full border border-gray-300 rounded-md p-2 text-sm" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}/>
              </div>
              <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Ano</label>
                  <input type="number" placeholder="202X" className="w-full border border-gray-300 rounded-md p-2 text-sm" value={filterYear} onChange={e => setFilterYear(e.target.value)}/>
              </div>
          </div>

          <button 
            onClick={() => { setFilterType('ALL'); setFilterStatus('ALL'); setFilterMonth(''); setFilterYear(''); setSearchTerm(''); }}
            className="text-sm text-gray-500 hover:text-blue-600 underline px-2"
          >
              Limpar
          </button>
      </div>

      {/* BULK ACTIONS BAR (Sticky) */}
      {selectedIds.length > 0 && (
          <div className="sticky top-2 z-30 bg-slate-800 text-white p-3 rounded-lg shadow-xl flex justify-between items-center animate-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                  <span className="bg-slate-700 px-2 py-1 rounded text-xs font-bold">{selectedIds.length} selecionados</span>
              </div>
              <div className="flex gap-2">
                  <button 
                    onClick={() => openBillModal(selectedIds)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-sm font-bold flex items-center gap-2 transition-colors"
                  >
                      <CheckCircle size={16} /> Faturar em Massa
                  </button>
                  <button 
                    onClick={handleBulkDelete}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-bold flex items-center gap-2 transition-colors"
                  >
                      <Trash2 size={16} /> Excluir
                  </button>
                  <button onClick={() => setSelectedIds([])} className="text-slate-400 hover:text-white p-1"><X size={20}/></button>
              </div>
          </div>
      )}

      {/* SALES TABLE */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-10 p-4">
                    <input 
                        type="checkbox" 
                        className="rounded border-gray-300 w-4 h-4 cursor-pointer"
                        onChange={handleSelectAll}
                        checked={filteredSales.length > 0 && selectedIds.length === filteredSales.length}
                    />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status/Data</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Cliente</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Tipo</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Base</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Margem</th>
                <th className="px-4 py-3 text-right font-semibold text-emerald-700">Comissão</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(sale.id) ? 'bg-blue-50' : ''}`}>
                  <td className="p-4 text-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 w-4 h-4 cursor-pointer"
                        checked={selectedIds.includes(sale.id)}
                        onChange={() => handleSelectOne(sale.id)}
                      />
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-sm">
                    {sale.date ? (
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-800">{new Date(sale.date).toLocaleDateString('pt-BR')}</span>
                            <span className="text-[10px] text-green-600 font-bold">FATURADO</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-orange-500 font-bold text-xs bg-orange-50 px-2 py-1 rounded-full w-fit">
                            <Clock size={12}/> Pendente
                        </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-medium">{sale.client}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${sale.type === ProductType.BASICA ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100'}`}>
                      {sale.type === ProductType.BASICA ? 'Básica' : 'Natal'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600 font-mono">{formatCurrency(sale.commissionBaseTotal)}</td>
                  <td className="px-4 py-3 text-center font-mono">
                    <span className={sale.marginPercent < 0 ? 'text-red-500 font-bold' : 'text-gray-700'}>{sale.marginPercent.toFixed(2)}%</span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-700 font-mono">{formatCurrency(sale.commissionValueTotal)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                        {!sale.date && (
                            <button 
                                onClick={() => openBillModal([sale.id])}
                                className="flex items-center gap-1 text-white bg-emerald-500 hover:bg-emerald-600 px-2 py-1 rounded-md text-xs font-bold transition-colors shadow-sm"
                                title="Faturar Venda"
                            >
                                <CalendarCheck size={14} /> Faturar
                            </button>
                        )}
                        <button 
                            onClick={() => onEdit(sale)} 
                            className="text-amber-500 hover:text-amber-600 p-1.5 rounded hover:bg-amber-50 transition-colors" 
                            title="Editar"
                        >
                            <Edit2 size={16}/>
                        </button>
                        <button 
                            onClick={() => onDelete(sale)} 
                            className="text-red-500 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors" 
                            title="Excluir"
                        >
                            <Trash2 size={16}/>
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && <tr><td colSpan={8} className="py-12 text-center text-gray-400">Nenhuma venda encontrada.</td></tr>}
            </tbody>
            <tfoot className="bg-gray-100 border-t border-gray-200">
                <tr className="font-bold text-gray-800">
                    <td colSpan={5} className="px-4 py-4 text-right">TOTAIS</td>
                    <td className="px-4 py-4 text-right font-mono">{formatCurrency(totalBase)}</td>
                    <td className="px-4 py-4 text-right text-emerald-700 text-lg font-mono">{formatCurrency(totalCommission)}</td>
                    <td></td>
                </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* MOBILE CARDS */}
      <div className="md:hidden space-y-3">
          {filteredSales.map((sale) => (
              <div key={sale.id} className={`bg-white rounded-xl shadow-sm border p-4 relative ${selectedIds.includes(sale.id) ? 'border-blue-400 ring-1 ring-blue-400 bg-blue-50' : 'border-gray-200'}`}>
                  <div className="absolute top-4 left-4">
                      <input type="checkbox" className="w-5 h-5 rounded border-gray-300" checked={selectedIds.includes(sale.id)} onChange={() => handleSelectOne(sale.id)} />
                  </div>
                  <div className="pl-8">
                      <div className="flex justify-between items-start mb-2">
                          <div>
                              <h3 className="font-bold text-gray-900 text-sm">{sale.client}</h3>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                  {sale.date ? (
                                      <span className="text-green-600 font-bold">{new Date(sale.date).toLocaleDateString('pt-BR')}</span>
                                  ) : (
                                      <span className="text-orange-500 font-bold">Pendente</span>
                                  )}
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${sale.type === ProductType.BASICA ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100'}`}>
                                      {sale.type === ProductType.BASICA ? 'Básica' : 'Natal'}
                                  </span>
                              </div>
                          </div>
                          <div className="text-right">
                              <p className="text-lg font-bold text-emerald-700">{formatCurrency(sale.commissionValueTotal)}</p>
                          </div>
                      </div>
                      <div className="flex justify-end gap-3 border-t pt-2 mt-2">
                           {!sale.date && (
                                <button 
                                    onClick={() => openBillModal([sale.id])} 
                                    className="text-emerald-600 font-bold text-xs flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded border border-emerald-200"
                                >
                                    <CalendarCheck size={14} /> Faturar
                                </button>
                            )}
                           <button 
                                onClick={() => onEdit(sale)} 
                                className="text-amber-500 text-xs font-bold flex items-center gap-1 bg-amber-50 px-2 py-1 rounded border border-amber-200"
                           >
                                <Edit2 size={14}/> Editar
                           </button>
                           <button 
                                onClick={() => onDelete(sale)} 
                                className="text-red-500 text-xs font-bold flex items-center gap-1 bg-red-50 px-2 py-1 rounded border border-red-200"
                           >
                                <Trash2 size={14}/> Excluir
                           </button>
                      </div>
                  </div>
              </div>
          ))}
      </div>

      {/* BILLING DATE MODAL */}
      {billingModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
                  <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                      <h3 className="font-bold text-gray-800">Confirmar Faturamento</h3>
                      <button onClick={() => setBillingModal({ isOpen: false, ids: [] })}><X size={20} className="text-gray-400"/></button>
                  </div>
                  <div className="p-6">
                      <p className="text-sm text-gray-600 mb-4">
                          Defina a data de faturamento para <strong>{billingModal.ids.length}</strong> venda(s).
                      </p>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Data de Faturamento</label>
                      <input 
                        type="date" 
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={billingDate}
                        onChange={e => setBillingDate(e.target.value)}
                      />
                      <div className="flex gap-3 mt-6">
                          <button onClick={() => setBillingModal({ isOpen: false, ids: [] })} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-600 font-bold text-sm hover:bg-gray-50">Cancelar</button>
                          <button onClick={confirmBilling} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 shadow-md">Confirmar</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default SalesList;