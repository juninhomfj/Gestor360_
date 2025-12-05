
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { listUsers, createUser, deleteUser } from '../services/auth';
import { Trash2, Plus, Shield, User as UserIcon, AlertTriangle } from 'lucide-react';

interface AdminUsersProps {
  currentUser: User;
}

const AdminUsers: React.FC<AdminUsersProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // New User Form
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('USER');
  const [error, setError] = useState('');

  useEffect(() => {
      loadUsers();
  }, []);

  const loadUsers = () => {
      setUsers(listUsers());
  };

  const handleCreate = (e: React.FormEvent) => {
      e.preventDefault();
      if(!newUsername || !newName || !newPassword) {
          setError('Preencha todos os campos.');
          return;
      }

      const result = createUser(currentUser.id, { username: newUsername, name: newName, role: newRole }, newPassword);
      if(result.success) {
          setIsFormOpen(false);
          setNewUsername('');
          setNewName('');
          setNewPassword('');
          loadUsers();
          alert('Usuário criado!');
      } else {
          setError(result.message);
      }
  };

  const handleDelete = (id: string) => {
      if(confirm('Tem certeza? Isso impedirá o acesso deste usuário, mas os dados permanecerão no navegador até serem limpos.')) {
          try {
              deleteUser(currentUser.id, id);
              loadUsers();
          } catch(e: any) {
              alert(e.message);
          }
      }
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Shield className="text-blue-600" /> Gestão de Usuários
            </h1>
            <button 
                onClick={() => setIsFormOpen(!isFormOpen)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
                <Plus size={18} /> Novo Usuário
            </button>
        </div>

        {isFormOpen && (
            <div className="bg-white p-6 rounded-xl shadow-md border border-blue-100">
                <h3 className="font-bold mb-4 text-gray-700">Cadastrar Novo Usuário</h3>
                <form onSubmit={handleCreate} className="space-y-4 max-w-lg">
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Nome Completo</label>
                        <input className="w-full border p-2 rounded" value={newName} onChange={e => setNewName(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Usuário (Login)</label>
                        <input className="w-full border p-2 rounded" value={newUsername} onChange={e => setNewUsername(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Senha Inicial</label>
                        <input type="password" className="w-full border p-2 rounded" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Permissão</label>
                        <select className="w-full border p-2 rounded" value={newRole} onChange={e => setNewRole(e.target.value as UserRole)}>
                            <option value="USER">Usuário Padrão (Isolado)</option>
                            <option value="ADMIN">Administrador (Gestão)</option>
                        </select>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-gray-500">Cancelar</button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded font-bold">Criar</button>
                    </div>
                </form>
            </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 font-bold border-b">
                    <tr>
                        <th className="p-4">Usuário</th>
                        <th className="p-4">Permissão</th>
                        <th className="p-4">Criado em</th>
                        <th className="p-4 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {users.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50">
                            <td className="p-4">
                                <div className="font-bold text-gray-800">{u.name}</div>
                                <div className="text-xs text-gray-500">@{u.username}</div>
                            </td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                                    {u.role}
                                </span>
                            </td>
                            <td className="p-4 text-gray-500">
                                {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-4 text-center">
                                {u.id !== currentUser.id ? (
                                    <button onClick={() => handleDelete(u.id)} className="text-red-400 hover:text-red-600 p-2">
                                        <Trash2 size={18} />
                                    </button>
                                ) : (
                                    <span className="text-xs text-gray-400 italic">Você</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default AdminUsers;
