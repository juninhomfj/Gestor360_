
import React, { useState, useEffect } from 'react';
import { ImportMapping } from '../types';
import { X, ArrowRight, Check, AlertTriangle } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileData: any[][]; // Raw rows from Excel/CSV
  onConfirm: (mapping: ImportMapping) => void;
  darkMode?: boolean;
}

const FIELDS = [
  { key: 'date', label: 'Data Faturamento', required: false },
  { key: 'completionDate', label: 'Data Finalização', required: false },
  { key: 'type', label: 'Tipo (Básica/Natal)', required: true },
  { key: 'client', label: 'Nome Cliente', required: true },
  { key: 'quote', label: 'Nº Orçamento', required: false },
  { key: 'quantity', label: 'Quantidade', required: true },
  { key: 'valueProposed', label: 'Vlr. Proposto (Base)', required: true },
  { key: 'valueSold', label: 'Vlr. Venda (Final)', required: true },
  { key: 'margin', label: 'Margem (%)', required: true },
  { key: 'tracking', label: 'Rastreio', required: false },
  { key: 'boletoStatus', label: 'Status Boleto', required: false },
  { key: 'obs', label: 'Observações', required: false },
];

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, fileData, onConfirm, darkMode }) => {
  const [mapping, setMapping] = useState<ImportMapping>({});
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRow, setPreviewRow] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && fileData && fileData.length > 0) {
      // Assume first row is header
      const headerRow = fileData[0].map(cell => String(cell || '').trim());
      setHeaders(headerRow);
      
      // Assume second row is data (if exists)
      if (fileData.length > 1) {
        setPreviewRow(fileData[1]);
      } else {
        setPreviewRow([]);
      }

      // Auto-guess mapping based on header names
      const initialMap: ImportMapping = {};
      FIELDS.forEach(field => {
        const index = headerRow.findIndex(h => 
          h && (h.toLowerCase().includes(field.label.toLowerCase().split(' ')[0]) || // Match "Data" in "Data Faturamento"
          h.toLowerCase() === field.key.toLowerCase())
        );
        if (index !== -1) {
          initialMap[field.key] = index;
        } else {
            initialMap[field.key] = -1; // Not mapped
        }
      });
      setMapping(initialMap);
    }
  }, [isOpen, fileData]);

  const handleMapChange = (fieldKey: string, colIndex: number) => {
    setMapping(prev => ({ ...prev, [fieldKey]: colIndex }));
  };

  const handleConfirm = () => {
    // Validate required fields
    const missing = FIELDS.filter(f => f.required && (mapping[f.key] === undefined || mapping[f.key] === -1));
    if (missing.length > 0) {
      alert(`Por favor, mapeie as colunas obrigatórias: ${missing.map(f => f.label).join(', ')}`);
      return;
    }
    onConfirm(mapping);
  };

  if (!isOpen) return null;

  const bgClass = darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-gray-900';
  const borderClass = darkMode ? 'border-slate-700' : 'border-gray-200';
  const inputBg = darkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className={`${bgClass} rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col`}>
        
        {/* Header */}
        <div className={`p-6 border-b ${borderClass} flex justify-between items-center`}>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
                Validar Importação
            </h2>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                Relacione as colunas do seu arquivo com os campos do sistema.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <div className={`p-4 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-blue-50 border-blue-100'}`}>
             <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
               <AlertTriangle size={16} />
               Instruções de Importação
             </h3>
             <ul className="text-xs space-y-1 list-disc list-inside opacity-80">
                <li>Valores com <strong>vírgula</strong> (ex: 1.500,00) são reconhecidos automaticamente.</li>
                <li>Selecione <strong>"⛔ OMITIR"</strong> se não quiser importar uma coluna específica.</li>
                <li>Verifique a pré-visualização abaixo de cada campo.</li>
             </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FIELDS.map(field => {
                const selectedIdx = mapping[field.key] ?? -1;
                const previewValue = selectedIdx !== -1 && previewRow[selectedIdx] !== undefined 
                    ? String(previewRow[selectedIdx]) 
                    : '-';

                return (
                    <div key={field.key} className={`p-3 rounded-lg border ${borderClass} ${darkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
                        <label className="block text-xs font-bold uppercase mb-1 flex justify-between">
                            <span>{field.label} {field.required && <span className="text-red-500">*</span>}</span>
                        </label>
                        
                        <select 
                            className={`w-full text-sm rounded-md p-2 mb-2 ${inputBg}`}
                            value={selectedIdx}
                            onChange={(e) => handleMapChange(field.key, Number(e.target.value))}
                        >
                            <option value={-1}>⛔ OMITIR (Não Importar)</option>
                            {headers.map((h, idx) => (
                                <option key={idx} value={idx}>
                                    {h} (Col {idx + 1})
                                </option>
                            ))}
                        </select>

                        <div className="text-xs truncate">
                            <span className="opacity-50 mr-1">Exemplo:</span>
                            <span className="font-mono font-medium" title={previewValue}>{previewValue}</span>
                        </div>
                    </div>
                );
            })}
          </div>

        </div>

        {/* Footer */}
        <div className={`p-6 border-t ${borderClass} flex justify-end gap-3`}>
          <button 
            onClick={onClose}
            className={`px-4 py-2 rounded-lg border ${darkMode ? 'border-slate-600 hover:bg-slate-800' : 'border-gray-300 hover:bg-gray-50'}`}
          >
            Cancelar
          </button>
          <button 
            onClick={handleConfirm}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium flex items-center shadow-md"
          >
            <Check size={18} className="mr-2" />
            Confirmar Importação
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
