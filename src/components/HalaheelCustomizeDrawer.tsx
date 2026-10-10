import React, { useState, useEffect } from 'react';
import { BabInvitationConfig, RSVPResponse } from '../types';
import { encodeInvitationToUrl, buildWhatsAppShareMessage } from '../utils/invitationCodec';
import {
  X,
  Copy,
  Check,
  Send,
  Sliders,
  Users,
  QrCode,
  RefreshCw,
  Calendar,
  Clock,
  Sparkles,
  Plus,
  Trash2,
  Music,
  Play,
  Pause,
  Volume2,
  ShieldCheck,
  Lock,
  Eye,
} from 'lucide-react';
import {
  formatArabicDateTime,
  getDatePresets,
  toArabicDigits,
} from '../utils/dateHelpers';
import { babAudio, extractYouTubeId } from '../utils/babAudio';

export type DrawerTabType = 'share' | 'edit' | 'datetime' | 'music' | 'rsvps';

export const SONG_PRESETS = [
  {
    id: 'Hp8WTVqR_0U',
    title: 'زفة هلاهيل الفرح الرسمية (أقبلت نور الليالي)',
    desc: 'الزفة الأصلية والرسمية لقالب باب الفرح التفاعلي',
    badge: 'الأصلية',
  },
  {
    id: 'rL4p5_82f1A',
    title: 'زفة ماجد المهندس - عسى ربي يوفقكم',
    desc: 'زفة طربية فخمة ومباركة بصوت ماجد المهندس',
    badge: 'شائعة',
  },
  {
    id: 'a9j_mO5oK0M',
    title: 'زفة محمد عبده - ليلة خميس / أقبلت كالبدر',
    desc: 'فخامة كلاسيكية ملكية وألحان خليجية طربية',
    badge: 'كلاسيك',
  },
  {
    id: '6B78d91gL88',
    title: 'زفة حسين الجسمي - لا إله إلا الله',
    desc: 'زفة بهجة وفرحة مباركة تملأ المكان سروراً',
    badge: 'مبهجة',
  },
  {
    id: 'y954D1uM22w',
    title: 'معزوفة عود وتقاسيم شرقية ملكية هادئة',
    desc: 'عزف عود بدون غناء، أجواء راقية وأصيلة',
    badge: 'بدون غناء',
  },
];

interface HalaheelCustomizeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  config: BabInvitationConfig;
  onSaveConfig: (updated: BabInvitationConfig) => void;
  onRelockDoor: () => void;
  rsvps: RSVPResponse[];
  initialTab?: DrawerTabType;
  onPreviewAsGuest?: () => void;
}

