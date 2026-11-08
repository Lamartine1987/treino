import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, RotateCcw, Plus, X, Bell } from 'lucide-react';

interface RestTimerProps {
  initialSeconds?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const RestTimer: React.FC<RestTimerProps> = ({ initialSeconds = 60, isOpen, onClose }) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(true);
  const [totalTime, setTotalTime] = useState(initialSeconds);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
    setTotalTime(initialSeconds);
    setIsActive(true);
  }, [initialSeconds]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      setIsActive(false);
      // Notificação tátil/vibratória e som
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 400]);
      }
      playBeep();
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft]);

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // Nota A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch {
      // Navegadores com restrição de autoplay
    }
  };

  if (!isOpen) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progressPercent = totalTime > 0 ? ((totalTime - secondsLeft) / totalTime) * 100 : 100;

  return (
    <div className="fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-slate-900/95 backdrop-blur border border-emerald-500/40 rounded-2xl shadow-2xl p-4 text-white animate-in slide-in-from-bottom-6 duration-300">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
          <Timer className="w-4 h-4 animate-pulse" />
          <span>Descanso entre séries</span>
        </div>
        <button 
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          aria-label="Fechar timer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="my-4 flex items-center justify-between">
        <div className="text-4xl font-extrabold tracking-tight font-mono text-emerald-400">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSecondsLeft(prev => prev + 15)}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-lg text-slate-300 flex items-center gap-1 transition"
          >
            <Plus className="w-3.5 h-3.5" /> 15s
          </button>
          <button
            onClick={() => setIsActive(!isActive)}
            className={`p-2.5 rounded-xl font-bold transition flex items-center justify-center ${
              isActive ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
          </button>
          <button
            onClick={() => {
              setSecondsLeft(totalTime);
              setIsActive(true);
            }}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
        <div 
          className="bg-emerald-500 h-full transition-all duration-1000 ease-linear rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {secondsLeft === 0 && (
        <div className="mt-2 text-xs font-semibold text-emerald-400 flex items-center gap-1 justify-center animate-bounce">
          <Bell className="w-3.5 h-3.5" />
          Hora da próxima série! Vamos lá!
        </div>
      )}
    </div>
  );
};
