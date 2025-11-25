import { useState, useEffect } from "react";
import api from "../api";
import toast from 'react-hot-toast';
import "../styles/AssetList.css"; // Reutilizando estilos de tabela existentes

function AdminUserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUsers();
  }, []);

  const getUsers = () => {
    api
      .get("/api/users/")
      .then((res) => {
        setUsers(res.data);
        setLoading(false);
      })
      .catch((err) => {
        toast.error("Erro ao carregar usuários ou acesso negado.");
        setLoading(false);
      });
  };

  const handleRoleChange = (userId, newRole) => {
    // Feedback visual imediato (optimistic update) ou loading
    const promise = api.put(`/api/users/${userId}/update-role/`, { role: newRole });

    toast.promise(promise, {
      loading: 'Atualizando permissão...',
      success: () => {
        // Atualiza o estado local para refletir a mudança
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        return 'Permissão atualizada com sucesso!';
      },
      error: 'Erro ao atualizar permissão.',
    });
  };

  if (loading) return <div className="loading-container">Carregando...</div>;

  return (
    <div>
      <div className="content-header">
        <h1>Administração de Usuários</h1>
      </div>

      <div className="asset-list-section">
        <table className="assets-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuário</th>
              <th>Permissão Atual</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td><strong>{user.username}</strong></td>
                <td>
                  <span className={`status-badge ${user.role === 'admin' ? 'status-active' : 'status-default'}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <select 
                    value={user.role} 
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="form-input"
                    style={{ padding: '5px', width: 'auto' }}
                  >
                    <option value="viewer">Visualizador</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminUserList;