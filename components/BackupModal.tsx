
import React, { useState } from 'react';
import { Lock, Download, Upload, Trash2, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { exportEncryptedBackup, importEncryptedBackup, clearAllSales } from '../services/logic';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'BACKUP' | 'RESTORE' | 'CLEAR'; 
  onSuccess: () => void; // Used for Backup success
  onRestoreSuccess?: () => void; // New: Used for Restore success
}

const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose, mode, onSuccess, onRestoreSuccess }) => {
  const [passphrase, setPassphrase] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); 

  if (!isOpen) return null;

  const handleBackup = () => {
    if (!passphrase || passphrase.length < 4) {
      setError('A chave deve ter pelo menos 4 caracteres.');
      return;
    }
    try {
      exportEncryptedBackup(passphrase);
      onSuccess();
      onClose();
    } catch (e) {
      setError('Erro ao gerar backup.');
    }
  };

  const handleRestore = async () => {
    if (!file) {
      setError('Selecione um arquivo de backup (.v360).');
      return;
    }
    if (!passphrase) {
      setError('Informe a chave de segurança.');
      return;
    }

    try {
      await importEncryptedBackup(file, passphrase);
      
      if (onRestoreSuccess) {
          onRestoreSuccess();
      } else {
          // Fallback if no handler provided
          window.location.reload();
      }
    } catch (e) {
      setError('Falha na restauração. Verifique se a chave está correta ou se o arquivo é válido.');
    }
  };

  const handleClearFlow = async () => {
    if (confirm('Tem certeza absoluta? Todos os dados serão perdidos se você não fez backup.')) {
        clearAllSales();
        window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <X size={24} />
        </button>

        {/* --- MODE: CLEAR DATABASE FLOW --- */}
        {mode === 'CLEAR' && (
            <div className="p-6">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="bg-red-100 p-4 rounded-full mb-4">
                        <Trash2 size={40} className="text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Limpar Base de Dados</h2>
                    <p className="text-gray-500 mt-2">Você está prestes a apagar todas as vendas e configurações.</p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
                    <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2">
                        <AlertTriangle size={16}/> Recomendação de Segurança
                    </h3>
                    <p className="text-sm text-amber-700 mt-1">
                        Recomendamos fazer um <strong>Backup Criptografado</strong> antes de prosseguir. Sem backup, os dados são irrecuperáveis.
                    </p>
                </div>

                <div className="space-y-3">
                    <button 
                        className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 flex items-center justify-center"
                        onClick={() => setStep(2)}
                    >
                        <Download size={20} className="mr-2" />
                        Fazer Backup & Limpar
                    </button>
                    
                    <button 
                        onClick={handleClearFlow}
                        className="w-full py-3 bg-white border-2 border-red-100 text-red-600 rounded-lg font-bold hover:bg-red-50"
                    >
                        Não, apenas Limpar Tudo
                    </button>
                </div>

                {/* Inline Backup Logic for Clear Flow */}
                {step === 2 && (
                    <div className="absolute inset-0 bg-white p-6 flex flex-col">
                        <h3 className="text-lg font-bold mb-4">Proteger Backup</h3>
                        <p className="text-sm text-gray-500 mb-4">Crie uma chave (email ou senha) para criptografar seus dados antes de limpar.</p>
                        
                        <input 
                            type="password" 
                            placeholder="Sua chave de segurança"
                            className="w-full border p-3 rounded-lg mb-4"
                            value={passphrase}
                            onChange={e => setPassphrase(e.target.value)}
                        />
                        
                        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                        <button 
                            onClick={() => {
                                if(!passphrase) { setError('Digite uma senha'); return; }
                                exportEncryptedBackup(passphrase);
                                setTimeout(() => handleClearFlow(), 1000); 
                            }}
                            className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold"
                        >
                            Baixar & Apagar Tudo
                        </button>
                         <button 
                            onClick={() => setStep(1)}
                            className="mt-2 text-gray-400 text-sm underline"
                        >
                            Voltar
                        </button>
                    </div>
                )}
            </div>
        )}

        {/* --- MODE: NORMAL BACKUP --- */}
        {mode === 'BACKUP' && (
            <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-blue-100 p-2 rounded-lg"><Lock className="text-blue-600" size={24}/></div>
                    <h2 className="text-xl font-bold text-gray-800">Backup Criptografado</h2>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                    Seus dados serão exportados em um arquivo <code>.v360</code> protegido.
                    Para garantir que apenas você tenha acesso, defina uma chave de segurança.
                </p>

                <label className="block text-sm font-bold text-gray-700 mb-2">
                    Chave de Segurança (Email ou Senha)
                </label>
                <input 
                    type="password" 
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none mb-2"
                    placeholder="Digite sua chave secreta..."
                    value={passphrase}
                    onChange={e => setPassphrase(e.target.value)}
                />
                <p className="text-xs text-amber-600 mb-6 flex items-center">
                    <AlertTriangle size={12} className="mr-1"/>
                    Se você esquecer essa chave, não poderá restaurar o backup.
                </p>

                {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

                <button 
                    onClick={handleBackup}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center"
                >
                    <Download size={20} className="mr-2" />
                    Gerar Arquivo Seguro
                </button>
            </div>
        )}

        {/* --- MODE: RESTORE --- */}
        {mode === 'RESTORE' && (
            <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-emerald-100 p-2 rounded-lg"><Upload className="text-emerald-600" size={24}/></div>
                    <h2 className="text-xl font-bold text-gray-800">Restaurar Backup</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Arquivo de Backup (.v360)</label>
                        <input 
                            type="file" 
                            accept=".v360"
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                            onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Chave de Segurança</label>
                        <input 
                            type="password" 
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="Digite a chave usada no backup..."
                            value={passphrase}
                            onChange={e => setPassphrase(e.target.value)}
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</p>}

                    <button 
                        onClick={handleRestore}
                        className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 flex items-center justify-center"
                    >
                        <CheckCircle size={20} className="mr-2" />
                        Descriptografar & Restaurar
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default BackupModal;
