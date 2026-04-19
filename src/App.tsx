import React from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetalle from './pages/LeadDetalle';
import Pipeline from './pages/Pipeline';
import Messages from './pages/Messages';
import Logs from './pages/Logs';
import WhatsApp from './pages/WhatsApp';
import Config from './pages/Config';
import { LayoutDashboard, Users, Kanban as KanbanIcon, MessageSquare, ListTodo, MessageCircle, Settings, Power, PowerOff, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';

function Layout() {
  const { logout, user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [botStatus, setBotStatus] = useState<any>(null);

  const fetchBotStatus = async () => {
    const res = await fetch('/api/bot/status', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setBotStatus(await res.json());
  };

  useEffect(() => {
    fetchBotStatus();
    const interval = setInterval(fetchBotStatus, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const toggleBot = async () => {
    const action = botStatus?.running ? 'stop' : 'start';
    await fetch(`/api/bot/${action}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchBotStatus();
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Leads', path: '/leads', icon: Users },
    { name: 'Pipeline', path: '/pipeline', icon: KanbanIcon },
    { name: 'Mensajes', path: '/messages', icon: MessageSquare },
    { name: 'Historial', path: '/logs', icon: ListTodo },
    { name: 'WhatsApp', path: '/whatsapp', icon: MessageCircle },
    { name: 'Configuración', path: '/config', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-black text-white text-lg">A</div>
          <span className="text-xl font-bold tracking-tight">AfiliadoBot</span>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Bot Status</span>
              <span className={`flex h-2 w-2 rounded-full ${botStatus?.running ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
            </div>
            
            <p className="text-sm font-bold text-white px-1">
              {botStatus?.running ? 'Running Active' : 'Instance Stopped'}
            </p>
            
            <div className="mt-3 space-y-2">
              <button
                onClick={toggleBot}
                className={`w-full py-2 text-[10px] font-black rounded uppercase tracking-wider transition-all transform active:scale-95 ${
                  botStatus?.running 
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-900/20' 
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
                }`}
              >
                {botStatus?.running ? 'Stop Instance' : 'Start Bot'}
              </button>
              
              <div className="flex items-center justify-between px-1 text-[10px] font-bold">
                <span className="text-slate-500 uppercase">Enviados hoy</span>
                <span className="text-emerald-400 font-mono">{botStatus?.dailyCount || 0} / {botStatus?.maxDaily || 0}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full mt-4 flex items-center px-4 py-2 text-xs font-bold text-slate-500 rounded-lg hover:text-white hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0 shadow-sm z-10">
          <h1 className="text-xl font-black text-gray-800 tracking-tight">Control Central</h1>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-700">{user?.name || 'Usuario'}</p>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Afiliado Pro</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-emerald-500 flex items-center justify-center font-bold text-emerald-600 shrink-0 overflow-hidden shadow-sm">
               {user?.name?.[0].toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-8 custom-scrollbar">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/leads/:id" element={<LeadDetalle />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/whatsapp" element={<WhatsApp />} />
          <Route path="/config" element={<Config />} />
        </Route>
      </Route>
    </Routes>
  );
}
