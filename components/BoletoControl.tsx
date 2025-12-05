import React, { useState } from 'react';
import { Sale, ProductType, SaleFormData } from '../types';
import { CheckCircle, Clock, Truck, Send, Search, FileText } from 'lucide-react';

interface BoletoControlProps {
  sales: Sale[];
  onUpdateSale: (data: SaleFormData) => void;
}

const BoletoControl: React.FC<BoletoControlProps> = ({ sales, onUpdateSale }) => {
  const [filterType, setFilterType] = useState<'ALL' | ProductType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'SENT' | 'PAID'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSales = sales.filter(sale => {
    if (filterType !== 'ALL' && sale.type !== filterType) return false;
    if (statusFilter !== 'ALL' && (sale.boletoStatus || 'PENDING') !== statusFilter) return false;
    if (searchTerm && !(sale.client || '').toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleStatusChange = (sale: Sale, newStatus: 'PENDING' | 'SENT' | 'PAID') => {
    const formData: SaleFormData = {
      client: sale.client,
      quantity: sale.quantity,
      type: sale.type,
      valueProposed: sale.valueProposed,
      valueSold: sale.valueSold,
      date: sale.date,
      observations: sale.observations || '',
      quoteNumber: sale.quoteNumber,
      completionDate: sale.completionDate,
      trackingCode: sale.trackingCode,
      boletoStatus: newStatus,
      marginPercent: sale.marginPercent
    };
    onUpdateSale(formData);
  };

  const updateTracking = (sale: Sale, code: string) => {
     const formData: SaleFormData = {
      client: sale.client,
      quantity: sale.quantity,
      type: sale.type,
      valueProposed: sale.valueProposed,
      valueSold: sale.valueSold,
      date: sale.date,
      observations: sale.observations || '',
      quoteNumber: sale.quoteNumber,
      completionDate: sale.completionDate,
      trackingCode: code,
      boletoStatus: sale.boletoStatus,
      marginPercent: sale.marginPercent
    };
    onUpdateSale(formData);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center">
        <FileText className="mr-2 text-emerald-600" />
        Controle de Boletos
      </h1>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="w-full md:flex-1 min-w-[200px]">
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Buscar cliente..." 
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            </div>
        </div>
        
        <div className="flex w-full md:w-auto gap-2">
            <select 
                className="flex-1 border border-gray-300 rounded-lg p-2 text-sm bg-white text-gray-900"
                value={filterType}
                onChange={e => setFilterType(e.target.value as any)}
            >
                <option value="ALL">Todos os Tipos</option>
                <option value={ProductType.BASICA}>Cesta Básica</option>
                <option value={ProductType.NATAL}>Cesta de Natal</option>
            </select>

            <select 
                className="flex-1 border border-gray-300 rounded-lg p-2 text-sm bg-white text-gray-900"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
            >
                <option value="ALL">Todos os Status</option>
                <option value="PENDING">Pendente</option>
                <option value="SENT">Enviado</option>
                <option value="PAID">Pago</option>
            </select>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredSales.map(sale => (
          <div key={sale.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${sale.type === ProductType.BASICA ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {sale.type === ProductType.BASICA ? 'Básica' : 'Natal'}
                    </span>
                    <span className="text-xs text-gray-500">{sale.date ? new Date(sale.date).toLocaleDateString('pt-BR') : 'Pendente'}</span>
                  </div>
                  <h3 className="font-bold text-gray-900">{sale.client || 'Cliente sem nome'}</h3>
                  <p className="text-sm text-gray-500">Valor: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.valueSold * sale.quantity)}</p>
                </div>
                <div className="w-full md:w-auto">
                   <label className="text-xs text-gray-500 block mb-1">Código de Rastreio</label>
                   <div className="flex gap-2">
                     <input 
                        type="text" 
                        className="flex-1 bg-gray-50 border border-gray-300 rounded px-2 py-1 text-sm"
                        placeholder="Cole o código..."
                        value={sale.trackingCode || ''}
                        onChange={(e) => updateTracking(sale, e.target.value)}
                     />
                     {sale.trackingCode && (
                       <a 
                        href={`https://www.google.com/search?q=${sale.trackingCode}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                        title="Rastrear"
                       >
                         <Truck size={16} />
                       </a>
                     )}
                   </div>
                </div>
            </div>

            <div className="flex items-center gap-2 justify-center border-t border-gray-100 pt-3">
                <button 
                  onClick={() => handleStatusChange(sale, 'PENDING')}
                  className={`p-2 rounded-lg flex flex-col items-center gap-1 w-20 transition-colors ${!sale.boletoStatus || sale.boletoStatus === 'PENDING' ? 'bg-gray-200 text-gray-800 ring-2 ring-gray-400' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                >
                   <Clock size={18} />
                   <span className="text-[10px] font-bold">Pendente</span>
                </button>
                <ArrowRight size={16} className="text-gray-300" />
                <button 
                  onClick={() => handleStatusChange(sale, 'SENT')}
                  className={`p-2 rounded-lg flex flex-col items-center gap-1 w-20 transition-colors ${sale.boletoStatus === 'SENT' ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-400' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                >
                   <Send size={18} />
                   <span className="text-[10px] font-bold">Enviado</span>
                </button>
                <ArrowRight size={16} className="text-gray-300" />
                <button 
                  onClick={() => handleStatusChange(sale, 'PAID')}
                  className={`p-2 rounded-lg flex flex-col items-center gap-1 w-20 transition-colors ${sale.boletoStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-400' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                >
                   <CheckCircle size={18} />
                   <span className="text-[10px] font-bold">Pago</span>
                </button>
            </div>
          </div>
        ))}
        {filteredSales.length === 0 && <p className="text-center text-gray-400 py-8">Nenhum registro encontrado.</p>}
      </div>
    </div>
  );
};

const ArrowRight = ({ size, className }: { size: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);

export default BoletoControl;