export const HalaheelCustomizeDrawer: React.FC<HalaheelCustomizeDrawerProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onRelockDoor,
  rsvps,
  initialTab = 'share',
  onPreviewAsGuest,
}) => {
  const [formData, setFormData] = useState<BabInvitationConfig>(config);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<DrawerTabType>(initialTab);
  const [shareUrl, setShareUrl] = useState('');
  const [useLevantMonths, setUseLevantMonths] = useState(true);
  const [isMusicPlaying, setIsMusicPlaying] = useState(babAudio.getIsPlaying());

  useEffect(() => {
    return babAudio.subscribe((playing) => {
      setIsMusicPlaying(playing);
    });
  }, []);

  // Sync internal state when config or initialTab changes
  useEffect(() => {
    setFormData(config);
  }, [config]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (isOpen) {
      const generated = encodeInvitationToUrl(formData);
      setShareUrl(generated);
    }
  }, [isOpen, formData]);

  if (!isOpen) return null;

  const handleFieldChange = (field: keyof BabInvitationConfig, value: unknown) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onSaveConfig(updated);
  };

  const handleSelectSong = (preset: (typeof SONG_PRESETS)[0]) => {
    const updated: BabInvitationConfig = {
      ...formData,
      musicYoutubeId: preset.id,
      musicTitle: preset.title,
    };
    setFormData(updated);
    onSaveConfig(updated);
    babAudio.setVideoId(preset.id);
    if (isMusicPlaying) {
      babAudio.startCelebrationMusic(preset.id);
    }
  };

  const handleCustomSongUrl = (urlOrId: string) => {
    const cleanId = extractYouTubeId(urlOrId);
    const updated: BabInvitationConfig = {
      ...formData,
      musicYoutubeId: cleanId,
      musicTitle: 'أغنية مخصصة من يوتيوب',
    };
    setFormData(updated);
    onSaveConfig(updated);
    babAudio.setVideoId(cleanId);
    if (isMusicPlaying) {
      babAudio.startCelebrationMusic(cleanId);
    }
  };

  const handleToggleSongPreview = () => {
    babAudio.toggleMusic(formData.musicYoutubeId);
  };

  // Date and Time picker handlers
  const currentDateObj = new Date(formData.date);
  const validDate = isNaN(currentDateObj.getTime()) ? new Date() : currentDateObj;

  const pad = (n: number) => String(n).padStart(2, '0');
  const dateInputVal = `${validDate.getFullYear()}-${pad(validDate.getMonth() + 1)}-${pad(validDate.getDate())}`;
  const timeInputVal = `${pad(validDate.getHours())}:${pad(validDate.getMinutes())}`;

  const handleDateChange = (newDateStr: string) => {
    if (!newDateStr) return;
    const [y, m, d] = newDateStr.split('-').map(Number);
    const updatedDate = new Date(validDate);
    updatedDate.setFullYear(y, m - 1, d);

    const formatted = formatArabicDateTime(updatedDate, useLevantMonths);
    const updated: BabInvitationConfig = {
      ...formData,
      date: formatted.dateIso,
      dateText: formatted.dateText,
      timeText: formatted.timeText,
    };
    setFormData(updated);
    onSaveConfig(updated);
  };

  const handleTimeChange = (newTimeStr: string) => {
    if (!newTimeStr) return;
    const [h, min] = newTimeStr.split(':').map(Number);
    const updatedDate = new Date(validDate);
    updatedDate.setHours(h, min, 0, 0);

    const formatted = formatArabicDateTime(updatedDate, useLevantMonths);
    const updated: BabInvitationConfig = {
      ...formData,
      date: formatted.dateIso,
      timeText: formatted.timeText,
    };
    setFormData(updated);
    onSaveConfig(updated);
  };

  const handleApplyPreset = (presetDate: Date) => {
    const formatted = formatArabicDateTime(presetDate, useLevantMonths);
    const updated: BabInvitationConfig = {
      ...formData,
      date: formatted.dateIso,
      dateText: formatted.dateText,
      timeText: formatted.timeText,
    };
    setFormData(updated);
    onSaveConfig(updated);
  };

  const handleToggleMonthStyle = (levant: boolean) => {
    setUseLevantMonths(levant);
    const formatted = formatArabicDateTime(validDate, levant);
    handleFieldChange('dateText', formatted.dateText);
  };

  // Program timeline item handlers
  const handleUpdateProgramItem = (index: number, key: 'time' | 'title', val: string) => {
    const newProg = [...(formData.program || [])];
    if (newProg[index]) {
      newProg[index] = { ...newProg[index], [key]: val };
      handleFieldChange('program', newProg);
    }
  };

  const handleAddProgramItem = () => {
    const newProg = [...(formData.program || []), { time: '٨:٠٠ مساءً', title: 'فقرة جديدة' }];
    handleFieldChange('program', newProg);
  };

  const handleRemoveProgramItem = (index: number) => {
    const newProg = (formData.program || []).filter((_, i) => i !== index);
    handleFieldChange('program', newProg);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const whatsappMessage = buildWhatsAppShareMessage(formData, shareUrl);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    shareUrl
  )}&bgcolor=fcf9f0&color=4c3a28`;

  const presets = getDatePresets();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-xl max-h-[92vh] bg-[#fcf9f0] border-2 border-[#a97fc0] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[#4c3a28] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#a97fc0]/30 bg-[#f6f1e4]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#a97fc0] text-white flex items-center justify-center font-bold">
              ✦
            </div>
            <div>
              <h2 className="font-aref text-lg font-bold text-[#4c3a28]">
                تخصيص الدعوة ورابطك الخاص
              </h2>
              <p className="text-xs text-[#8d7b64]">
                تحكم بالأسماء، الوقت والتاريخ، ومشاركة الرابط
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className="p-1.5 rounded-full hover:bg-neutral-200 text-[#4c3a28] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center border-b border-[#a97fc0]/30 bg-[#efe7d3]/50 px-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('datetime')}
            className={`flex-1 py-3 px-2 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'datetime'
                ? 'border-[#a97fc0] text-[#7d5694] bg-[#a97fc0]/15'
                : 'border-transparent text-[#8d7b64] hover:text-[#4c3a28]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>الوقت والتاريخ</span>
          </button>

          <button
            onClick={() => setActiveTab('music')}
            className={`flex-1 py-3 px-2 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'music'
                ? 'border-[#a97fc0] text-[#7d5694] bg-[#a97fc0]/15'
                : 'border-transparent text-[#8d7b64] hover:text-[#4c3a28]'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>أغنية الزفة</span>
          </button>

          <button
            onClick={() => setActiveTab('share')}
            className={`flex-1 py-3 px-2 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'share'
                ? 'border-[#a97fc0] text-[#7d5694] bg-[#a97fc0]/15'
                : 'border-transparent text-[#8d7b64] hover:text-[#4c3a28]'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>رابط الدعوة الخاص</span>
          </button>

          <button
            onClick={() => setActiveTab('edit')}
            className={`flex-1 py-3 px-2 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'edit'
                ? 'border-[#a97fc0] text-[#7d5694] bg-[#a97fc0]/15'
                : 'border-transparent text-[#8d7b64] hover:text-[#4c3a28]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>الأسماء والمناسبة</span>
          </button>

          <button
            onClick={() => setActiveTab('rsvps')}
            className={`flex-1 py-3 px-2 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'rsvps'
                ? 'border-[#a97fc0] text-[#7d5694] bg-[#a97fc0]/15'
                : 'border-transparent text-[#8d7b64] hover:text-[#4c3a28]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>الحضور ({rsvps.length})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB: Date & Time (تعديل الوقت والتاريخ) */}
          {activeTab === 'datetime' && (
            <div className="space-y-4 text-right" dir="rtl">
              {/* Highlight summary card */}
              <div className="p-4 rounded-2xl bg-[#f6f1e4] border border-[#a97fc0]/40 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#a97fc0] block mb-0.5">
                    الموعد المحدد حالياً للدعوة والعد التنازلي:
                  </span>
                  <h4 className="font-aref text-lg font-bold text-[#4c3a28]">
                    {formData.dateText}
                  </h4>
                  <p className="text-xs text-[#7d5694] font-medium flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 inline" />
                    <span>{formData.timeText}</span>
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-[#a97fc0]/20 text-[#7d5694] flex items-center justify-center text-xl font-bold font-aref shadow-inner">
                  {toArabicDigits(validDate.getDate())}
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <label className="text-xs font-bold text-[#4c3a28] block mb-2 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#c9a45c]" />
                  <span>تعديل سريع للتاريخ:</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {presets.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(p.date)}
                      className="py-2.5 px-3 rounded-xl border border-[#a97fc0]/40 bg-white hover:bg-[#efe7d3] text-xs font-bold text-[#5a3a20] transition-colors text-right shadow-sm cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Precise Date & Time Picker */}
              <div className="p-4 rounded-2xl bg-white border border-[#a97fc0]/40 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-[#a97fc0]/20 pb-2">
                  <span className="text-xs font-bold text-[#4c3a28] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#a97fc0]" />
                    <span>تحديد التاريخ والساعة بدقة:</span>
                  </span>
                  {/* Style of months toggle */}
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-[#8d7b64]">الشهور:</span>
                    <button
                      type="button"
                      onClick={() => handleToggleMonthStyle(true)}
                      className={`px-2 py-0.5 rounded-lg font-medium transition-colors ${
                        useLevantMonths ? 'bg-[#a97fc0] text-white' : 'bg-neutral-100 text-[#4c3a28]'
                      }`}
                    >
                      تشرين/كانون
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleMonthStyle(false)}
                      className={`px-2 py-0.5 rounded-lg font-medium transition-colors ${
                        !useLevantMonths ? 'bg-[#a97fc0] text-white' : 'bg-neutral-100 text-[#4c3a28]'
                      }`}
                    >
                      نوفمبر/ديسمبر
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#4c3a28] block mb-1">
                      اختر يوم وتاريخ المناسبة:
                    </label>
                    <input
                      type="date"
                      value={dateInputVal}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#a97fc0]/40 bg-[#fcf9f0] font-mono text-sm focus:outline-[#a97fc0]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#4c3a28] block mb-1">
                      اختر وقت المناسبة:
                    </label>
                    <input
                      type="time"
                      value={timeInputVal}
                      onChange={(e) => handleTimeChange(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#a97fc0]/40 bg-[#fcf9f0] font-mono text-sm focus:outline-[#a97fc0]"
                    />
                  </div>
                </div>
              </div>

              {/* Formatted Text in Invitation (Editable for custom phrasing e.g. Hijri) */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#4c3a28]">
                      نص التاريخ المكتوب في بطاقة الدعوة:
                    </label>
                    <span className="text-[10px] text-[#8d7b64]">يتحدث تلقائياً أو عدله يدوياً</span>
                  </div>
                  <input
                    type="text"
                    value={formData.dateText}
                    onChange={(e) => handleFieldChange('dateText', e.target.value)}
                    placeholder="يوم الجمعة، ٢٠ تشرين الثاني ٢٠٢٦"
                    className="w-full p-2.5 rounded-xl border border-[#a97fc0]/40 bg-white text-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#4c3a28]">
                      نص الوقت المكتوب في بطاقة الدعوة:
                    </label>
                    <span className="text-[10px] text-[#8d7b64]">يتحدث تلقائياً أو عدله يدوياً</span>
                  </div>
                  <input
                    type="text"
                    value={formData.timeText}
                    onChange={(e) => handleFieldChange('timeText', e.target.value)}
                    placeholder="الساعة السابعة مساءً"
                    className="w-full p-2.5 rounded-xl border border-[#a97fc0]/40 bg-white text-sm"
                  />
                </div>
              </div>

              {/* Program schedule items sync */}
              <div className="pt-2 border-t border-[#a97fc0]/20">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#4c3a28] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#a97fc0]" />
                    <span>برنامج الحفل ومواعيد الفقرات:</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddProgramItem}
                    className="text-xs text-[#7d5694] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة فقرة</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {(formData.program || []).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#a97fc0]/30 shadow-sm"
                    >
                      <input
                        type="text"
                        value={item.time}
                        onChange={(e) => handleUpdateProgramItem(idx, 'time', e.target.value)}
                        placeholder="الوقت (مثال: ٧:٠٠ مساءً)"
                        className="w-32 p-1.5 rounded-lg border border-neutral-200 text-xs text-center"
                      />
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleUpdateProgramItem(idx, 'title', e.target.value)}
                        placeholder="اسم الفقرة (استقبال، عقد قران...)"
                        className="flex-1 p-1.5 rounded-lg border border-neutral-200 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveProgramItem(idx)}
                        aria-label="حذف الفقرة"
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: Music / Song Selection (أغنية الزفة) */}
          {activeTab === 'music' && (
            <div className="space-y-4 text-right" dir="rtl">
              {/* Current Active Song Card */}
              <div className="p-4 rounded-2xl bg-[#f6f1e4] border border-[#a97fc0]/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl shadow-md transition-transform ${
                      isMusicPlaying ? 'bg-[#a97fc0] scale-105' : 'bg-[#8d7b64]'
                    }`}
                  >
                    {isMusicPlaying ? (
                      <Volume2 className="w-6 h-6 animate-pulse" />
                    ) : (
                      <Music className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-[#a97fc0] block mb-0.5">
                      الأغنية المختارة حالياً للبطاقة:
                    </span>
                    <h4 className="font-aref text-base font-bold text-[#4c3a28]">
                      {formData.musicTitle || 'زفة هلاهيل الفرح الرسمية'}
                    </h4>
                    <span className="text-[11px] text-[#8d7b64] font-mono">
                      معرف يوتيوب: {formData.musicYoutubeId || 'Hp8WTVqR_0U'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleSongPreview}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                    isMusicPlaying
                      ? 'bg-rose-500 hover:bg-rose-600 text-white'
                      : 'bg-[#a97fc0] hover:bg-[#976cb0] text-white'
                  }`}
                >
                  {isMusicPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>إيقاف المؤقت</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>استماع للأغنية</span>
                    </>
                  )}
                </button>
              </div>

              {/* Curated Song Presets */}
              <div>
                <label className="text-xs font-bold text-[#4c3a28] block mb-2 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#c9a45c]" />
                  <span>اختر من باقة زفات هلاهيل والأغاني المختارة:</span>
                </label>

                <div className="space-y-2">
                  {SONG_PRESETS.map((song) => {
                    const isSelected = (formData.musicYoutubeId || 'Hp8WTVqR_0U') === song.id;
                    return (
                      <div
                        key={song.id}
                        onClick={() => handleSelectSong(song)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#a97fc0]/15 border-[#a97fc0] shadow-sm'
                            : 'bg-white hover:bg-[#efe7d3]/50 border-[#a97fc0]/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                              isSelected
                                ? 'bg-[#a97fc0] text-white'
                                : 'bg-[#efe7d3] text-[#7d5694]'
                            }`}
                          >
                            {isSelected ? '✓' : '♪'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-xs text-[#4c3a28]">{song.title}</h5>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#a97fc0]/10 text-[#7d5694] font-medium">
                                {song.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#8d7b64] mt-0.5">{song.desc}</p>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="text-xs font-bold text-[#7d5694] flex items-center gap-1 shrink-0">
                            <span>مفعلة</span>
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom YouTube Input */}
              <div className="p-4 rounded-2xl bg-white border border-[#a97fc0]/30 shadow-sm space-y-2">
                <label className="text-xs font-bold text-[#4c3a28] block">
                  أو ضع رابط أي أغنية أو زفة تفضلها من يوتيوب:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=... أو معرف الفيديو"
                    onChange={(e) => {
                      if (e.target.value.trim()) {
                        handleCustomSongUrl(e.target.value.trim());
                      }
                    }}
                    className="flex-1 p-2.5 rounded-xl border border-[#a97fc0]/40 bg-[#fcf9f0] text-xs font-mono text-left outline-none focus:border-[#a97fc0]"
                    dir="ltr"
                  />
                </div>
                <p className="text-[10px] text-[#8d7b64]">
                  💡 يمكنك نسخ رابط أي زفة أو أغنية تفضلها من تطبيق يوتيوب ولصقها هنا مباشرة لتنطلق فور فتح الباب.
                </p>
              </div>
            </div>
          )}

          {/* TAB: Share & WhatsApp */}
          {activeTab === 'share' && (
            <div className="space-y-4">
              {/* Security & Protection Banner */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300/80 flex items-start gap-3 text-right shadow-xs" dir="rtl">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <h4 className="font-bold text-emerald-950 flex items-center gap-1.5 mb-1">
                    <span>رابط الضيوف مقفل ومحمي تماماً ضد التعديل 🔒</span>
                  </h4>
                  <p className="text-emerald-800 leading-relaxed text-[11px]">
                    عند إرسال الرابط للضيوف أو نسخه، يدخل الضيف كـ <strong>مشاهد فقط</strong> ولا تظهر له أي أزرار أو خيارات للتعديل نهائياً، بل يستمتع بطرق الباب، المؤثرات، الزفة، تأكيد الحضور وإرسال التهاني.
                  </p>
                </div>
              </div>

              {/* Highlight Card */}
              <div className="p-4 rounded-2xl bg-[#f6f1e4] border border-[#a97fc0]/40 text-center">
                <p className="text-xs text-[#8d7b64] mb-1">
                  رابطك الخاص جاهز بنفس تصميم هلاهيل الأصلي باسم:
                </p>
                <h3 className="font-aref text-2xl font-bold text-[#4c3a28]">
                  {formData.isSingleName
                    ? formData.groom
                    : `${formData.groom} & ${formData.bride}`}
                </h3>
                <p className="text-xs text-[#7d5694] font-medium mt-1">
                  {formData.occasionKicker} • {formData.dateText} • {formData.timeText}
                </p>
              </div>

              {/* Direct WhatsApp Share Button */}
              <a
                id="share-whatsapp-direct-btn"
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-center block"
              >
                <Send className="w-4 h-4 inline" />
                <span>إرسال دعوة الضيوف المحمية عبر واتساب</span>
              </a>

              {/* Preview as Guest Button */}
              {onPreviewAsGuest && (
                <button
                  type="button"
                  onClick={onPreviewAsGuest}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-[#efe7d3] border-2 border-[#a97fc0]/40 text-[#7d5694] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <Eye className="w-4 h-4 text-[#a97fc0]" />
                  <span>معاينة وتجربة ما يراه الضيف الآن (بدون أدوات التعديل)</span>
                </button>
              )}

              {/* URL Box */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#4c3a28] flex items-center justify-between">
                  <span>رابط الدعوة الخاص بالضيوف (محمي - للعرض فقط):</span>
                  <span className="text-[10px] font-normal text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    🔒 مقفل ضد التعديل
                  </span>
                </label>
                <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-[#a97fc0]/40">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 text-xs text-neutral-600 bg-transparent outline-none font-mono select-all overflow-ellipsis"
                    dir="ltr"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 rounded-lg bg-[#a97fc0] hover:bg-[#976cb0] text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>تم النسخ!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>نسخ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-[#a97fc0]/30 shadow-sm">
                <img
                  src={qrImageUrl}
                  alt="QR Code"
                  className="w-24 h-24 rounded-xl border border-neutral-200 shadow-sm"
                />
                <div>
                  <h4 className="font-bold text-sm text-[#4c3a28] flex items-center gap-1.5 mb-1">
                    <QrCode className="w-4 h-4 text-[#a97fc0]" />
                    <span>رمز الاستجابة السريع (QR Code)</span>
                  </h4>
                  <p className="text-xs text-[#8d7b64] leading-relaxed">
                    يمكن للضيوف مسح هذا الرمز بكاميرا الجوال للدخول المباشر إلى بطاقة هلاهيل وطرق الباب.
                  </p>
                </div>
              </div>

              {/* Re-lock button */}
              <div className="pt-2 border-t border-[#a97fc0]/20 flex justify-center">
                <button
                  onClick={() => {
                    onClose();
                    onRelockDoor();
                  }}
                  className="text-xs text-[#7d5694] hover:text-[#5a3a20] font-medium flex items-center gap-1.5 underline cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>إعادة قفل الباب لتجربة الطرق من جديد</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB: Edit Names & Occasion */}
          {activeTab === 'edit' && (
            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-[#a97fc0]/10 border border-[#a97fc0]/30 flex items-center justify-between">
                <span className="font-bold text-[#7d5694]">نوع الدعوة:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleFieldChange('isSingleName', false)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      !formData.isSingleName
                        ? 'bg-[#a97fc0] text-white shadow-sm'
                        : 'bg-white text-[#4c3a28]'
                    }`}
                  >
                    زفاف (عريس وعروس)
                  </button>
                  <button
                    onClick={() => handleFieldChange('isSingleName', true)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      formData.isSingleName
                        ? 'bg-[#a97fc0] text-white shadow-sm'
                        : 'bg-white text-[#4c3a28]'
                    }`}
                  >
                    اسم مفرد (مولود/تخرج)
                  </button>
                </div>
              </div>

              {formData.isSingleName ? (
                <div>
                  <label className="font-bold text-[#4c3a28] block mb-1">اسم صاحب المناسبة</label>
                  <input
                    type="text"
                    value={formData.groom}
                    onChange={(e) => handleFieldChange('groom', e.target.value)}
                    placeholder="مثال: بدر بن فهد / ريم"
                    className="w-full p-2.5 rounded-xl border border-[#a97fc0]/40 bg-white"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-[#4c3a28] block mb-1">اسم العريس</label>
                    <input
                      type="text"
                      value={formData.groom}
                      onChange={(e) => handleFieldChange('groom', e.target.value)}
                      placeholder="محمد"
                      className="w-full p-2.5 rounded-xl border border-[#a97fc0]/40 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[#4c3a28] block mb-1">اسم العروس</label>
                    <input
                      type="text"
                      value={formData.bride}
                      onChange={(e) => handleFieldChange('bride', e.target.value)}
                      placeholder="زينب"
                      className="w-full p-2.5 rounded-xl border border-[#a97fc0]/40 bg-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="font-bold text-[#4c3a28] block mb-1">عنوان ونوع المناسبة</label>
                <input
                  type="text"
                  value={formData.occasionKicker}
                  onChange={(e) => handleFieldChange('occasionKicker', e.target.value)}
                  placeholder="دعوة زفاف / حفل استقبال مولود"
                  className="w-full p-2.5 rounded-xl border border-[#a97fc0]/40 bg-white"
                />
              </div>

              {!formData.isSingleName && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-[#4c3a28] block mb-1">والدا العريس</label>
                    <input
                      type="text"
                      value={formData.groomParents || ''}
                      onChange={(e) => handleFieldChange('groomParents', e.target.value)}
                      placeholder="نجل السيّد..."
                      className="w-full p-2.5 rounded-xl border border-[#a97fc0]/40 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[#4c3a28] block mb-1">والدا العروس</label>
                    <input
                      type="text"
                      value={formData.brideParents || ''}
                      onChange={(e) => handleFieldChange('brideParents', e.target.value)}
                      placeholder="كريمة السيّد..."
                      className="w-full p-2.5 rounded-xl border border-[#a97fc0]/40 bg-white"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#4c3a28] block mb-1">اسم القاعة</label>
                  <input
                    type="text"
                    value={formData.venueName}
                    onChange={(e) => handleFieldChange('venueName', e.target.value)}
                    placeholder="قاعة بابل الكبرى"
                    className="w-full p-2.5 rounded-xl border border-[#a97fc0]/40 bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#4c3a28] block mb-1">العنوان والمدينة</label>
                  <input
                    type="text"
                    value={formData.venueAddr}
                    onChange={(e) => handleFieldChange('venueAddr', e.target.value)}
                    placeholder="بغداد — المنصور"
                    className="w-full p-2.5 rounded-xl border border-[#a97fc0]/40 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#4c3a28] block mb-1">رابط خريطة القاعة (Google Maps)</label>
                <input
                  type="text"
                  value={formData.mapUrl}
                  onChange={(e) => handleFieldChange('mapUrl', e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className="w-full p-2.5 rounded-xl border border-[#a97fc0]/40 bg-white"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="font-bold text-[#4c3a28] block mb-1">الآية الكريمة أو بيت الشعر</label>
                <textarea
                  rows={2}
                  value={formData.verse}
                  onChange={(e) => handleFieldChange('verse', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#a97fc0]/40 bg-white resize-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#4c3a28] block mb-1">نص الدعوة والترحيب</label>
                <textarea
                  rows={3}
                  value={formData.invitationText}
                  onChange={(e) => handleFieldChange('invitationText', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#a97fc0]/40 bg-white resize-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#4c3a28] block mb-1">بطاقة التنويه الهامة (مثل الأطفال)</label>
                <input
                  type="text"
                  value={formData.noteCardText || ''}
                  onChange={(e) => handleFieldChange('noteCardText', e.target.value)}
                  placeholder="جنة الأطفال منازلهم 🏠"
                  className="w-full p-2.5 rounded-xl border border-[#a97fc0]/40 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-[#4c3a28] block mb-1">الهاشتاغ (اختياري)</label>
                <input
                  type="text"
                  value={formData.hashtag || ''}
                  onChange={(e) => handleFieldChange('hashtag', e.target.value)}
                  placeholder="#محمد_وزينب"
                  className="w-full p-2.5 rounded-xl border border-[#a97fc0]/40 bg-white"
                />
              </div>
            </div>
          )}

          {/* TAB: RSVPs */}
          {activeTab === 'rsvps' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-white border border-[#a97fc0]/30 text-center">
                  <span className="text-xs text-[#8d7b64] block">إجمالي الردود</span>
                  <span className="font-aref text-2xl font-bold text-[#4c3a28]">
                    {rsvps.length}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#a97fc0]/15 border border-[#a97fc0]/40 text-center">
                  <span className="text-xs text-[#7d5694] block">إجمالي الحضور المؤكدين</span>
                  <span className="font-aref text-2xl font-bold text-[#7d5694]">
                    {rsvps
                      .filter((r) => r.status === 'yes')
                      .reduce((acc, curr) => acc + (curr.guestsCount || 1), 0)}
                  </span>
                </div>
              </div>

              {rsvps.length === 0 ? (
                <div className="text-center py-8 text-[#8d7b64] text-xs">
                  لا توجد ردود حضور مسجلة حتى الآن. عند تأكيد الضيوف ستظهر هنا فوراً.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {rsvps.map((rsvp) => (
                    <div
                      key={rsvp.id}
                      className="p-3 rounded-xl bg-white border border-[#a97fc0]/30 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-[#4c3a28] block">{rsvp.guestName}</span>
                        <span className="text-[11px] text-[#8d7b64]">
                          {rsvp.submittedAt} • {rsvp.guestsCount} {rsvp.guestsCount === 1 ? 'ضيف' : 'ضيوف'}
                        </span>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                          rsvp.status === 'yes'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {rsvp.status === 'yes' ? 'سيحضر بإذن الله' : 'يعتذر عن الحضور'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#a97fc0]/30 bg-[#f6f1e4] flex items-center justify-between">
          <div className="text-xs text-[#8d7b64]">
            التعديلات تُحفظ وتنعكس مباشرة على الرابط والبطاقة
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#a97fc0] hover:bg-[#976cb0] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            تم وإغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
