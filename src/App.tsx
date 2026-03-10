/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Camera, 
  History, 
  Settings, 
  Activity,
  Menu, 
  X,
  CheckCircle2,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewMode } from './types';
import Dashboard from './components/Dashboard';
import ImageAnalysis from './components/ImageAnalysis';

export default function App() {
  const [view, setView] = useState<ViewMode>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'analysis', label: 'Análise', icon: Camera },
    { id: 'history', label: 'Histórico', icon: History },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex text-[#1A1A1A] font-sans">
      {/* Sidebar */}
      <aside 
        className={`bg-white border-r border-gray-200 transition-all duration-300 flex flex-col ${
          isSidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="p-6 flex items-center gap-3 border-b border-gray-100">
          <div className="bg-emerald-800 p-2 rounded-lg">
            <Activity className="text-white w-6 h-6" />
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col">
              <span className="font-black text-lg leading-tight tracking-tight text-emerald-900">Bovino Vision AI</span>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Monitoramento Inteligente</span>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewMode)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                view === item.id 
                  ? 'bg-emerald-50 text-emerald-800 font-bold shadow-sm' 
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {isSidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center justify-center p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <h2 className="text-xl font-bold text-gray-800">
            {navItems.find(i => i.id === view)?.label}
          </h2>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" />
              SISTEMA ONLINE
            </div>
            <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200 hover:bg-gray-200 transition-all">
              <User className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {view === 'dashboard' && <Dashboard />}
              {view === 'analysis' && <ImageAnalysis />}
              {view === 'history' && (
                <div className="bg-white p-12 rounded-[32px] border border-gray-200 shadow-sm text-center max-w-md mx-auto mt-12">
                  <History className="w-16 h-16 text-gray-200 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Histórico Vazio</h3>
                  <p className="text-gray-500">Suas análises salvas aparecerão aqui para acompanhamento da evolução do rebanho.</p>
                </div>
              )}
              {view === 'settings' && (
                <div className="bg-white p-8 rounded-[32px] border border-gray-200 shadow-sm max-w-2xl mx-auto">
                  <h3 className="text-2xl font-bold mb-8">Ajustes do Sistema</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-6 border border-gray-100 rounded-3xl bg-gray-50/50">
                      <div>
                        <p className="font-bold text-gray-900">Notificações Inteligentes</p>
                        <p className="text-sm text-gray-500">Alertas automáticos de saúde e peso</p>
                      </div>
                      <div className="w-14 h-8 bg-emerald-500 rounded-full relative cursor-pointer">
                        <div className="absolute right-1 top-1 w-6 h-6 bg-white rounded-full shadow-sm" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-6 border border-gray-100 rounded-3xl bg-gray-50/50">
                      <div>
                        <p className="font-bold text-gray-900">Integração WhatsApp</p>
                        <p className="text-sm text-gray-500">Receba relatórios diretamente no seu número</p>
                      </div>
                      <div className="w-14 h-8 bg-gray-200 rounded-full relative cursor-pointer">
                        <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow-sm" />
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
