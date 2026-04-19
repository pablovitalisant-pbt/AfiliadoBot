import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Kanban as KanbanIcon, Users, UserCheck, UserX, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Pipeline() {
  const { token } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/leads', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setLeads(Array.isArray(data) ? data : []));
  }, [token]);

  const columns = [
    { id: 'frio', title: 'Frío', icon: Users, color: 'bg-blue-50 border-blue-200 text-blue-700' },
    { id: 'dm', title: 'En DMs', icon: MessageSquare, color: 'bg-orange-50 border-orange-200 text-orange-700' },
    { id: 'cliente', title: 'Clientes', icon: UserCheck, color: 'bg-green-50 border-green-200 text-green-700' },
    { id: 'descartado', title: 'Descartados', icon: UserX, color: 'bg-gray-50 border-gray-200 text-gray-700' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Pipeline de Ventas</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        {columns.map(col => {
          const colLeads = leads.filter(l => l.estado === col.id);
          const Icon = col.icon;
          return (
            <div key={col.id} className="flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className={`p-4 border-b border-gray-100 flex items-center justify-between font-bold text-sm ${col.color}`}>
                <div className="flex items-center">
                  <Icon className="w-4 h-4 mr-2" /> {col.title}
                </div>
                <span className="bg-white px-2 py-0.5 rounded-full text-[10px] shadow-sm ml-2">
                  {colLeads.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50/50">
                {colLeads.map(lead => (
                  <Link
                    key={lead.id}
                    to={`/leads/${lead.id}`}
                    className="block bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group"
                  >
                    <p className="text-xs font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{lead.nombre || 'Sin nombre'}</p>
                    <p className="text-[10px] text-gray-400 mt-1 truncate">{lead.url}</p>
                    <div className="flex items-center mt-3 pt-3 border-t border-gray-50">
                       <span className="text-[10px] font-medium text-gray-500 uppercase tracking-tighter">{lead.pais}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
