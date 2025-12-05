import React, { useMemo, useState } from 'react';
import { Sale, ClientMetric, ProductType, ReportConfig } from '../types';
import { analyzeClients } from '../services/logic';
import { AlertTriangle, CheckCircle, Clock, UserPlus, Search, Download, Settings } from 'lucide-react';

interface ClientReportsProps {
  sales: Sale[];
  config: ReportConfig;
  onOpenSettings: () => void;
}

const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const ClientReports: React.FC<ClientReportsProps> = ({ sales, config, onOpenSettings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'NEW' | 'INACTIVE' | 'LOST'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | ProductType>('ALL');

  const metrics = useMemo(() => analyzeClients(sales, config), [sales, config]);

  const filteredMetrics = metrics.filter(m => {
    if (searchTerm && !m.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (statusFilter !== 'ALL' && m.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && !m.typesBought.includes(typeFilter)) return false;
    return true;
  });

  const totalClients = metrics.length;
  const lostClients = metrics.filter(m => m.status === 'LOST').length;
  const newClients = metrics.filter(m => m.status === 'NEW').length;
  const activeClients = metrics.filter(m => m.status === 'ACTIVE').length;
  const inactiveClients = metrics.filter(m => m.status === 'INACTIVE').length;


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Inteligência de Clientes (CRM)</h1>
          <button 
            onClick={onOpenSettings}
            className="text-gray-500 hover:text-emerald-600 p-2 rounded-lg border border-gray-200 bg-white shadow-sm transition-colors"
            title="Configurações de Relatório"
          >
            <Settings size={20} />
          </button>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center md:justify-between text-center md:text-left">
            <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Total</p>
                <p className="text-2xl font-bold text-gray-800">{totalClients}</p>
            </div>
            <div className="bg-blue-50 p-2 rounded-lg text-blue-600 mt-2 md:mt-0"><Search size={20}/></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center md:justify-between text-center md:text-left">
            <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Ativos</p>
                <p className="text-2xl font-bold text-emerald-600">{activeClients}</p>
            </div>
            <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600 mt-2 md:mt-0"><CheckCircle size={20}/></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center md:justify-between text-center md:text-left">
            <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Novos</p>
                <p className="text-2xl font-bold text-indigo-600">{newClients}</p>
            </div>
            <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600 mt-2 md:mt-0"><UserPlus size={20}/></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100 flex flex-col md:flex-row items-center md:justify-between text-center md:text-left">
            <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Risco</p>
                <p className="text-2xl font-bold text-red-600">{inactiveClients + lostClients}</p>
            </div>
            <div className="bg-red-50 p-2 rounded-lg text-red-600 mt-2 md:mt-0"><AlertTriangle size={20}/></div>
        </div>
      </div>

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
                className="flex-1 md:flex-none border border-gray-300 rounded-lg p-2 text-sm bg-white text-gray-900"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
            >
                <option value="ALL">Status: Todos</option>
                <option value="ACTIVE">Ativos</option>
                <option value="NEW">Novos</option>
                <option value="INACTIVE">Em Alerta</option>
                <option value="LOST">Inativos</option>
            </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* DESKTOP TABLE */}
        <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Cliente</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-600">Status</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-600">Última Compra</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-600">Dias sem Comprar</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-600">Total Gasto</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredMetrics.map((client) => (
                        <tr key={client.name} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">{client.name}</td>
                            <td className="px-4 py-3 text-center">
                                {client.status === 'ACTIVE' && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Ativo</span>}
                                {client.status === 'NEW' && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Novo</span>}
                                {client.status === 'INACTIVE' && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Alerta</span>}
                                {client.status === 'LOST' && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Inativo</span>}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-600">{new Date(client.lastPurchaseDate).toLocaleDateString('pt-BR')}</td>
                            <td className="px-4 py-3 text-center font-mono text-gray-700">{client.daysSinceLastPurchase}</td>
                            <td className="px-4 py-3 text-right font-bold text-gray-800">{formatCurrency(client.totalSpent)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        {/* MOBILE CARDS */}
        <div className="md:hidden space-y-3 p-3">
          {filteredMetrics.map(client => (
            <div key={client.name} className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-start">
                <span className="font-bold text-gray-800">{client.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  client.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                  client.status === 'NEW' ? 'bg-blue-100 text-blue-700' :
                  client.status === 'INACTIVE' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>{client.status}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                <div className="text-gray-500">
                  <p>Última Compra:</p>
                  <p className="font-medium text-gray-700">{client.daysSinceLastPurchase} dias atrás</p>
                </div>
                <div className="text-gray-500 text-right">
                  <p>Total Gasto:</p>
                  <p className="font-bold text-emerald-700">{formatCurrency(client.totalSpent)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredMetrics.length === 0 && (
            <div className="text-center py-8 text-gray-400">Nenhum cliente encontrado.</div>
        )}
      </div>
    </div>
  );
};

export default ClientReports;