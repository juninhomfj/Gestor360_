
import React, { useState } from 'react';
import { User } from '../types';
import { updateUserProfile, changeUserPassword } from '../auth/userStorage'; // NEW IMPORT
import { User as UserIcon, Key, Save, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';

interface UserProfileProps {
  user: User;
  onUpdate: (user: User) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate }) => {
  const [name, setName] = useState(user.name);
  const [pass, setPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [msg, setMsg] = useState<{type: 'success'|'error', text: string}|null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async () => {
      setLoading(true);
      const success = await updateUserProfile(user.id, { name });
      setLoading(false);
      
      if (success) {
          onUpdate({ ...user, name });
          setMsg({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      } else {
          setMsg({ type: 'error', text: 'Erro ao atualizar perfil.' });
      }
  };

  const handleChangePassword = async () => {
      if (!pass || pass.length < 4) {
          setMsg({ type: 'error', text: 'A senha deve ter pelo menos 4 caracteres.' });
          return;
      }
      if (pass !== confirmPass) {
          setMsg({ type: 'error', text: 'As senhas não coincidem.' });
          return;
      }

      setLoading(true);
      const result = await changeUserPassword(user.id, pass);
      setLoading(false);

      if (result.success) {
          setPass('');
          setConfirmPass('');
          setMsg({ type: 'success', text: 'Senha alterada com sucesso!' });
      } else {
          setMsg({ type: 'error', text: result.message });
      }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-gray-800">Meu Perfil</h1>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <UserIcon className="text-blue-500" /> Dados Pessoais
            </h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-gray-500 mb-1">Nome Completo</label>
                    <input 
                        className="w-full border p-2 rounded" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        disabled={loading}
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-500 mb-1">Usuário (Email)</label>
                    <input 
                        className="w-full border p-2 rounded bg-gray-100 text-gray-500 cursor-not-allowed" 
                        value={user.username} 
                        disabled 
                    />
                </div>
                <button 
                    onClick={handleUpdateProfile}
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                >
                    {loading ? <Loader2 size={18} className="animate-spin"/> : <Save size={18} />} 
                    Salvar Alterações
                </button>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Key className="text-amber-500" /> Alterar Senha
            </h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-gray-500 mb-1">Nova Senha</label>
                    <input 
                        type="password"
                        className="w-full border p-2 rounded" 
                        value={pass} 
                        onChange={e => setPass(e.target.value)}
                        disabled={loading} 
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-500 mb-1">Confirmar Nova Senha</label>
                    <input 
                        type="password"
                        className="w-full border p-2 rounded" 
                        value={confirmPass} 
                        onChange={e => setConfirmPass(e.target.value)}
                        disabled={loading} 
                    />
                </div>
                <button 
                    onClick={handleChangePassword}
                    disabled={loading}
                    className="bg-amber-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-amber-700 flex items-center gap-2 disabled:opacity-50"
                >
                    {loading ? <Loader2 size={18} className="animate-spin"/> : <Key size={18} />} 
                    Atualizar Senha
                </button>
                
                {msg && (
                    <div className={`p-3 rounded text-sm flex items-center gap-2 ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {msg.type === 'success' ? <CheckCircle size={16}/> : <AlertTriangle size={16}/>}
                        {msg.text}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default UserProfile;
