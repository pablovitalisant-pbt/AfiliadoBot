import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Plus, Search, ExternalLink, Filter, Download } from 'lucide-react';

export default function Leads() {
  const { token } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    const res = await fetch('/api/leads', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setLeads(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, [token]);

  const filteredLeads = leads.filter(l => 
    l.nombre?.toLowerCase().includes(search.toLowerCase()) || 
    l.url.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Mis Leads</h1>
        <div className="flex space-x-2">
          <Link to="/leads/new" className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center text-xs font-bold hover:bg-emerald-700 shadow-md shadow-emerald-900/10 transition-all">
            <Plus className="w-4 h-4 mr-2" /> Agregar Lead
          </Link>
        </div>
      </div>

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por nombre o link..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white shadow-sm text-sm"
          />
        </div>
        <div className="flex space-x-2">
           <button className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg flex items-center text-xs font-bold hover:bg-gray-50 transition-all shadow-sm">
             <Filter className="w-4 h-4 mr-2" /> Filtros
           </button>
           <button className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg flex items-center text-xs font-bold hover:bg-gray-50 transition-all shadow-sm">
             <Download className="w-4 h-4 mr-2" /> Exportar
           </button>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lead</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Estado</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">País</th>
              <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-sm">Cargando datos...</td></tr>
            ) : filteredLeads.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-sm italic">No se encontraron leads.</td></tr>
            ) : filteredLeads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">{lead.nombre || 'Sin nombre'}</span>
                    <a href={lead.url} target="_blank" rel="noreferrer" className="text-[10px] text-gray-400 hover:text-emerald-500 flex items-center mt-0.5">
                      wa.link <ExternalLink className="w-2.5 h-2.5 ml-1" />
                    </a>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                    lead.estado === 'frio' ? 'bg-blue-100 text-blue-700' :
                    lead.estado === 'dm' ? 'bg-orange-100 text-orange-700' :
                    lead.estado === 'cliente' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {lead.estado}
                  </span>
                </td>
                <td className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase">{lead.pais}</td>
                <td className="px-6 py-4 text-right">
                  <Link to={`/leads/${lead.id}`} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg transition-colors">Detalle</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
