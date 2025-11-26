import { useState, useEffect } from "react";
import api from "../api";
import toast from 'react-hot-toast';
import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN } from "../constants";
import ConfirmationModal from "../components/ConfirmationModal";
import "../styles/AssetList.css";
import "../styles/Modal.css";

function AdminUserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Estados para Modais
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({ username: "", secret_question: "" });

  useEffect(() => {
    // Decodifica o token para saber quem é o usuário logado
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
        const decoded = jwtDecode(token);
        setCurrentUserId(decoded.user_id); // O SimpleJWT geralmente coloca o user_id no token
    }
    getUsers();
  }, []);

  const getUsers = () => {
    api.get("/api/users/")
      .then((res) => {
        setUsers(res.data);
        setLoading(false);
      })
      .catch((err) => {
        toast.error("Erro ao carregar usuários.");
        setLoading(false);
      });
  };

  // --- Lógica de Exclusão ---
  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = () => {
    if (!userToDelete) return;
    
    toast.promise(
      api.delete(`/api/users/${userToDelete.id}/`),
      {
        loading: 'Excluindo usuário...',
        success: () => {
          setUsers(users.filter(u => u.id !== userToDelete.id));
          setIsDeleteModalOpen(false);
          return 'Usuário excluído!';
        },
        error: (err) => err.response?.data?.detail || 'Erro ao excluir.'
      }
    );
  };

  // --- Lógica de Edição (Cargo) ---
  const handleRoleChange = (userId, newRole) => {
    const promise = api.put(`/api/users/${userId}/update-role/`, { role: newRole });
    toast.promise(promise, {
      loading: 'Atualizando permissão...',
      success: () => {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        return 'Permissão atualizada!';
      },
      error: (err) => err.response?.data?.error || 'Erro ao atualizar.'
    });
  };

  // --- Lógica de Edição (Dados Gerais) ---
  const openEditModal = (user) => {
    setEditingUser(user);
    // Precisamos pegar os detalhes completos ou usar o que já temos. 
    // Como o UserListView atual retorna role e username, talvez precisemos buscar a secret_question
    // Ou garantir que o UserListView retorne. Assumindo que precisamos buscar:
    api.get(`/api/users/${user.id}/`).then(res => {
        setEditFormData({
            username: res.data.username,
            secret_question: res.data.secret_question || ""
        });
        setIsEditModalOpen(true);
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingUser) return;

    toast.promise(
        api.patch(`/api/users/${editingUser.id}/`, editFormData),
        {
            loading: 'Atualizando dados...',
            success: (res) => {
                // Atualiza lista local
                setUsers(users.map(u => u.id === editingUser.id ? { ...u, username: res.data.username } : u));
                setIsEditModalOpen(false);
                return "Dados atualizados!";
            },
            error: "Erro ao atualizar dados."
        }
    );
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
              <th>Permissão (Cargo)</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isCurrentUser = user.id === currentUserId;
              
              return (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td><strong>{user.username}</strong></td>
                  <td>
                    <select 
                      value={user.role} 
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="form-input"
                      disabled={isCurrentUser} // Bloqueia edição do próprio cargo
                      style={{ 
                          padding: '5px', 
                          width: 'auto',
                          opacity: isCurrentUser ? 0.5 : 1,
                          cursor: isCurrentUser ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <option value="viewer">Visualizador</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </td>
                  <td className="action-buttons">
                    <button 
                        onClick={() => openEditModal(user)} 
                        className="action-edit"
                    >
                        Editar
                    </button>
                    {!isCurrentUser && (
                        <button 
                            onClick={() => openDeleteModal(user)} 
                            className="action-delete"
                        >
                            Excluir
                        </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Usuário"
      >
        <p>Tem certeza que deseja excluir o usuário <strong>{userToDelete?.username}</strong>?</p>
      </ConfirmationModal>

      {/* Modal de Edição Customizado */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Editar Usuário</h2>
                    <button onClick={() => setIsEditModalOpen(false)} className="modal-close-button">&times;</button>
                </div>
                <form onSubmit={handleEditSubmit}>
                    <div className="modal-body">
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{display: 'block', marginBottom: '5px', color: '#d1d5db'}}>Nome de Usuário</label>
                            <input 
                                type="text" 
                                className="modal-input"
                                value={editFormData.username}
                                onChange={e => setEditFormData({...editFormData, username: e.target.value})}
                                required
                            />
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{display: 'block', marginBottom: '5px', color: '#d1d5db'}}>Pergunta Secreta</label>
                            <input 
                                type="text" 
                                className="modal-input"
                                value={editFormData.secret_question}
                                onChange={e => setEditFormData({...editFormData, secret_question: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={() => setIsEditModalOpen(false)} className="modal-button cancel">Cancelar</button>
                        <button type="submit" className="modal-button confirm" style={{ backgroundColor: '#3b82f6' }}>Salvar</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}

export default AdminUserList;