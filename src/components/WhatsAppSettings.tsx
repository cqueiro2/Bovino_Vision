import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  Info,
  Settings,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';

export default function WhatsAppSettings() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [status, setStatus] = useState<'not_registered' | 'active' | 'loading'>('loading');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check status if phone is in localStorage
    const savedPhone = localStorage.getItem('whatsapp_phone');
    if (savedPhone) {
      setPhoneNumber(savedPhone);
      fetchStatus(savedPhone);
    } else {
      setStatus('not_registered');
    }
  }, []);

  const fetchStatus = async (phone: string) => {
    setStatus('loading');
    try {
      const res = await fetch(`/api/whatsapp/status/${phone}`);
      const data = await res.json();
      if (data.status === 'active') {
        setStatus('active');
      } else {
        setStatus('not_registered');
      }
    } catch (err) {
      setError("Erro ao verificar status.");
      setStatus('not_registered');
    }
  };

  const handleRegister = async () => {
    if (!phoneNumber) return;
    setIsRegistering(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/whatsapp/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneNumber })
      });
      if (res.ok) {
        localStorage.setItem('whatsapp_phone', phoneNumber);
        setStatus('active');
        setSuccess(true);
      } else {
        throw new Error("Falha no registro");
      }
    } catch (err) {
      setError("Não foi possível ativar o WhatsApp. Tente novamente.");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div className="bg-white rounded-[40px] p-8 shadow-xl border border-gray-100">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-emerald-100 p-4 rounded-3xl">
            <MessageSquare className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900">Agente WhatsApp</h2>
            <p className="text-gray-500 font-medium">Envie fotos e dados direto pelo celular</p>
          </div>
        </div>

        {status === 'active' ? (
          <div className="space-y-6">
            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex items-center gap-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              <div>
                <h3 className="font-bold text-emerald-900">WhatsApp Ativado</h3>
                <p className="text-emerald-700 text-sm">Vinculado ao número: <span className="font-mono font-bold">{phoneNumber}</span></p>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-3xl space-y-4">
              <h4 className="font-bold text-gray-800 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-500" />
                Como usar o Agente:
              </h4>
              <ul className="space-y-3">
                <li className="flex gap-3 text-sm text-gray-600">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center font-bold text-xs border border-gray-200 shrink-0">1</div>
                  <p>Envie uma <b>foto</b> de um animal para iniciar a análise automática.</p>
                </li>
                <li className="flex gap-3 text-sm text-gray-600">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center font-bold text-xs border border-gray-200 shrink-0">2</div>
                  <p>Para pré-registro, envie mensagens como: <br/>
                    <code className="bg-gray-200 px-1 rounded">Raça: Nelore</code><br/>
                    <code className="bg-gray-200 px-1 rounded">Idade: 24 meses</code><br/>
                    <code className="bg-gray-200 px-1 rounded">Sexo: Macho</code>
                  </p>
                </li>
              </ul>
            </div>

            <button 
              onClick={() => {
                localStorage.removeItem('whatsapp_phone');
                setStatus('not_registered');
                setPhoneNumber('');
              }}
              className="w-full py-4 text-red-600 font-bold hover:bg-red-50 rounded-2xl transition-colors"
            >
              Desativar Integração
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Seu Número de WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="tel" 
                  placeholder="Ex: 5511999999999" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>
              <p className="text-[10px] text-gray-400 px-2 italic">Inclua o código do país e DDD (apenas números)</p>
            </div>

            <button 
              onClick={handleRegister}
              disabled={isRegistering || !phoneNumber}
              className="w-full bg-emerald-500 text-white py-5 rounded-3xl font-black text-lg shadow-lg hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isRegistering ? <Loader2 className="w-6 h-6 animate-spin" /> : <RefreshCw className="w-6 h-6" />}
              ATIVAR AGENTE WHATSAPP
            </button>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-700">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">WhatsApp configurado com sucesso!</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-blue-50 p-6 rounded-[32px] border border-blue-100 flex items-start gap-4">
        <Settings className="w-6 h-6 text-blue-600 shrink-0" />
        <div>
          <h4 className="font-bold text-blue-900 mb-1">Configuração do Webhook</h4>
          <p className="text-blue-700 text-xs leading-relaxed">
            Para que o agente funcione, configure o webhook do seu provedor (Twilio/Z-API/etc) para:<br/>
            <code className="bg-white/50 px-1 rounded font-mono">{window.location.origin}/api/whatsapp/webhook</code>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
