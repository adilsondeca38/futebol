/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { Search, Tv, Trophy, Clock, RefreshCw, AlertCircle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Match } from './types';

const API_KEY = import.meta.env.VITE_ALLSPORTS_API_KEY || 'a38fec8b57cb914393b6ba8e055f267fce91dec0b31c9874ce72527210bd86b8';

export default function App() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastUpdate, setLastUpdate] = useState<string>('Conectando...');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketUrl = `wss://wss.allsportsapi.com/live_events?APIkey=${API_KEY}&timezone=+03:00`;
    let socket: WebSocket | null = null;

    const connect = () => {
      socket = new WebSocket(socketUrl);

      socket.onopen = () => {
        console.log('Conectado ao WebSocket da AllSportsAPI');
        setIsConnected(true);
        setError(null);
        setLoading(false);
      };

      socket.onmessage = (e) => {
        if (e.data) {
          try {
            const matchesData = JSON.parse(e.data);
            // AllSportsAPI pode enviar um array de partidas ou um objeto único
            const newMatches = Array.isArray(matchesData) ? matchesData : [matchesData];
            
            setMatches(prev => {
              // Criar um mapa das partidas existentes para atualização eficiente
              const matchMap = new Map(prev.map(m => [m.event_key, m]));
              
              newMatches.forEach(m => {
                matchMap.set(m.event_key, m);
              });

              return Array.from(matchMap.values());
            });

            setLastUpdate(new Date().toLocaleTimeString());
          } catch (err) {
            console.error('Erro ao processar dados do WebSocket:', err);
          }
        }
      };

      socket.onerror = (err) => {
        console.error('Erro no WebSocket:', err);
        setError('Erro na conexão em tempo real.');
        setIsConnected(false);
      };

      socket.onclose = () => {
        console.log('Conexão WebSocket fechada. Tentando reconectar...');
        setIsConnected(false);
        // Tentar reconectar após 5 segundos
        setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      if (socket) socket.close();
    };
  }, []);

  const filteredMatches = useMemo(() => {
    return matches.filter((m) =>
      (m.event_home_team || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.event_away_team || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.league_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [matches, searchTerm]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-50 font-sans selection:bg-sky-500/30">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col items-center">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-2 mb-2"
          >
            <div className="bg-sky-500 p-2 rounded-xl shadow-lg shadow-sky-500/20">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter italic text-white">
              FUT<span className="text-sky-400">AOVIVO</span>
            </h1>
          </motion.div>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Transmissão Ultra Rápida via WebSocket</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Status Bar */}
        <div className="flex justify-between items-center mb-6 text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            </span>
            <span>{isConnected ? 'LIVE: ALLSPORTSAPI' : 'RECONECTANDO...'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-sky-400' : 'text-slate-500'}`} />
            <span>ATUALIZADO: {lastUpdate}</span>
          </div>
        </div>

        {/* Search Box */}
        <div className="relative mb-8 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-sky-400 transition-colors" />
          <input
            type="text"
            placeholder="Filtrar por time ou campeonato..."
            className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Content */}
        <div className="space-y-4">
          {loading && matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
              <p className="text-sky-400 font-bold animate-pulse">⚡ Aguardando dados ao vivo...</p>
            </div>
          ) : error && matches.length === 0 ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <p className="text-red-200 font-medium">{error}</p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="text-center py-20 bg-slate-800/20 rounded-3xl border border-dashed border-slate-700">
              <Trophy className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Nenhum jogo ao vivo detectado.</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredMatches.map((match) => (
                <motion.div
                  key={match.event_key}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 hover:bg-slate-800/60 hover:border-sky-500/30 transition-all group shadow-lg"
                >
                  <div className="flex justify-between items-center gap-4 mb-6">
                    <div className="flex-1 text-center">
                      <div className="text-lg font-bold text-white group-hover:text-sky-100 transition-colors leading-tight">
                        {match.event_home_team}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center min-w-[100px]">
                      <div className="text-3xl font-black text-sky-400 tracking-tighter">
                        {match.event_final_result || 'X'}
                      </div>
                      {match.event_status && (
                        <span className="text-[10px] font-black bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded-full mt-1">
                          {match.event_status}'
                        </span>
                      )}
                    </div>

                    <div className="flex-1 text-center">
                      <div className="text-lg font-bold text-white group-hover:text-sky-100 transition-colors leading-tight">
                        {match.event_away_team}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      <div className="flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-sky-500/50" />
                        {match.league_name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-sky-500/50" />
                        {match.event_time}
                      </div>
                    </div>

                    <div className="w-full h-px bg-slate-700/50 my-1"></div>

                    <div className="flex flex-wrap justify-center gap-2">
                       <span className="bg-slate-900/80 text-sky-400 border border-sky-500/20 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight flex items-center gap-1.5 shadow-sm">
                        <Tv className="w-3 h-3" />
                        AO VIVO
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">
          Conectado via AllSportsAPI WebSocket • {new Date().getFullYear()} FutAoVivo
        </p>
      </footer>
    </div>
  );
}
