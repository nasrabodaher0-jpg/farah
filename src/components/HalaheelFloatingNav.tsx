import React, { useState, useEffect } from 'react';
import { BabInvitationConfig } from '../types';
import { babAudio } from '../utils/babAudio';
import { Sliders, Share2, RefreshCw, Sparkles, Calendar, Music, Eye, ShieldCheck, Lock } from 'lucide-react';

interface HalaheelFloatingNavProps {
  config: BabInvitationConfig;
  isOpen: boolean;
  isGuestView?: boolean;
  isOwner?: boolean;
  onOpenDrawer: (tab?: 'share' | 'edit' | 'datetime' | 'music' | 'rsvps') => void;
  onOpenDoor: () => void;
  onRelockDoor: () => void;
  onToggleGuestView?: (isGuest: boolean) => void;
}

export const HalaheelFloatingNav: React.FC<HalaheelFloatingNavProps> = ({
  config,
  isOpen,
  isGuestView = false,
  isOwner = true,
  onOpenDrawer,
  onOpenDoor,
  onRelockDoor,
  onToggleGuestView,
}) => {
  const [isMusicPlaying, setIsMusicPlaying] = useState(babAudio.getIsPlaying());

  useEffect(() => {
    return babAudio.subscribe((playing) => {
      setIsMusicPlaying(playing);
    });
  }, []);

  const handleToggleMusic = () => {
    babAudio.toggleMusic(config.musicYoutubeId);
  };

  return (
    <>
      {/* Top Floating Discrete Host Bar - ONLY visible in Owner/Edit Mode */}
      {!isGuestView && (
        <aside
          id="halaheel-host-bar"
          aria-label="خيارات تخصيص الدعوة ومشاركتها"
          className="fixed top-3 left-1/2 -translate-x-1/2 z-[110] max-w-xl w-[94%] sm:w-auto"
        >
          <div className="bg-[#fcf9f0]/95 backdrop-blur-md border border-[#a97fc0]/40 rounded-full px-3 py-1.5 shadow-[0_8px_30px_rgba(76,58,40,0.18)] flex items-center justify-between gap-1.5 sm:gap-2 text-xs text-[#4c3a28]">
            
            <button
              onClick={() => onOpenDrawer('share')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#a97fc0] hover:bg-[#976cb0] text-white font-bold transition-all shadow-sm cursor-pointer"
              title="مشاركة رابط الضيوف المحمي"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>مشاركة الدعوة (محمية)</span>
            </button>

            <button
              onClick={() => onOpenDrawer('datetime')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full hover:bg-[#efe7d3] text-[#7d5694] font-medium transition-all cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-[#a97fc0]" />
              <span className="hidden sm:inline">الوقت والتاريخ</span>
            </button>

            <button
              onClick={() => onOpenDrawer('edit')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full hover:bg-[#efe7d3] text-[#7d5694] font-medium transition-all cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تعديل الأسماء</span>
            </button>

            <button
              onClick={() => onOpenDrawer('music')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full hover:bg-[#efe7d3] text-[#7d5694] font-medium transition-all cursor-pointer"
            >
              <Music className="w-3.5 h-3.5 text-[#a97fc0]" />
              <span className="hidden md:inline">الزفة</span>
            </button>

            {onToggleGuestView && (
              <button
                onClick={() => onToggleGuestView(true)}
                title="معاينة ما يراه الضيف تماماً (قفل التعديل)"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#efe4d0] hover:bg-[#e6d8c0] text-[#5a3a20] font-semibold transition-all cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-[#a97fc0]" />
                <span className="hidden sm:inline">معاينة كضيف</span>
              </button>
            )}

            {!isOpen ? (
              <button
                onClick={onOpenDoor}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full hover:bg-[#efe7d3] text-[#5a3a20] font-bold transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#c9a45c]" />
                <span className="hidden sm:inline">فتح الباب</span>
              </button>
            ) : (
              <button
                onClick={onRelockDoor}
                title="إعادة قفل الباب لتجربة الطرق"
                className="flex items-center gap-1 px-2 py-1.5 rounded-full hover:bg-[#efe7d3] text-[#8d7b64] font-medium transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">إعادة</span>
              </button>
            )}

          </div>
        </aside>
      )}

      {/* Floating Mode Switcher for Owner when testing Guest Preview */}
      {isGuestView && isOwner && onToggleGuestView && (
        <aside className="fixed bottom-4 left-4 z-[110]">
          <button
            onClick={() => onToggleGuestView(false)}
            className="bg-[#4c3a28]/95 hover:bg-[#35281a] text-[#fcf9f0] text-xs font-bold px-3.5 py-2 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.35)] flex items-center gap-2 backdrop-blur-md border border-[#c9a45c]/50 transition-all cursor-pointer hover:scale-105 active:scale-95"
            title="انقر للعودة لوضع صاحب الدعوة والتعديل"
          >
            <Lock className="w-3.5 h-3.5 text-[#e0b86b]" />
            <span>معاينة كضيف 🔒 (العودة للتعديل ✏️)</span>
          </button>
        </aside>
      )}

      {/* Floating Music Button (Identical to Halaheel da3wa-music - available for BOTH host and guests) */}
      <button
        id="da3wa-music"
        type="button"
        onClick={handleToggleMusic}
        title={isMusicPlaying ? 'إيقاف نغمات الفرح' : 'تشغيل نغمات الفرح'}
        aria-label="تشغيل أو إيقاف الموسيقى"
      >
        {isMusicPlaying ? '🔊' : '🎵'}
      </button>
    </>
  );
};
