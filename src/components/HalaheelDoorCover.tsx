import React, { useState, useRef, useEffect } from 'react';
import { BabInvitationConfig } from '../types';
import { babAudio } from '../utils/babAudio';
import { Sparkles, Hand } from 'lucide-react';

interface HalaheelDoorCoverProps {
  config: BabInvitationConfig;
  isOpen: boolean;
  onOpen: () => void;
  onRelock?: () => void;
}

interface TapRing {
  id: number;
  x: number;
  y: number;
}

export const HalaheelDoorCover: React.FC<HalaheelDoorCoverProps> = ({
  config,
  isOpen,
  onOpen,
}) => {
  const [knocks, setKnocks] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isKnocked, setIsKnocked] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isFullyClosed, setIsFullyClosed] = useState(false);
  const [tapRings, setTapRings] = useState<TapRing[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const tapIdRef = useRef(0);

  useEffect(() => {
    // Preload audio files
    babAudio.preloadSfx();
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsFadingOut(true);
      const timer = setTimeout(() => {
        setIsFullyClosed(true);
      }, 1100);
      return () => clearTimeout(timer);
    } else {
      setIsFadingOut(false);
      setIsFullyClosed(false);
      setKnocks(0);
      setIsPlaying(false);
    }
  }, [isOpen]);

  const coupleDisplayName = config.isSingleName
    ? config.groom
    : `${config.groom} & ${config.bride}`;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPlaying || isOpen || isFadingOut) return;

    const nextKnocks = knocks + 1;
    setKnocks(nextKnocks);

    // Visual tap ring
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const currentId = ++tapIdRef.current;
    setTapRings((prev) => [...prev, { id: currentId, x, y }]);
    setTimeout(() => {
      setTapRings((prev) => prev.filter((r) => r.id !== currentId));
    }, 750);

    // Bump animation on door
    setIsKnocked(true);
    setTimeout(() => setIsKnocked(false), 180);

    // Audio knock & arm music for autoplay
    babAudio.playKnock(nextKnocks);
    babAudio.armMusic();

    // Haptic vibration
    if (navigator.vibrate) {
      try {
        navigator.vibrate(28);
      } catch (_) {}
    }

    // 3rd knock triggers door open
    if (nextKnocks >= 3) {
      setTimeout(() => {
        triggerDoorOpen();
      }, 250);
    }
  };

  const triggerDoorOpen = () => {
    if (isPlaying || isOpen || isFadingOut) return;
    setIsPlaying(true);

    const vid = videoRef.current;
    let sfxPlayed = false;

    const playCreakAndMusic = () => {
      if (sfxPlayed) return;
      sfxPlayed = true;
      babAudio.playDoorOpening();
      setTimeout(() => {
        babAudio.startCelebrationMusic(config.musicYoutubeId);
      }, 2400);
    };

    if (vid) {
      vid.currentTime = 0;
      const onTimeUpdate = () => {
        if (vid.currentTime >= 1.2) {
          playCreakAndMusic();
        }
      };

      const onEnded = () => {
        vid.removeEventListener('timeupdate', onTimeUpdate);
        vid.removeEventListener('ended', onEnded);
        setIsFadingOut(true);
        setTimeout(onOpen, 100);
      };

      vid.addEventListener('timeupdate', onTimeUpdate);
      vid.addEventListener('ended', onEnded, { once: true });

      const playPromise = vid.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch(() => {
          playCreakAndMusic();
          setIsFadingOut(true);
          setTimeout(onOpen, 600);
        });
      }

      // Safety fallback timer
      setTimeout(() => {
        playCreakAndMusic();
        setIsFadingOut(true);
        setTimeout(onOpen, 600);
      }, 4200);
    } else {
      playCreakAndMusic();
      setIsFadingOut(true);
      setTimeout(onOpen, 600);
    }
  };

  if (isFullyClosed) return null;

  return (
    <div
      id="cover"
      className={`cover ${isPlaying ? 'is-playing' : ''} ${isKnocked ? 'is-knocked' : ''} ${
        isFadingOut ? 'is-open' : ''
      }`}
      onPointerDown={handlePointerDown}
      style={{
        background: '#2b1810 url("/templates/bab/assets/door-poster.jpg") center/cover no-repeat',
      }}
    >
      {/* Real Door MP4 Video with poster */}
      <video
        ref={videoRef}
        id="doorVid"
        className="cover__vid"
        poster="/templates/bab/assets/door-poster.jpg"
        muted
        playsInline
        preload="auto"
      >
        <source src="/templates/bab/assets/door.mp4" type="video/mp4" />
      </video>

      {/* Shadow Veil */}
      <div className="cover__veil" aria-hidden="true" />

      {/* Tap rings layer */}
      <div className="cover__taps" id="tapLayer" aria-hidden="true">
        {tapRings.map((ring) => (
          <span
            key={ring.id}
            className="tapring"
            style={{ left: `${ring.x}px`, top: `${ring.y}px` }}
          />
        ))}
      </div>

      {/* Door UI: Names, Hint, 3 dots */}
      <div className="cover__ui" id="coverUi">
        <p className="cover__names" id="coverNames">
          {coupleDisplayName}
        </p>

        <p className="cover__hint" id="knockHint">
          دُقّوا على الباب ثلاث دقّاتٍ ليُفتح
        </p>

        {/* 3 knock dots */}
        <div className="knocks" id="knocks" aria-hidden="true">
          {[1, 2, 3].map((num) => (
            <span
              key={num}
              className={`knocks__dot ${knocks >= num ? 'is-hit' : ''}`}
            />
          ))}
        </div>

        {/* Action Controls for guest */}
        <div className="mt-8 flex flex-col items-center gap-2.5 pointer-events-auto">
          {/* Main Knock / Open Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (knocks < 2) {
                // simulate knock
                const next = knocks + 1;
                setKnocks(next);
                babAudio.playKnock(next);
                setIsKnocked(true);
                setTimeout(() => setIsKnocked(false), 180);
              } else {
                setKnocks(3);
                babAudio.playKnock(3);
                triggerDoorOpen();
              }
            }}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c59b27] hover:brightness-110 text-[#3a2218] font-bold text-sm shadow-[0_6px_25px_rgba(212,175,55,0.45)] border border-[#fff2a8] transition-all transform active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Hand className="w-4 h-4 text-[#3a2218]" />
            <span>
              {knocks === 0
                ? 'اطرق الباب (الدقّة الأولى)'
                : knocks === 1
                ? 'اطرق ثانيةً (الدقّة الثانية)'
                : 'اطرق لفتح الباب الآن ✨'}
            </span>
          </button>

          {/* Quick Instant Open Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerDoorOpen();
            }}
            className="px-4 py-1.5 rounded-full bg-black/50 hover:bg-black/75 border border-white/25 text-[#fdf7e7] text-xs font-tajawal transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#f0e0b4]" />
            <span>أو انقر هنا لفتح الباب مباشرة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
