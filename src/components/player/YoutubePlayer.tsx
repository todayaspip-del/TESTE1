import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, CheckCircle, Flame, Volume2, VolumeX, Maximize2, ShieldAlert, Sparkles } from 'lucide-react';
import { formatDuration } from '../../lib/youtube';
import { CompletionRule } from '../../types';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YoutubePlayerProps {
  videoId: string;
  lessonId: string;
  initialPositionSeconds?: number;
  completionRule?: CompletionRule;
  onProgressUpdate: (currentSeconds: number, durationSeconds: number, forceComplete?: boolean) => void;
  onEnded?: () => void;
  isCompleted?: boolean;
}

export const YoutubePlayer: React.FC<YoutubePlayerProps> = ({
  videoId,
  lessonId,
  initialPositionSeconds = 0,
  completionRule = 'WATCH_80',
  onProgressUpdate,
  onEnded,
  isCompleted = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const pollTimerRef = useRef<any>(null);
  const debounceTimerRef = useRef<any>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialPositionSeconds);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isApiReady, setIsApiReady] = useState(false);
  const [useFallbackEmbed, setUseFallbackEmbed] = useState(false);

  // Keep latest callbacks in refs so the player-init effect doesn't need
  // them as dependencies (which was causing the player to be destroyed
  // and recreated - i.e. "restart" - every time state like isPlaying changed).
  const onEndedRef = useRef(onEnded);
  const initialPositionRef = useRef(initialPositionSeconds);
  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  // Debounced progress reporter (10 seconds debounce or instant on pause/end)
  const onProgressUpdateRef = useRef(onProgressUpdate);
  useEffect(() => {
    onProgressUpdateRef.current = onProgressUpdate;
  }, [onProgressUpdate]);

  const reportProgress = useCallback(
    (curTime: number, totalDur: number, forceInstant: boolean = false) => {
      if (totalDur <= 0 && curTime <= 0) return;

      if (forceInstant) {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        onProgressUpdateRef.current(curTime, totalDur);
        return;
      }

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        onProgressUpdateRef.current(curTime, totalDur);
      }, 3000); // 3s debounce for responsive UI feedback
    },
    [] // stable forever - reads latest callback via ref, doesn't force player re-init
  );

  // Load YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        setIsApiReady(true);
      };
    } else if (window.YT && window.YT.Player) {
      setIsApiReady(true);
    }

    // Safety fallback timer if API script doesn't load within 4s
    const timeout = setTimeout(() => {
      if (!playerRef.current) {
        setUseFallbackEmbed(true);
      }
    }, 4000);

    return () => clearTimeout(timeout);
  }, []);

  // Initialize or update YouTube Player when videoId or isApiReady changes
  useEffect(() => {
    if (!isApiReady || !videoId || !containerRef.current) return;

    // Destroy existing player if any
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (e) {
        console.error(e);
      }
    }

    const playerId = `yt-player-${lessonId}-${videoId}`;
    let playerElement = document.getElementById(playerId);
    if (!playerElement) {
      playerElement = document.createElement('div');
      playerElement.id = playerId;
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(playerElement);
    }

    try {
      playerRef.current = new window.YT.Player(playerId, {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          start: Math.floor(initialPositionRef.current || 0),
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            const dur = event.target.getDuration();
            setDuration(dur || 0);
            const startVol = event.target.getVolume ? event.target.getVolume() : 100;
            setVolume(startVol);
            setIsMuted(event.target.isMuted ? event.target.isMuted() : false);
            if (initialPositionRef.current > 0 && initialPositionRef.current < dur) {
              event.target.seekTo(initialPositionRef.current, true);
            }
          },
          onStateChange: (event: any) => {
            const state = event.data;
            // YT.PlayerState.PLAYING = 1, PAUSED = 2, ENDED = 0
            if (state === 1) {
              setIsPlaying(true);
            } else if (state === 2) {
              setIsPlaying(false);
              const cur = event.target.getCurrentTime();
              const dur = event.target.getDuration();
              setCurrentTime(cur);
              reportProgress(cur, dur, true);
            } else if (state === 0) {
              setIsPlaying(false);
              const dur = event.target.getDuration();
              setCurrentTime(dur);
              reportProgress(dur, dur, true);
              if (onEndedRef.current) onEndedRef.current();
            }
          },
          onError: (e: any) => {
            console.warn('YouTube player error, switching to fallback iframe', e);
            setUseFallbackEmbed(true);
          },
        },
      });
    } catch (err) {
      console.error('Failed to init YT player:', err);
      setUseFallbackEmbed(true);
    }

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
    // Only re-create the player when the video/lesson actually changes or the
    // API becomes ready. reportProgress/onEnded are read via refs above so
    // they must NOT be listed here - otherwise every parent re-render
    // (e.g. triggered by pausing) would destroy & recreate the player,
    // which looked like the video "restarting" instead of pausing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, lessonId, isApiReady]);

  // Polling every 1s for precise playback progress and current time
  useEffect(() => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    pollTimerRef.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const cur = playerRef.current.getCurrentTime() || 0;
          const dur = playerRef.current.getDuration() || duration;
          setCurrentTime(cur);
          if (dur && dur !== duration) {
            setDuration(dur);
          }
          if (isPlaying) {
            reportProgress(cur, dur, false);
          }
        } catch (e) {
          // Player might be unmounting
        }
      }
    }, 1000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isPlaying, duration, reportProgress]);

  // Controls
  const togglePlay = () => {
    if (!playerRef.current) return;
    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const seekTo = (seconds: number) => {
    if (!playerRef.current) return;
    try {
      playerRef.current.seekTo(seconds, true);
      setCurrentTime(seconds);
      reportProgress(seconds, duration, true);
    } catch (e) {
      console.error(e);
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (!playerRef.current) return;
    try {
      playerRef.current.setPlaybackRate(rate);
      setPlaybackRate(rate);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    try {
      if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
        if (volume === 0) {
          playerRef.current.setVolume(50);
          setVolume(50);
        }
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const changeVolume = (value: number) => {
    if (!playerRef.current) return;
    try {
      const clamped = Math.max(0, Math.min(100, value));
      playerRef.current.setVolume(clamped);
      setVolume(clamped);
      if (clamped === 0) {
        playerRef.current.mute();
        setIsMuted(true);
      } else if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const progressPercent = duration > 0 ? Math.min(100, Math.round((currentTime / duration) * 100)) : 0;

  const getRuleDescription = () => {
    switch (completionRule) {
      case 'WATCH_80':
        return 'Conclusão automática ao atingir 80% do vídeo';
      case 'WATCH_90':
        return 'Conclusão automática ao atingir 90% do vídeo';
      case 'WATCH_100':
        return 'Conclusão automática ao assistir até o final';
      case 'MANUAL':
        return 'Conclusão manual pelo botão "Marcar como Concluída"';
    }
  };

  return (
    <div className="w-full bg-[#121418] border border-slate-800 rounded-none overflow-hidden shadow-2xl flex flex-col">
      {/* Video Viewport */}
      <div className="relative aspect-video w-full bg-black">
        {useFallbackEmbed ? (
          <iframe
            className="w-full h-full"
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&enablejsapi=1&rel=0`}
            title="Video Aula Bombeiro Civil"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div ref={containerRef} className="w-full h-full" />
        )}

        {/* Floating Rule Badge */}
        <div className="absolute top-3 left-3 pointer-events-none z-10 flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-none bg-[#0c0b0e]/90 backdrop-blur-md border border-slate-700/60 text-xs font-semibold text-white shadow-lg">
            <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
            <span>Regra: {completionRule}</span>
          </div>
          {isCompleted && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-none bg-emerald-950/90 backdrop-blur-md border border-emerald-500/50 text-xs font-semibold text-emerald-300 shadow-lg">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Aula Concluída</span>
            </div>
          )}
        </div>
      </div>

      {/* Modern Control Bar */}
      <div className="p-4 bg-[#0c0b0e] border-t border-slate-800 flex flex-col gap-3">
        {/* Scrubber / Progress Bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400 min-w-[45px]">
            {formatDuration(currentTime)}
          </span>
          <div
            className="relative flex-1 h-2 bg-slate-800 rounded-none cursor-pointer group"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pos = (e.clientX - rect.left) / rect.width;
              if (duration > 0) {
                seekTo(pos * duration);
              }
            }}
          >
            {/* Background Completion Threshold Mark */}
            {completionRule === 'WATCH_80' && (
              <div className="absolute left-[80%] top-0 bottom-0 w-0.5 bg-orange-400 z-10" title="Meta de 80%" />
            )}
            {completionRule === 'WATCH_90' && (
              <div className="absolute left-[90%] top-0 bottom-0 w-0.5 bg-orange-400 z-10" title="Meta de 90%" />
            )}

            <div
              className={`h-full rounded-none transition-all duration-200 ${
                isCompleted ? 'bg-emerald-500' : 'bg-orange-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-mono text-slate-400 min-w-[45px] text-right">
            {formatDuration(duration || 0)}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="flex items-center justify-center w-10 h-10 rounded-none bg-orange-600 hover:bg-orange-500 text-white transition shadow-lg shadow-orange-950/50 cursor-pointer"
              title={isPlaying ? 'Pausar' : 'Reproduzir'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>

            <button
              onClick={() => seekTo(0)}
              className="flex items-center justify-center w-9 h-9 rounded-none bg-[#121418] hover:bg-slate-800 border border-slate-700 text-white transition cursor-pointer"
              title="Reiniciar aula"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 bg-[#121418] border border-slate-700 rounded-none pl-1 pr-3 h-9">
              <button
                onClick={toggleMute}
                className="flex items-center justify-center w-8 h-9 text-white transition cursor-pointer shrink-0"
                title={isMuted ? 'Ativar som' : 'Silenciar'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-orange-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={isMuted ? 0 : volume}
                onChange={(e) => changeVolume(Number(e.target.value))}
                className="w-20 accent-orange-500 cursor-pointer"
                title="Volume"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Speed Selector */}
            <div className="flex items-center bg-[#121418] border border-slate-800 rounded-none p-0.5">
              {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                <button
                  key={rate}
                  onClick={() => changePlaybackRate(rate)}
                  className={`px-2 py-1 text-xs font-medium rounded-none transition cursor-pointer ${
                    playbackRate === rate
                      ? 'bg-orange-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            {/* Quick Progress Indicator */}
            <div className="px-3 py-1.5 rounded-none bg-[#121418] border border-slate-800 flex items-center gap-2 text-xs">
              <span className="text-slate-400">Progresso:</span>
              <span className="font-mono font-bold text-white">{progressPercent}%</span>
            </div>
          </div>
        </div>

        {/* Pedagogical Rule Explanation */}
        <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/50 pt-2">
          <div className="flex items-center gap-1.5 text-slate-400">
            <ShieldAlert className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span>{getRuleDescription()}</span>
          </div>
          <div className="text-slate-400 hidden sm:block">
            Sincronização contínua com prontuário militar
          </div>
        </div>
      </div>
    </div>
  );
};
