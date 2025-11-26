import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import '../styles/Sidebar.css';
import { LuLayoutDashboard, LuLogOut, LuUsers } from "react-icons/lu"; // Importe LuUsers
import { ACCESS_TOKEN } from "../constants";
import { jwtDecode } from "jwt-decode"; // Corrigido import (sem chaves se for default, com chaves se for named)

function Sidebar() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Verifica se a role no token é admin

        if (decoded.role === 'admin') {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error("Erro ao decodificar token:", error);
      }
    }
  }, []);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">CA</span> 
        <span>Controle de Ativos</span>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/" className="sidebar-link">
          <LuLayoutDashboard size={20} /> 
          <span>Dashboard</span>
        </NavLink>

        {/* Renderiza condicionalmente o link de Admin */}
        {isAdmin && (
          <NavLink to="/admin/users" className="sidebar-link">
            <LuUsers size={20} />
            <span>Usuários</span>
          </NavLink>
        )}

        <Link to="/logout" className="sidebar-link logout-link">
          <LuLogOut size={20} />
          <span>Logout</span>
        </Link>
      </nav>
    </div>
  );
}

export default Sidebar;