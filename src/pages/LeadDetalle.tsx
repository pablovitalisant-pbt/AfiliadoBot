import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, Save, Trash2, Smartphone, User, Globe, FileText, CheckCircle2 } from 'lucide-react';

export default function LeadDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLead = async () => {
      const res = await fetch('/api/leads', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const found = data.find((l: any) => l.id.toString() === id);
        setLead(found);
      }
      setLoading(false);
    };
    fetchLead();
  }, [id, token]);

  const handleUpdate = async () => {
    const res = await fetch(`/api/leads/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(lead),
    });
    if (res.ok) {
      alert('Lead actualizado correctamente');
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (!lead) return <div>Lead no encontrado</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-indigo-600 transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1" /> Volver
        </button>
        <div className="flex space-x-2">
          <button onClick={handleUpdate} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center text-sm font-medium hover:bg-indigo-700 shadow-sm transition-all focus:ring-2 focus:ring-indigo-500">
            <Save className="w-4 h-4 mr-2" /> Guardar Cambios
          </button>
          <button className="bg-red-50 text-red-600 px-4 py-2 rounded-lg flex items-center text-sm font-medium hover:bg-red-100 shadow-sm transition-all">
            <Trash2 className="w-4 h-4 mr-2" /> Eliminar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Basic Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4 flex items-center">
              <User className="w-5 h-5 mr-3 text-indigo-500" /> Información del Prospecto
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nombre</label>
                <input
                  type="text"
                  value={lead.nombre || ''}
                  onChange={(e) => setLead({ ...lead, nombre: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">País</label>
                <input
                  type="text"
                  value={lead.pais || ''}
                  onChange={(e) => setLead({ ...lead, pais: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Link WhatsApp</label>
                <input
                  type="text"
                  value={lead.url || ''}
                  onChange={(e) => setLead({ ...lead, url: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Notas</label>
                <textarea
                  rows={4}
                  value={lead.notas || ''}
                  onChange={(e) => setLead({ ...lead, notas: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4 flex items-center mb-6">
              <Smartphone className="w-5 h-5 mr-3 text-indigo-500" /> Fases de Outreach
            </h2>
            
            <div className="space-y-8">
              {/* F3 - DM1 */}
              <div>
                <h3 className="font-bold text-sm text-gray-700 bg-gray-50 px-3 py-1 rounded inline-block mb-3">Fase 3: Primer Contacto (DM1)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center space-x-3 bg-white border border-gray-100 p-3 rounded-lg shadow-sm">
                    <input
                      type="checkbox"
                      checked={lead.f3.dm1_enviado}
                      onChange={(e) => setLead({ ...lead, f3: { ...lead.f3, dm1_enviado: e.target.checked } })}
                      className="w-5 h-5 text-indigo-600 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-600">DM1 Enviado</span>
                  </label>
                  <label className="flex items-center space-x-3 bg-white border border-gray-100 p-3 rounded-lg shadow-sm">
                    <input
                      type="checkbox"
                      checked={lead.f3.dm1_respondio}
                      onChange={(e) => setLead({ ...lead, f3: { ...lead.f3, dm1_respondio: e.target.checked } })}
                      className="w-5 h-5 text-indigo-600 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-600">Respondió</span>
                  </label>
                </div>
              </div>

              {/* F4 - Followups */}
              <div>
                <h3 className="font-bold text-sm text-gray-700 bg-gray-50 px-3 py-1 rounded inline-block mb-3">Fase 4: Seguimientos Estratégicos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {lead.f4.dms.map((dm: any, i: number) => (
                    <div key={i} className="flex flex-col space-y-2 bg-white border border-gray-100 p-3 rounded-lg shadow-sm">
                      <span className="text-[10px] font-bold text-indigo-500 uppercase">Seguimiento {i + 1} (Día {[3, 7, 12, 21][i]})</span>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={dm.e}
                          onChange={(e) => {
                            const dms = [...lead.f4.dms];
                            dms[i] = { ...dms[i], e: e.target.checked };
                            setLead({ ...lead, f4: { ...lead.f4, dms } });
                          }}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
                        />
                        <span className="text-xs font-medium text-gray-500">Enviado</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Status */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Estado del Lead</h2>
            <div className="space-y-2">
              {['frio', 'dm', 'cliente', 'descartado'].map((s) => (
                <button
                  key={s}
                  onClick={() => setLead({ ...lead, estado: s })}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    lead.estado === s ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
             <div className="flex items-center text-gray-900 font-bold text-sm mb-4">
               <FileText className="w-4 h-4 mr-2" /> Timeline
             </div>
             <div className="space-y-4">
                <div className="relative pl-6 pb-4 border-l-2 border-indigo-100 last:border-0">
                  <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-indigo-500" />
                  <p className="text-xs font-bold text-gray-700">Creado en Base de Datos</p>
                  <p className="text-[10px] text-gray-400">{new Date(lead.fecha).toLocaleString()}</p>
                </div>
                {lead.f3.fechaEnvio && (
                  <div className="relative pl-6 pb-4 border-l-2 border-indigo-100 last:border-0">
                    <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-indigo-500" />
                    <p className="text-xs font-bold text-gray-700">Primer DM Enviado</p>
                    <p className="text-[10px] text-gray-400">{new Date(lead.f3.fechaEnvio).toLocaleString()}</p>
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
