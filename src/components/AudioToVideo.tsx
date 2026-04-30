import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, 
  Video, 
  Download, 
  Trash2, 
  Play, 
  Pause, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  Clock,
  Settings,
  Type
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function AudioToVideo() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportComplete, setExportComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  
  // Settings
  const [bgColor, setBgColor] = useState('#000000');
  const [resolution, setResolution] = useState<{w: number, h: number}>({ w: 1920, h: 1080 });
  const [fps, setFps] = useState(30);
  const [overlayText, setOverlayText] = useState("");
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setError("Please select a valid audio file.");
      return;
    }

    setError(null);
    setAudioFile(file);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(file));
    setExportComplete(false);
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const exportVideo = async () => {
    if (!audioFile || !audioRef.current) return;

    setIsExporting(true);
    setExportProgress(0);
    setError(null);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = resolution.w;
      canvas.height = resolution.h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not initialize canvas context");

      // Setup audio
      const audioContext = new AudioContext();
      const source = audioContext.createMediaElementSource(audioRef.current);
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);
      source.connect(audioContext.destination);

      const combinedStream = new MediaStream();
      
      // Get video track from canvas
      const canvasStream = canvas.captureStream(fps);
      canvasStream.getVideoTracks().forEach(track => combinedStream.addTrack(track));
      
      // Get audio track from destination
      destination.stream.getAudioTracks().forEach(track => combinedStream.addTrack(track));

      const mimeType = MediaRecorder.isTypeSupported('video/mp4') 
        ? 'video/mp4' 
        : 'video/webm;codecs=vp9';
      
      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 5000000 // 5Mbps
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audio_export_${Date.now()}.${mimeType === 'video/mp4' ? 'mp4' : 'webm'}`;
        a.click();
        URL.revokeObjectURL(url);
        setIsExporting(false);
        setExportComplete(true);
        audioRef.current?.pause();
        audioRef.current!.currentTime = 0;
        setIsPlaying(false);
      };

      // Start recording
      recorder.start();
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
      setIsPlaying(true);

      const render = () => {
        if (recorder.state === 'inactive') return;

        // Draw background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw text if exists
        if (overlayText) {
          ctx.fillStyle = '#ffffff';
          ctx.font = `${canvas.height / 20}px "DM Sans", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(overlayText, canvas.width / 2, canvas.height / 2);
        }

        // Progress
        if (audioRef.current) {
          const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
          setExportProgress(progress);

          if (audioRef.current.currentTime >= audioRef.current.duration) {
            recorder.stop();
            return;
          }
        }

        requestAnimationFrame(render);
      };

      render();

    } catch (err) {
      console.error(err);
      setError("Export failed. Please check browser permissions and try again.");
      setIsExporting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-12"
    >
      <div className="flex items-center justify-between border-b border-zinc-800 pb-8">
        <div>
          <h2 className="font-display text-4xl text-white italic">Audio to MP4</h2>
          <p className="font-mono text-xs text-zinc-500 mt-2 uppercase tracking-widest">
            Convert sound files to blank video files for ingestion
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-full">
            <Music className="text-[#FF3366]" size={20} />
          </div>
          <div className="h-px w-8 bg-zinc-800" />
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-full">
            <Video className="text-cyan-400" size={20} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Interface */}
        <div className="md:col-span-2 space-y-6">
          {!audioFile ? (
            <label className="group relative block w-full aspect-video border-2 border-dashed border-zinc-800 rounded-2xl hover:border-zinc-600 transition-all cursor-pointer overflow-hidden">
              <input type="file" accept="audio/*" className="hidden" onChange={handleFileChange} />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950/50 group-hover:bg-zinc-900/50 transition-colors">
                <div className="p-5 bg-zinc-900 rounded-full border border-zinc-800 group-hover:scale-110 transition-transform">
                  <Music className="text-zinc-600 group-hover:text-white transition-colors" size={32} />
                </div>
                <div className="text-center">
                  <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Drop audio file here</p>
                  <p className="font-display text-lg text-zinc-700 italic group-hover:text-zinc-400 mt-1 transition-colors">WAV, MP3, M4A up to 50MB</p>
                </div>
              </div>
            </label>
          ) : (
            <div className="space-y-6">
              <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-8">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                      <Music className="text-[#FF3366]" size={24} />
                    </div>
                    <div>
                      <h4 className="font-display text-2xl text-white italic truncate max-w-xs">{audioFile.name}</h4>
                      <div className="flex items-center gap-3 mt-1 text-zinc-500">
                        <span className="font-mono text-[10px] uppercase">{(audioFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                        <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                        <span className="font-mono text-[10px] uppercase">{formatTime(duration)}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setAudioFile(null);
                      setAudioUrl(null);
                      setExportComplete(false);
                    }}
                    className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <audio 
                  ref={audioRef} 
                  src={audioUrl || ""} 
                  onLoadedMetadata={onLoadedMetadata}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />

                <div className="flex items-center gap-6">
                  <button
                    onClick={() => {
                      if (isPlaying) audioRef.current?.pause();
                      else audioRef.current?.play();
                    }}
                    className="w-14 h-14 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
                  >
                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                  </button>
                  
                  <div className="flex-1 space-y-2">
                    <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-white"
                        animate={{ width: audioRef.current ? `${(audioRef.current.currentTime / duration) * 100}%` : '0%' }}
                        transition={{ duration: 0.1, ease: 'linear' }}
                      />
                    </div>
                    <div className="flex justify-between font-mono text-[8px] text-zinc-600 uppercase tracking-widest">
                      <span>{audioRef.current ? formatTime(audioRef.current.currentTime) : "0:00"}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {isExporting ? (
                <div className="bg-white text-black p-8 rounded-2xl flex flex-col items-center gap-6">
                  <div className="relative">
                    <Loader2 className="animate-spin text-black" size={48} />
                    <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-bold">
                      {Math.round(exportProgress)}%
                    </span>
                  </div>
                  <div className="text-center">
                    <h5 className="font-display text-2xl italic">Synthesizing Video Stream</h5>
                    <p className="font-mono text-[10px] text-zinc-600 mt-2 uppercase tracking-widest">Keep this tab active until export completes</p>
                  </div>
                  <div className="w-full max-w-sm h-1.5 bg-black/10 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-black"
                      initial={{ width: 0 }}
                      animate={{ width: `${exportProgress}%` }}
                    />
                  </div>
                </div>
              ) : exportComplete ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-8 rounded-2xl flex flex-col items-center gap-4">
                  <CheckCircle2 size={48} />
                  <div className="text-center">
                    <h5 className="font-display text-2xl italic">Export Successful</h5>
                    <p className="font-mono text-[10px] uppercase tracking-widest mt-2">{audioFile.name} is ready</p>
                  </div>
                  <button 
                    onClick={exportVideo}
                    className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest border border-emerald-500/30 px-6 py-2 hover:bg-emerald-500 hover:text-black transition-all"
                  >
                    <Download size={12} />
                    Download Again
                  </button>
                </div>
              ) : (
                <button
                  onClick={exportVideo}
                  className="w-full py-6 bg-[#FF3366] text-white font-mono text-sm uppercase tracking-[0.2em] hover:bg-[#E62E5C] transition-all flex items-center justify-center gap-3 rounded-2xl shadow-xl shadow-pink-900/20 active:scale-[0.98]"
                >
                  <Video size={18} />
                  Generate MP4 for Export
                </button>
              )}

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="p-4 bg-red-950/30 border border-red-900/50 rounded-xl flex items-center gap-3 text-red-400"
                  >
                    <AlertCircle size={18} />
                    <span className="font-mono text-[10px] uppercase tracking-widest">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
              <Settings size={14} />
              <span className="font-mono text-[10px] uppercase tracking-widest">Export Settings</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest">Background Color</label>
                <div className="flex gap-2">
                  {['#000000', '#111111', '#1e1e1e', '#22c55e', '#3b82f6'].map(color => (
                    <button
                      key={color}
                      onClick={() => setBgColor(color)}
                      className={cn(
                        "w-6 h-6 rounded-full border-2 transition-all",
                        bgColor === color ? "border-white scale-110" : "border-transparent"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input 
                    type="color" 
                    value={bgColor} 
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-6 h-6 bg-transparent border-none p-0 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest">Resolution</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '1080p', w: 1920, h: 1080 },
                    { label: 'Vertical', w: 1080, h: 1920 },
                  ].map(res => (
                    <button
                      key={res.label}
                      onClick={() => setResolution({ w: res.w, h: res.h })}
                      className={cn(
                        "font-mono text-[8px] uppercase tracking-widest py-2 border transition-all",
                        resolution.w === res.w ? "bg-white text-black border-white" : "border-zinc-800 text-zinc-500 hover:border-zinc-600"
                      )}
                    >
                      {res.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 font-mono text-[8px] text-zinc-600 uppercase tracking-widest">
                  <Type size={10} />
                  Overlay Text (Title Safe)
                </div>
                <input 
                  type="text"
                  value={overlayText}
                  onChange={(e) => setOverlayText(e.target.value)}
                  placeholder="Optional title overlay..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-[10px] font-mono text-zinc-400 outline-none focus:border-zinc-600 transition-colors"
                />
              </div>

              <div className="pt-4 border-t border-zinc-800">
                <div className="flex items-center gap-2 text-amber-500/70">
                  <AlertCircle size={12} />
                  <p className="font-mono text-[8px] uppercase leading-relaxed tracking-wider">
                    Export time equals audio duration. Do not minimize or hide this window while rendering.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#FF3366]/5 border border-[#FF3366]/10 rounded-2xl p-6">
            <h5 className="font-display text-lg text-white italic mb-2">Why use this?</h5>
            <p className="font-mono text-[9px] text-zinc-500 leading-relaxed uppercase tracking-wider">
              Many professional suites (e.g. CapCut, Avid, DaVinci) prefer video containers for ingestion. This creates a "Master Audio Print" in a standard MP4 format.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
