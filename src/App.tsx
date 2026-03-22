/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Camera, 
  History as HistoryIcon, 
  Settings, 
  Activity,
  Menu, 
  X,
  CheckCircle2,
  User,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewMode } from './types';
import Dashboard from './components/Dashboard';
import ImageAnalysis from './components/ImageAnalysis';
import History from './components/History';
import SyncManager from './components/SyncManager';
import WhatsAppSettings from './components/WhatsAppSettings';
import Login from './components/Login';
import { supabase } from './lib/supabase';

export default function App() {
  const [user, setUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('dashboard');

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user?.email || null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user?.email || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const [isSidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile
  const [isDesktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  const [isWhatsAppEnabled, setIsWhatsAppEnabled] = useState(() => {
    return localStorage.getItem('whatsapp_enabled') === 'true';
  });

  const toggleWhatsApp = () => {
    const newState = !isWhatsAppEnabled;
    setIsWhatsAppEnabled(newState);
    localStorage.setItem('whatsapp_enabled', String(newState));
  };

  const navItems = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'analysis', label: 'Análise', icon: Camera },
    { id: 'history', label: 'Histórico', icon: HistoryIcon },
    ...(isWhatsAppEnabled ? [{ id: 'whatsapp', label: 'WhatsApp', icon: Database }] : []),
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={(email) => setUser(email)} />;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex text-[#1A1A1A] font-sans">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-40 lg:hidden backdrop-blur-sm"
            />
        )}
      </AnimatePresence>

      {/* Sidebar (Mobile & Desktop) */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-300 flex flex-col ${
          isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${
          isDesktopSidebarOpen ? 'lg:w-64' : 'lg:w-20'
        }`}
      >
        <div className="p-6 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-800 p-2 rounded-lg">
              <Activity className="text-white w-6 h-6" />
            </div>
            {(isSidebarOpen || isDesktopSidebarOpen) && (
              <div className="flex flex-col">
                <span className="font-black text-lg leading-tight tracking-tight text-emerald-900">Bovino Vision</span>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Monitoramento</span>
              </div>
            )}
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-gray-400 hover:bg-gray-50 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setView(item.id as ViewMode);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                view === item.id 
                  ? 'bg-emerald-50 text-emerald-800 font-bold shadow-sm' 
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {(isSidebarOpen || isDesktopSidebarOpen) && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 hidden lg:block">
          <button 
            onClick={() => setDesktopSidebarOpen(!isDesktopSidebarOpen)}
            className="w-full flex items-center justify-center p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
          >
            {isDesktopSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-gray-800">
              {navItems.find(i => i.id === view)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" />
              SISTEMA ONLINE
            </div>
            <button 
              onClick={handleLogout}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200 hover:bg-gray-200 transition-all"
            >
              <User className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <SyncManager />
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full max-w-7xl mx-auto"
            >
              {view === 'dashboard' && <Dashboard />}
              {view === 'analysis' && <ImageAnalysis />}
              {view === 'history' && <History />}
              {view === 'whatsapp' && <WhatsAppSettings />}
              {view === 'settings' && (
                <div className="bg-white p-8 rounded-[32px] border border-gray-200 shadow-sm max-w-2xl mx-auto">
                  <h3 className="text-2xl font-bold mb-8">Ajustes do Sistema</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-6 border border-gray-100 rounded-3xl bg-[#f9fafb]">
                      <div>
                        <p className="font-bold text-gray-900">Notificações Inteligentes</p>
                        <p className="text-sm text-gray-500">Alertas automáticos de saúde e peso</p>
                      </div>
                      <div className="w-14 h-8 bg-emerald-500 rounded-full relative cursor-pointer">
                        <div className="absolute right-1 top-1 w-6 h-6 bg-white rounded-full shadow-sm" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-6 border border-gray-100 rounded-3xl bg-[#f9fafb]">
                      <div>
                        <p className="font-bold text-gray-900">Integração WhatsApp</p>
                        <p className="text-sm text-gray-500">Habilitar agente para coleta de dados</p>
                      </div>
                      <div className="flex items-center gap-4">
                        {isWhatsAppEnabled && (
                          <button 
                            onClick={() => setView('whatsapp')}
                            className="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                          >
                            Configurar
                          </button>
                        )}
                        <div 
                          onClick={toggleWhatsApp}
                          className={`w-14 h-8 rounded-full relative cursor-pointer transition-colors ${isWhatsAppEnabled ? 'bg-emerald-500' : 'bg-gray-200'}`}
                        >
                          <motion.div 
                            animate={{ x: isWhatsAppEnabled ? 24 : 0 }}
                            className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow-sm" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
