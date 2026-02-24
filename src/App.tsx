/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Analytics } from '@vercel/analytics/react';
import { useState, useEffect, useMemo } from 'react';
import { Search, Trophy, Clock, RefreshCw, AlertCircle, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { CricketMatch } from './types';

const VITE_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const API_KEY = VITE_KEY && VITE_KEY.length > 20 ? VITE_KEY : 'be81f8eee5mshe1ee61d0c561b88p1b4302jsn6adab1a597f7';
const API_HOST = import.meta.env.VITE_RAPIDAPI_HOST || 'cricbuzz-cricket.p.rapidapi.com';

export default function App() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastUpdate, setLastUpdate] = useState<string>('Conectando...');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Usando o endpoint de partidas ao vivo/recentes para uma visão geral
      // O usuário forneceu um ID específico (40381), mas para um app útil, buscamos a lista
      const response = await fetch(`https://${API_HOST}/matches/v1/live`, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': API_KEY,
          'x-rapidapi-host': API_HOST,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const status = response.status;
        const text = await response.text();
        console.error(`Erro da API: ${status} - ${text}`);
        
        if (status === 401) throw new Error('Chave API inválida.');
        if (status === 403) throw new Error('Acesso negado: Verifique sua assinatura.');
        if (status === 429) throw new Error('Limite de requisições excedido.');
        
        throw new Error(`Erro na API (${status})`);
      }

      const data = await response.json();
      
      // Processar a estrutura complexa do Cricbuzz
      const allMatches: any[] = [];
      if (data.typeMatches) {
        data.typeMatches.forEach((type: any) => {
          if (type.seriesMatches) {
            type.seriesMatches.forEach((series: any) => {
              if (series.seriesAdWrapper && series.seriesAdWrapper.matches) {
                series.seriesAdWrapper.matches.forEach((m: any) => {
                  allMatches.push({
                    id: m.matchInfo.matchId,
                    description: m.matchInfo.matchDesc,
                    series: m.matchInfo.seriesName,
                    venue: m.matchInfo.venueInfo.ground,
                    status: m.matchInfo.status,
                    team1: m.matchInfo.team1.teamName,
                    team2: m.matchInfo.team2.teamName,
                    score1: m.matchScore?.team1Score?.inngs1?.runs ? `${m.matchScore.team1Score.inngs1.runs}/${m.matchScore.team1Score.inngs1.wickets || 0}` : 'N/A',
                    score2: m.matchScore?.team2Score?.inngs1?.runs ? `${m.matchScore.team2Score.inngs1.runs}/${m.matchScore.team2Score.inngs1.wickets || 0}` : 'N/A',
                  });
                });
              }
            });
          }
        });
      }

      setMatches(allMatches);
      setLastUpdate(new Date().toLocaleTimeString());
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Falha na conexão com o servidor de Cricket.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 300000); // 5 min
    return () => clearInterval(interval);
  }, []);

  const filteredMatches = useMemo(() => {
    return matches.filter((m) =>
      (m.team1 || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.team2 || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.series || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [matches, searchTerm]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-50 font-sans selection:bg-emerald-500/30">
      <Analytics />
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col items-center">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-2 mb-2"
          >
            <div className="bg-emerald-500 p-2 rounded-xl shadow-lg shadow-emerald-500/20">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter italic text-white">
              CRIC<span className="text-emerald-400">LIVE</span>
            </h1>
          </motion.div>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Resultados de Cricket em Tempo Real</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Status Bar */}
        <div className="flex justify-between items-center mb-6 text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>SISTEMA CRICBUZZ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-emerald-400' : 'text-slate-500'}`} />
            <span>ATUALIZADO: {lastUpdate}</span>
          </div>
        </div>

        {/* Search Box */}
        <div className="relative mb-8 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
          <input
            type="text"
            placeholder="Filtrar por time ou série..."
            className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Content */}
        <div className="space-y-4">
          {loading && matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
              <p className="text-emerald-400 font-bold animate-pulse">🏏 Buscando partidas ao vivo...</p>
            </div>
          ) : error && matches.length === 0 ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <p className="text-red-200 font-medium">{error}</p>
              <button 
                onClick={fetchData}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="text-center py-20 bg-slate-800/20 rounded-3xl border border-dashed border-slate-700">
              <Trophy className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Nenhuma partida encontrada.</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredMatches.map((match) => (
                <motion.div
                  key={match.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 hover:bg-slate-800/60 hover:border-emerald-500/30 transition-all group shadow-lg"
                >
                  <div className="flex justify-between items-center gap-4 mb-6">
                    <div className="flex-1 text-center">
                      <div className="text-lg font-bold text-white group-hover:text-emerald-100 transition-colors leading-tight">
                        {match.team1}
                      </div>
                      <div className="text-xl font-black text-emerald-400 mt-1">{match.score1}</div>
                    </div>
                    
                    <div className="flex flex-col items-center min-w-[60px]">
                      <div className="text-xs font-black text-slate-500 uppercase tracking-widest">VS</div>
                    </div>

                    <div className="flex-1 text-center">
                      <div className="text-lg font-bold text-white group-hover:text-emerald-100 transition-colors leading-tight">
                        {match.team2}
                      </div>
                      <div className="text-xl font-black text-emerald-400 mt-1">{match.score2}</div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-3">
                    <div className="text-center">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-1">
                        {match.series}
                      </div>
                      <div className="text-xs font-medium text-slate-400 italic">
                        {match.status}
                      </div>
                    </div>

                    <div className="w-full h-px bg-slate-700/50 my-1"></div>

                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      <div className="flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-emerald-500/50" />
                        {match.description}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-500/50" />
                        {match.venue}
                      </div>
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
          Dados fornecidos por Cricbuzz via RapidAPI • {new Date().getFullYear()} CricLive
        </p>
      </footer>
    </div>
  );
}
