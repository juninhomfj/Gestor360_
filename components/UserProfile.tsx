
import React, { useState } from 'react';
import { User } from '../types';
import { updateUser, changePassword } from '../services/auth';
import { User as UserIcon, Key, Save, CheckCircle } from 'lucide-react';

interface UserProfileProps {
  user: User;
  onUpdate: (user: User) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate }) => {
  const [name, setName] = useState(user.name);
  const [pass, setPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [msg, setMsg] = useState('');

  const handleUpdateProfile = () => {
      const updated = updateUser(user.id, { name });
      const me = updated.find(u => u.id === user.id);
      if (me) onUpdate(me);
      setMsg('Perfil atualizado com sucesso!');
  };

  const handleChangePassword = () => {
      if (!pass || pass.length < 4) {
          alert('Senha muito curta.');
          return;
      }
      if (pass !== confirmPass) {
          alert('As senhas não coincidem.');
          return;
      }
      changePassword(user.id, pass);
      setPass('');
      setConfirmPass('');
      alert('Senha alterada com sucesso!');
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
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-500 mb-1">Usuário (Login)</label>
                    <input 
                        className="w-full border p-2 rounded bg-gray-100 text-gray-500 cursor-not-allowed" 
                        value={user.username} 
                        disabled 
                    />
                </div>
                <button 
                    onClick={handleUpdateProfile}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2"
                >
                    <Save size={18} /> Salvar Alterações
                </button>
                {msg && <p className="text-green-600 text-sm flex items-center gap-1"><CheckCircle size={14}/> {msg}</p>}
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
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-500 mb-1">Confirmar Nova Senha</label>
                    <input 
                        type="password"
                        className="w-full border p-2 rounded" 
                        value={confirmPass} 
                        onChange={e => setConfirmPass(e.target.value)} 
                    />
                </div>
                <button 
                    onClick={handleChangePassword}
                    className="bg-amber-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-amber-700 flex items-center gap-2"
                >
                    <Key size={18} /> Atualizar Senha
                </button>
            </div>
        </div>
    </div>
  );
};

export default UserProfile;
