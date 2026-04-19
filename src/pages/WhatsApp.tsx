import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { MessageCircle, Link, RefreshCcw, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';

export default function WhatsApp() {
  const { token } = useAuth();
  const [status, setStatus] = useState<any>({ connected: false, qr: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;

    const eventSource = new EventSource(`/api/whatsapp/qr?token=${token}`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WA Update:', data);
      
      if (data.type === 'qr') {
        setStatus((prev: any) => ({ ...prev, qr: data.data }));
      } else if (data.type === 'status') {
        setStatus((prev: any) => ({ ...prev, connected: data.data === 'connected', qr: null }));
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE Error:', err);
      eventSource.close();
    };

    return () => eventSource.close();
  }, [token]);

  const handleLogout = async () => {
    setLoading(true);
    await fetch('/api/whatsapp/logout', { 
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    setLoading(false);
    setStatus({ connected: false, qr: null });
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Configuración de WhatsApp</h1>
        <p className="text-gray-500 text-sm mt-1">Conecta tu cuenta para comenzar a enviar mensajes automáticamente.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Status Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center space-y-6">
          <div className={`p-6 rounded-2xl ${status.connected ? 'bg-emerald-50 text-emerald-500' : 'bg-gray-50 text-gray-300'}`}>
            <MessageCircle className="w-16 h-16" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-black text-gray-800 tracking-tight">
              {status.connected ? 'Sesión Conectada' : 'WhatsApp Desconectado'}
            </h2>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-2">
              {status.connected ? 'Tu bot está operativo' : 'Requiere vinculación'}
            </p>
          </div>
          
          {status.connected && (
             <button
               onClick={handleLogout}
               disabled={loading}
               className="flex items-center px-6 py-2 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100 shadow-sm shadow-red-900/5 active:scale-95"
             >
               <LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión
             </button>
          )}
        </div>

        {/* QR Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center min-h-[360px]">
          {status.connected ? (
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-48 h-48 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-20 h-20 text-emerald-500" />
              </div>
              <p className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-6 py-2 rounded-full border border-emerald-200 tracking-widest uppercase">Vinculación Exitosa</p>
            </div>
          ) : status.qr ? (
            <div className="flex flex-col items-center space-y-6 animate-in zoom-in-95 duration-300">
              <div className="p-4 bg-white border-4 border-gray-50 rounded-2xl shadow-xl shadow-gray-200/50">
                <QRCodeSVG value={status.qr} size={200} />
              </div>
              <div className="space-y-3 text-center">
                <div className="flex items-center justify-center text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100">
                  <RefreshCcw className="w-3 h-3 mr-2 animate-spin" /> Esperando escaneo
                </div>
                <p className="text-[10px] text-gray-400 font-bold tracking-tight">El código se refresca automáticamente</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4 text-center">
               <div className="w-48 h-48 bg-gray-50 border border-dashed border-gray-200 rounded-2xl flex items-center justify-center">
                 <RefreshCcw className="w-8 h-8 text-gray-300 animate-spin" />
               </div>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Generando instancia...</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-emerald-900 rounded-xl shadow-xl shadow-emerald-900/10 p-6 flex items-start space-x-4 text-white">
         <div className="p-2 bg-emerald-800 rounded-lg text-emerald-400">
           <AlertCircle className="w-5 h-5" />
         </div>
         <div>
            <h4 className="text-sm font-bold tracking-tight uppercase tracking-widest opacity-60 mb-2">Instrucciones</h4>
            <ul className="space-y-1.5 text-xs text-emerald-100 list-none font-medium">
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> Abre WhatsApp en tu teléfono.</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> Selecciona "Dispositivos vinculados".</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> Escanea el código superior.</li>
            </ul>
         </div>
      </div>
    </div>
  );
}
