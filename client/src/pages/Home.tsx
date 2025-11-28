import { APP_LOGO } from "@/const";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [statusText, setStatusText] = useState("Presiona para escuchar");
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(70);
  const audioRef = useRef<HTMLAudioElement>(null);
  const retryCountRef = useRef(0);
  const userPausedRef = useRef(false);
  const MAX_RETRIES = 5;
  const STREAM_URL = "https://s47.myradiostream.com:12110/listen.m4a";

  useEffect(() => {
    // Restaurar volumen guardado
    const savedVolume = localStorage.getItem("fm93-volume");
    if (savedVolume) {
      const vol = parseInt(savedVolume);
      setVolume(vol);
      if (audioRef.current) {
        audioRef.current.volume = vol / 100;
      }
    } else if (audioRef.current) {
      audioRef.current.volume = 0.7;
    }

    // Registrar Service Worker para PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        console.log('Service Worker registered successfully:', reg);
      }).catch(error => {
        console.log('Service Worker registration failed:', error);
      });
    }
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      userPausedRef.current = true;
      audioRef.current.pause();
      setIsPlaying(false);
      setStatusText("Presiona para escuchar");
      setIsLoading(false);
    } else {
      userPausedRef.current = false;
      audioRef.current.play().catch((error) => {
        console.error("Error al reproducir:", error);
        setStatusText("Error al conectar");
        setIsLoading(false);
      });
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
    localStorage.setItem("fm93-volume", newVolume.toString());
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      setIsPlaying(true);
      setStatusText("Conectando...");
      setIsLoading(true);
      retryCountRef.current = 0;
      userPausedRef.current = false;
    };

    const handlePause = () => {
      if (!userPausedRef.current && isPlaying && retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        setStatusText("Reconectando...");
        setTimeout(() => {
          audio.play().catch((err) => console.error("Error en reintento:", err));
        }, 2000);
      } else if (userPausedRef.current) {
        setIsPlaying(false);
        setStatusText("Presiona para escuchar");
        setIsLoading(false);
      }
    };

    const handlePlaying = () => {
      setIsLoading(false);
      setStatusText("En vivo");
      retryCountRef.current = 0;
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setStatusText("Conectando...");
    };

    const handleStalled = () => {
      if (isPlaying && retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        setStatusText("Reconectando...");
        setTimeout(() => {
          audio.play().catch((err) => console.error("Error en reintento:", err));
        }, 1000);
      }
    };

    const handleError = () => {
      setIsPlaying(false);
      setIsLoading(false);
      if (audio.error) {
        switch (audio.error.code) {
          case audio.error.MEDIA_ERR_NETWORK:
            setStatusText("Error de red");
            break;
          case audio.error.MEDIA_ERR_DECODE:
            setStatusText("Error de decodificación");
            break;
          case audio.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            setStatusText("Formato no soportado");
            break;
          default:
            setStatusText("Error de conexión");
        }
      }
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("stalled", handleStalled);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("stalled", handleStalled);
      audio.removeEventListener("error", handleError);
    };
  }, [isPlaying]);

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-gradient-to-br from-black to-[#0a2a0a]">
      <div className="w-full max-w-[500px] flex flex-col items-center gap-8 animate-in fade-in duration-500">
        {/* Logo */}
        <div className="text-center mt-5 animate-in slide-in-from-top duration-600">
          <img
            src={APP_LOGO}
            alt="FM93 Online"
            className="max-w-[200px] w-full h-auto drop-shadow-[0_0_20px_rgba(0,255,0,0.3)]"
          />
        </div>

        {/* Player Container */}
        <div className="flex flex-col items-center gap-5 w-full animate-in zoom-in duration-700">
          {/* Play Button */}
          <button
            onClick={togglePlay}
            className={`w-[200px] h-[200px] rounded-full bg-gradient-radial from-[rgba(0,255,0,0.3)] to-[rgba(0,255,0,0.05)] border-4 border-[#00ff00] flex items-center justify-center cursor-pointer transition-all duration-300 shadow-[0_0_30px_rgba(0,255,0,0.5),inset_0_0_30px_rgba(0,255,0,0.1)] hover:scale-105 hover:shadow-[0_0_50px_rgba(0,255,0,0.8),inset_0_0_30px_rgba(0,255,0,0.2)] active:scale-[0.98] relative overflow-hidden ${
              isPlaying ? "playing" : ""
            }`}
          >
            <div className="absolute inset-0 rounded-full border-2 border-[rgba(0,255,0,0.3)] animate-pulse" />
            <div
              className={`transition-all duration-300 ${
                isPlaying
                  ? "w-8 h-12 border-l-[15px] border-r-[15px] border-[#00ff00]"
                  : "w-0 h-0 border-l-[60px] border-l-[#00ff00] border-t-[40px] border-t-transparent border-b-[40px] border-b-transparent ml-4"
              }`}
            />
          </button>

          {/* Status Text */}
          <div className="text-lg font-semibold text-[#00ff00] text-shadow-[0_0_10px_rgba(0,255,0,0.5)] text-center min-h-[30px] flex items-center gap-2">
            {statusText}
            {isLoading && (
              <div className="w-5 h-5 border-2 border-[#00ff00] border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          {/* Volume Container */}
          <div className="flex items-center gap-4 w-full max-w-[300px] justify-center p-5 bg-[rgba(0,255,0,0.05)] border-2 border-[rgba(0,255,0,0.2)] rounded-2xl animate-in slide-in-from-bottom duration-800">
            <div className="text-2xl min-w-[30px] text-center">🔊</div>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 min-w-[150px] h-2 rounded bg-[rgba(0,255,0,0.2)] outline-none appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #00ff00 0%, #00ff00 ${volume}%, rgba(0, 255, 0, 0.2) ${volume}%, rgba(0, 255, 0, 0.2) 100%)`,
              }}
            />
            <div className="text-sm font-semibold text-[#00ff00] min-w-[45px] text-right">
              {volume}%
            </div>
          </div>
        </div>

        {/* App Download Section */}
        <div className="flex flex-col items-center gap-4 w-full mb-6">
          <h2 className="text-lg font-semibold text-white text-center">
            Descarga nuestra App aquí
          </h2>
          <div className="flex flex-col sm:flex-row justify-center items-stretch gap-4 w-full sm:w-auto">
            {/* Android Button */}
            <a
           href="https://play.google.com/store/apps/details?id=com.fm93.radio" 
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-5 py-3 bg-green-600 hover:bg-green-500 rounded-xl shadow-lg shadow-green-900/20 transition-all duration-300 group"
          title="Descarga nuestra app en Google Play"
        >
          {/* Android Robot Icon */}
          <div className="text-white">
             <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                <path d="M16.6 5.66l1.7-2.95c.13-.22.06-.51-.16-.64-.22-.13-.51-.06-.64.16l-1.72 2.97C14.49 4.69 13.29 4.41 12 4.41s-2.49.28-3.78.8L6.5 2.23c-.13-.22-.42-.29-.64-.16-.22.13-.29.42-.16.64l1.7 2.95C5.07 7.02 3.5 9.35 3.5 12h17c0-2.65-1.57-4.98-3.9-6.34zM9 9.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM3.5 13v6c0 1.66 1.34 3 3 3h11c1.66 0 3-1.34 3-3v-6h-17z" />
             </svg>
          </div>
          <div className="text-left">
            <div className="text-[10px] uppercase text-green-100 font-medium">Disponible en</div>
            <div className="text-sm font-bold text-white leading-tight">Google Play Store</div>
          </div>
            </a>
            
           {/* iPhone Button - Próximamente */}
            <a
              href="#"
              className="flex items-center gap-3 px-5 py-3 bg-gray-700 hover:bg-gray-700 rounded-xl shadow-lg transition-all duration-300 opacity-60 cursor-not-allowed"
              title="Próximamente en App Store"
              onClick={(e) => e.preventDefault()}
            >
              {/* Apple Icon */}
              <div className="text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-[10px] uppercase text-gray-300 font-medium">Próximamente en</div>
                <div className="text-sm font-bold text-white leading-tight">App Store</div>
              </div>
            </a>
          </div>
        </div>

        {/* Social Buttons */}
        <div className="flex justify-center items-center gap-4 w-full mb-8">
          <a
            href="https://t.me/+59893972093"
            target="_blank"
            rel="noopener noreferrer"
            className="w-[50px] h-[50px] rounded-full border-2 border-[#0088cc] text-[#0088cc] flex items-center justify-center text-2xl transition-all duration-300 hover:bg-[rgba(0,136,204,0.1)] hover:shadow-[0_0_20px_rgba(0,136,204,0.5)] hover:scale-110"
            title="Telegram"
          >
            ✈️
          </a>
          <a
            href="https://wa.me/59893972093"
            target="_blank"
            rel="noopener noreferrer"
            className="w-[50px] h-[50px] rounded-full border-2 border-[#25d366] text-[#25d366] flex items-center justify-center text-2xl transition-all duration-300 hover:bg-[rgba(37,211,102,0.1)] hover:shadow-[0_0_20px_rgba(37,211,102,0.5)] hover:scale-110"
            title="WhatsApp"
          >
            💬
          </a>
          <a
            href="https://www.instagram.com/fm93.uy/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-[50px] h-[50px] rounded-full border-2 border-[#ff1744] text-[#ff1744] flex items-center justify-center text-2xl transition-all duration-300 hover:bg-[rgba(255,23,68,0.1)] hover:shadow-[0_0_20px_rgba(255,23,68,0.5)] hover:scale-110"
            title="Instagram"
          >
            📷
          </a>
          <a
            href="mailto:fmnoventaytres@gmail.com"
            className="w-[50px] h-[50px] rounded-full border-2 border-white text-white flex items-center justify-center text-2xl transition-all duration-300 hover:bg-[rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.5)] hover:scale-110"
            title="Email"
          >
            ✉️
          </a>
        </div>

        {/* Info Text */}
        <div className="text-xs text-gray-400 text-center mt-5">
          FM93 Online - Grandes Canciones
          <br />
          Tacuarembó, Uruguay
        </div>

        {/* Footer */}
        <div className="text-xs text-gray-500 text-center mb-5">
          <a
            href="https://automaias-web.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 hover:text-gray-300 transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m4.93 19.07 1.41-1.41" />
              <path d="m17.66 6.34 1.41-1.41" />
              <circle cx="12" cy="12" r="4" />
            </svg>
            <span>
              Diseñado y Desarrollado por <strong>Automaias</strong>
            </span>
          </a>
        </div>
      </div>

      {/* Audio Element */}
      <audio ref={audioRef} src={STREAM_URL} crossOrigin="anonymous" />
    </div>
  );
}
