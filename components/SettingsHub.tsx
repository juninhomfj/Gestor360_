

import React, { useState, useEffect } from 'react';
import { CommissionRule, ProductType, ReportConfig, SystemConfig } from '../types';
import CommissionEditor from './CommissionEditor';
import { Settings, BarChart3, List, Shield, Cloud, AlertCircle, Clock, Download, EyeOff } from 'lucide-react';
import { getSystemConfig, saveSystemConfig, exportEncryptedBackup } from '../services/logic';
import BackupModal from './BackupModal';

interface SettingsHubProps {
  rulesBasic: CommissionRule[];
  rulesNatal: CommissionRule[];
  reportConfig: ReportConfig;
  onSaveRules: (type: ProductType, rules: CommissionRule[]) => void;
  onSaveReportConfig: (config: ReportConfig) => void;
  darkMode?: boolean;
  defaultTab?: string;
}

const SettingsHub: React.FC<SettingsHubProps> = ({ 
  rulesBasic, 
  rulesNatal, 
  reportConfig, 
  onSaveRules, 
  onSaveReportConfig,
  darkMode,
  defaultTab
}) => {
  const [activeTab, setActiveTab] = useState<'COMMISSIONS' | 'REPORTS' | 'BACKUP'>('COMMISSIONS');
  const [localReportConfig, setLocalReportConfig] = useState<ReportConfig>(reportConfig);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(getSystemConfig());
  const [showBackupModal, setShowBackupModal] = useState(false);

  useEffect(() => {
    if (defaultTab === 'reports') setActiveTab('REPORTS');
  }, [defaultTab]);

  useEffect(() => {
    setLocalReportConfig(reportConfig);
  }, [reportConfig]);

  const handleReportChange = (key: keyof ReportConfig, val: string) => {
    setLocalReportConfig(prev => ({ ...prev, [key]: parseInt(val) || 0 }));
  };

  const handleSysConfigChange = (key: keyof SystemConfig, val: any) => {
      const newConfig = { ...systemConfig, [key]: val };
      setSystemConfig(newConfig);
      saveSystemConfig(newConfig);
  };

  const toggleGoogleDrive = () => {
      // Simulating authentication flow
      if (!systemConfig.googleDriveConnected) {
          if (confirm("Você será redirecionado para autorizar o acesso ao Google Drive (Simulação).")) {
             handleSysConfigChange('googleDriveConnected', true);
             handleSysConfigChange('googleDriveAccount', 'usuario@gmail.com');
          }
      } else {
          handleSysConfigChange('googleDriveConnected', false);
          handleSysConfigChange('googleDriveAccount', undefined);
      }
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Configurações
          </h1>
          
          <div className={`flex p-1 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-gray-200'}`}>
             <button
                onClick={() => setActiveTab('COMMISSIONS')}
                className={`px-4 py-2 rounded-md text-sm font-medium flex items-center transition-all ${
                    activeTab === 'COMMISSIONS' 
                    ? (darkMode ? 'bg-emerald-600 text-white shadow' : 'bg-white text-emerald-700 shadow') 
                    : (darkMode ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900')
                }`}
             >
                <Settings size={16} className="mr-2"/>
                Tabelas
             </button>
             <button
                onClick={() => setActiveTab('REPORTS')}
                className={`px-4 py-2 rounded-md text-sm font-medium flex items-center transition-all ${
                    activeTab === 'REPORTS' 
                    ? (darkMode ? 'bg-emerald-600 text-white shadow' : 'bg-white text-emerald-700 shadow') 
                    : (darkMode ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900')
                }`}
             >
                <BarChart3 size={16} className="mr-2"/>
                Relatórios
             </button>
             <button
                onClick={() => setActiveTab('BACKUP')}
                className={`px-4 py-2 rounded-md text-sm font-medium flex items-center transition-all ${
                    activeTab === 'BACKUP' 
                    ? (darkMode ? 'bg-emerald-600 text-white shadow' : 'bg-white text-emerald-700 shadow') 
                    : (darkMode ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900')
                }`}
             >
                <Shield size={16} className="mr-2"/>
                Backup & Dados
             </button>
          </div>
       </div>

       {/* CONTENT */}
       {activeTab === 'COMMISSIONS' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <CommissionEditor 
                type={ProductType.BASICA} 
                initialRules={rulesBasic} 
                onSave={(r) => onSaveRules(ProductType.BASICA, r)} 
            />
            <CommissionEditor 
                type={ProductType.NATAL} 
                initialRules={rulesNatal} 
                onSave={(r) => onSaveRules(ProductType.NATAL, r)} 
            />
          </div>
       )}

       {activeTab === 'REPORTS' && (
           <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm border p-6 max-w-2xl`}>
               <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                   Parâmetros de Inteligência (CRM)
               </h3>
               
               <div className="space-y-6">
                   <div>
                       <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                           Considerar "Novo Cliente" se primeira compra for há menos de:
                       </label>
                       <div className="flex items-center gap-2">
                           <input 
                               type="number" 
                               value={localReportConfig.daysForNewClient}
                               onChange={(e) => handleReportChange('daysForNewClient', e.target.value)}
                               className={`w-24 p-2 rounded border ${darkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                           />
                           <span className={darkMode ? 'text-slate-500' : 'text-gray-500'}>dias</span>
                       </div>
                   </div>

                   <div>
                       <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                           Marcar como "Inativo (Alerta)" após:
                       </label>
                       <div className="flex items-center gap-2">
                           <input 
                               type="number" 
                               value={localReportConfig.daysForInactive}
                               onChange={(e) => handleReportChange('daysForInactive', e.target.value)}
                               className={`w-24 p-2 rounded border ${darkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                           />
                           <span className={darkMode ? 'text-slate-500' : 'text-gray-500'}>dias sem comprar</span>
                       </div>
                   </div>

                   <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                       <button 
                           onClick={() => onSaveReportConfig(localReportConfig)}
                           className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 font-medium shadow-sm transition-colors"
                       >
                           Salvar Parâmetros
                       </button>
                   </div>
               </div>
           </div>
       )}

       {activeTab === 'BACKUP' && (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm border p-6`}>
                   <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                       <Clock size={20} className="text-blue-500" />
                       Backup e Preferências
                   </h3>
                   <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                       Configure como o sistema protege seus dados e calcula totais.
                   </p>

                   <div className="space-y-4">
                       <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${systemConfig.backupFrequency === 'WEEKLY' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : darkMode ? 'border-slate-600' : 'border-gray-200'}`}>
                           <input 
                               type="radio" 
                               name="frequency" 
                               checked={systemConfig.backupFrequency === 'WEEKLY'} 
                               onChange={() => handleSysConfigChange('backupFrequency', 'WEEKLY')}
                           />
                           <span className={darkMode ? 'text-slate-200' : 'text-gray-800'}>Lembrete de Backup: Semanal</span>
                       </label>

                       <hr className={darkMode ? 'border-slate-700' : 'border-gray-200'} />

                       <label className="flex items-center gap-3 cursor-pointer">
                           <input 
                                type="checkbox"
                                checked={systemConfig.includeNonAccountingInTotal}
                                onChange={(e) => handleSysConfigChange('includeNonAccountingInTotal', e.target.checked)}
                                className="w-5 h-5 rounded text-blue-600"
                           />
                           <div>
                               <span className={`block font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Incluir Contas Não-Contábeis</span>
                               <span className="text-xs text-gray-500">Exibir saldo de "Cartão Premiação/Cofre" no Patrimônio Total?</span>
                           </div>
                       </label>
                   </div>

                   <div className="mt-6 pt-4 border-t dark:border-slate-700">
                       <p className="text-xs text-gray-400 mb-2">Último backup: {systemConfig.lastBackupDate ? new Date(systemConfig.lastBackupDate).toLocaleDateString() : 'Nunca'}</p>
                       <button 
                         onClick={() => setShowBackupModal(true)}
                         className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                       >
                           <Download size={18} />
                           Fazer Backup Agora
                       </button>
                   </div>
               </div>

               <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm border p-6`}>
                   <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                       <Cloud size={20} className={systemConfig.googleDriveConnected ? 'text-emerald-500' : 'text-gray-400'} />
                       Backup em Nuvem (Google Drive)
                   </h3>
                   <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                       Vincule sua conta para salvar backups automaticamente na nuvem.
                   </p>

                   {systemConfig.googleDriveConnected ? (
                       <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 rounded-lg mb-4">
                           <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold mb-1">
                               <AlertCircle size={18} />
                               Conectado
                           </div>
                           <p className="text-sm text-emerald-700 dark:text-emerald-500">
                               Conta: {systemConfig.googleDriveAccount}
                           </p>
                           <p className="text-xs text-emerald-600 mt-2">Próximo backup automático: Hoje às 23:00</p>
                       </div>
                   ) : (
                       <div className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-4 rounded-lg mb-4 text-center">
                           <p className="text-sm text-gray-500">Nenhuma conta vinculada.</p>
                       </div>
                   )}

                   <button 
                       onClick={toggleGoogleDrive}
                       className={`w-full py-2 rounded-lg font-medium transition-colors ${
                           systemConfig.googleDriveConnected 
                           ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
                           : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                       }`}
                   >
                       {systemConfig.googleDriveConnected ? 'Desconectar Conta' : 'Conectar Google Drive'}
                   </button>
               </div>
           </div>
       )}

       <BackupModal 
            isOpen={showBackupModal} 
            mode="BACKUP" 
            onClose={() => setShowBackupModal(false)} 
            onSuccess={() => {
                handleSysConfigChange('lastBackupDate', new Date().toISOString());
            }} 
       />
    </div>
  );
};

export default SettingsHub;