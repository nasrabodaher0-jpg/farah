import React, { useState, useEffect, useRef } from 'react';
import { BabInvitationConfig, RSVPResponse, GuestWish } from '../types';
import { MapPin, Heart, Calendar, Check, Send, Clock, Edit3, Music } from 'lucide-react';
import { downloadCalendarEvent } from '../utils/calendar';
import { getCalendarDisplayInfo } from '../utils/dateHelpers';
import { babAudio } from '../utils/babAudio';

interface HalaheelInvitationCardProps {
  config: BabInvitationConfig;
  rsvps: RSVPResponse[];
  onAddRSVP: (rsvp: RSVPResponse) => void;
  wishes: GuestWish[];
  onAddWish: (wish: GuestWish) => void;
  onOpenEdit?: (tab?: 'share' | 'edit' | 'datetime' | 'music' | 'rsvps') => void;
}

function toArabicDigits(str: string | number): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(str).replace(/[0-9]/g, (d) => arabicDigits[+d]);
}

function padZero(num: number): string {
  return toArabicDigits(String(num).padStart(2, '0'));
}

const BLOOM_SVG = (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g stroke="rgba(125,86,148,.45)" strokeWidth=".8">
      <ellipse cx="32" cy="17" rx="8" ry="12" fill="#c3a1d6" />
      <ellipse cx="32" cy="17" rx="8" ry="12" fill="#c3a1d6" transform="rotate(72 32 32)" />
      <ellipse cx="32" cy="17" rx="8" ry="12" fill="#b48fc9" transform="rotate(144 32 32)" />
      <ellipse cx="32" cy="17" rx="8" ry="12" fill="#c3a1d6" transform="rotate(216 32 32)" />
      <ellipse cx="32" cy="17" rx="8" ry="12" fill="#b48fc9" transform="rotate(288 32 32)" />
    </g>
    <circle cx="32" cy="32" r="6.5" fill="#f0e0b4" stroke="#c9a45c" strokeWidth="1" />
  </svg>
);

export const HalaheelInvitationCard: React.FC<HalaheelInvitationCardProps> = ({
  config,
  rsvps,
  onAddRSVP,
  wishes,
  onAddWish,
  onOpenEdit,
}) => {
  // Countdown state
  const [timeLeft, setTimeLeft] = useState<{
    days: string;
    hours: string;
    minutes: string;
    seconds: string;
    isArrived: boolean;
  }>({
    days: '٠٠',
    hours: '٠٠',
    minutes: '٠٠',
    seconds: '٠٠',
    isArrived: false,
  });

  // Timeline sliding bloom position
  const timelineBoxRef = useRef<HTMLDivElement>(null);
  const [bloomTop, setBloomTop] = useState(16);

  // RSVP Form state
  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'yes' | 'no' | 'maybe'>('yes');
  const [guestsCount, setGuestsCount] = useState(1);
  const [notes, setNotes] = useState('');
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);

  // Wishes Form state
  const [wishName, setWishName] = useState('');
  const [wishMsg, setWishMsg] = useState('');
  const [wishSubmitted, setWishSubmitted] = useState(false);

  // Music state
  const [isMusicPlaying, setIsMusicPlaying] = useState(babAudio.getIsPlaying());

  useEffect(() => {
    return babAudio.subscribe(setIsMusicPlaying);
  }, []);

  // Countdown timer calculation
  useEffect(() => {
    const targetDate = new Date(config.date).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = targetDate - now;

      if (diff <= 0) {
        setTimeLeft({
          days: '٠٠',
          hours: '٠٠',
          minutes: '٠٠',
          seconds: '٠٠',
          isArrived: true,
        });
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({
        days: padZero(d),
        hours: padZero(h),
        minutes: padZero(m),
        seconds: padZero(s),
        isArrived: false,
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [config.date]);

  // Timeline flower scroll listener
  useEffect(() => {
    const handleScroll = () => {
      const box = timelineBoxRef.current;
      if (!box) return;
      const rows = box.querySelectorAll('.sched__row');
      if (!rows.length) return;

      const firstRow = rows[0] as HTMLElement;
      const lastRow = rows[rows.length - 1] as HTMLElement;
      const y0 = firstRow.offsetTop + firstRow.offsetHeight / 2;
      const y1 = lastRow.offsetTop + lastRow.offsetHeight / 2;

      const rc = box.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (window.innerHeight * 0.55 - rc.top) / rc.height));
      setBloomTop(y0 + (y1 - y0) * progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [config.program]);

  // Google Calendar URL generator
  const getGoogleCalendarUrl = () => {
    const title = encodeURIComponent(
      config.isSingleName
        ? `${config.occasionKicker} - ${config.groom}`
        : `${config.occasionKicker} ${config.groom} & ${config.bride}`
    );
    const startIso = config.date.replace(/-|:|\.\d+/g, '');
    const location = encodeURIComponent(`${config.venueName} — ${config.venueAddr}`);
    const details = encodeURIComponent(
      `${config.invitationText}\nرابط الدعوة: ${window.location.href}`
    );
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${startIso}&location=${location}&details=${details}`;
  };

  const handleDownloadIcs = () => {
    // Generate .ics calendar file
    const startDate = new Date(config.date);
    const endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000);
    const formatTime = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Halaheel Bab Al-Farah//AR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${config.id}-${Date.now()}@halaheel.com`,
      `DTSTAMP:${formatTime(new Date())}`,
      `DTSTART:${formatTime(startDate)}`,
      `DTEND:${formatTime(endDate)}`,
      `SUMMARY:${config.occasionKicker} ${config.groom} & ${config.bride}`,
      `DESCRIPTION:${config.invitationText}`,
      `LOCATION:${config.venueName} - ${config.venueAddr}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `${config.groom}-${config.bride}-invitation.ics`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRSVPSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    onAddRSVP({
      id: `rsvp-${Date.now()}`,
      invitationId: config.id,
      guestName: guestName.trim(),
      phone: phone.trim(),
      status,
      guestsCount,
      message: notes.trim(),
      submittedAt: 'الآن',
    });
    setRsvpSubmitted(true);
  };

  const handleWishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishName.trim() || !wishMsg.trim()) return;

    const colors = ['#a97fc0', '#7d5694', '#c9a45c', '#7d8f66', '#c3a1d6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    onAddWish({
      id: `wish-${Date.now()}`,
      invitationId: config.id,
      name: wishName.trim(),
      message: wishMsg.trim(),
      submittedAt: 'الآن',
      avatarBg: randomColor,
      avatarLetter: wishName.trim().charAt(0),
    });
    setWishName('');
    setWishMsg('');
    setWishSubmitted(true);
    setTimeout(() => setWishSubmitted(false), 3000);
  };

  return (
    <article className="card">
      {/* 0. Song Player Pill (أغنية وزفة الحفل) */}
      <div className="flex items-center justify-between p-2.5 px-3.5 mb-5 rounded-2xl bg-[#f6f1e4] border border-[#a97fc0]/35 shadow-xs text-xs" dir="rtl">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => babAudio.toggleMusic(config.musicYoutubeId)}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-all cursor-pointer shadow-sm ${
              isMusicPlaying ? 'bg-[#a97fc0] scale-105' : 'bg-[#7d5694]'
            }`}
            aria-label="تشغيل أو إيقاف الأغنية"
          >
            {isMusicPlaying ? '⏸' : '▶'}
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#4c3a28] text-xs">
                {config.musicTitle || 'زفة هلاهيل الفرح الرسمية'}
              </span>
              {isMusicPlaying && (
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>
            <span className="text-[11px] text-[#7d5694] block">
              {isMusicPlaying ? 'أغنية الزفة تعمل الآن 🎶' : 'انقر لتشغيل الأغنية والزفة'}
            </span>
          </div>
        </div>

        {onOpenEdit && (
          <button
            type="button"
            onClick={() => onOpenEdit('music')}
            className="text-[11px] text-[#7d5694] hover:text-[#5a3a20] font-bold underline cursor-pointer shrink-0"
          >
            تغيير الأغنية
          </button>
        )}
      </div>

      {/* 1. Verse & Bismillah */}
      <section className="sec verse">
        <p className="bismillah">بسم الله الرحمن الرحيم</p>
        <span className="flourish" aria-hidden="true">
          ✿
        </span>
        <p className="verse__text" id="verseText">
          {config.verse}
        </p>
      </section>

      <div className="divider" aria-hidden="true">
        <span />
        ✿
        <span />
      </div>

      {/* 2. Invitation Text */}
      <section className="sec invitation">
        <h2 className="sec__title">بطاقة دعوة</h2>
        <p className="invitation__text" id="invitationText">
          {config.invitationText}
        </p>
      </section>

      {/* 3. Families Section */}
      {(config.groomParents || config.brideParents) && !config.isSingleName && (
        <section className="sec families">
          <div className="family">
            <span className="family__label">والدا العريس</span>
            <p className="family__names" id="groomParents">
              {config.groomParents}
            </p>
          </div>

          <span className="families__heart" aria-hidden="true">
            &#10084;
          </span>

          <div className="family">
            <span className="family__label">والدا العروس</span>
            <p className="family__names" id="brideParents">
              {config.brideParents}
            </p>
          </div>
        </section>
      )}

      <div className="divider" aria-hidden="true">
        <span />
        ✿
        <span />
      </div>

      {/* 4. Countdown Timer */}
      <section className="sec count">
        <div className="flex items-center justify-between mb-2 px-2">
          <h2 className="sec__title m-0">باقٍ على فرحنا</h2>
          {onOpenEdit && (
            <button
              type="button"
              onClick={() => onOpenEdit('datetime')}
              className="text-[11px] text-[#7d5694] hover:text-[#5a3a20] font-bold flex items-center gap-1 cursor-pointer bg-[#a97fc0]/10 hover:bg-[#a97fc0]/20 px-2.5 py-1 rounded-full transition-colors"
            >
              <Edit3 className="w-3 h-3 text-[#a97fc0]" />
              <span>تعديل الموعد</span>
            </button>
          )}
        </div>
        {!timeLeft.isArrived ? (
          <div className="countdown" id="countdown">
            <div className="cd__u">
              <span className="cd__n" id="cdDays">
                {timeLeft.days}
              </span>
              <span className="cd__l">يوم</span>
            </div>
            <div className="cd__u">
              <span className="cd__n" id="cdHours">
                {timeLeft.hours}
              </span>
              <span className="cd__l">ساعة</span>
            </div>
            <div className="cd__u">
              <span className="cd__n" id="cdMins">
                {timeLeft.minutes}
              </span>
              <span className="cd__l">دقيقة</span>
            </div>
            <div className="cd__u">
              <span className="cd__n" id="cdSecs">
                {timeLeft.seconds}
              </span>
              <span className="cd__l">ثانية</span>
            </div>
          </div>
        ) : (
          <p className="count__arrived" id="cdArrived">
            حلّ يوم الفرح — نراكم الليلة 💜
          </p>
        )}
      </section>

      {/* 5. Program Schedule */}
      {config.program && config.program.length > 0 && (
        <section className="sec program">
          <h2 className="sec__title">برنامج الحفل</h2>
          <div className="sched" id="timeline" ref={timelineBoxRef}>
            <span className="sched__line" />
            {config.program.map((item, idx) => (
              <div key={idx} className="sched__row">
                <span className="sched__time">{item.time}</span>
                <span className="sched__dot" />
                <span className="sched__event">{item.title}</span>
              </div>
            ))}
            {/* Sliding bloom flower */}
            <span
              className="sched__bloom"
              style={{ top: `${bloomTop}px` }}
              aria-hidden="true"
            >
              {BLOOM_SVG}
            </span>
          </div>
        </section>
      )}

      {/* 6. Venue Location */}
      <section className="sec venue">
        <h2 className="sec__title">مكان الحفل</h2>
        <div className="venue__photo" id="venuePhoto" aria-hidden="true" />
        <p className="venue__name" id="venueName">
          {config.venueName}
        </p>
        <p className="venue__addr" id="venueAddr">
          {config.venueAddr}
        </p>
        {config.mapUrl && (
          <a
            className="venue__map"
            id="mapBtn"
            href={config.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span aria-hidden="true">&#9906;</span>
            <span>الموقع على الخريطة</span>
          </a>
        )}
      </section>

      {/* 7. Notes & Bell Animation */}
      <section className="sec notes">
        <h2 className="sec__title">تنويهات</h2>
        {config.noteCardText && (
          <div id="da3wa-note" dir="rtl">
            <div className="hn-card">
              <span className="hn-bell" aria-hidden="true">
                🔔
              </span>
              <span className="hn-kick">تنويهٌ مهم</span>
              <p className="hn-text">{config.noteCardText}</p>
            </div>
          </div>
        )}

        {config.notes && config.notes.length > 0 && (
          <ul className="notes__list" id="notesList">
            {config.notes.map((n, i) => (
              <li key={i} className="notes__item">
                <span className="notes__mark" aria-hidden="true">
                  ✿
                </span>
                <span>{n}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 8. Contact Box */}
      {config.contactPhone && (
        <section className="sec contact" id="contactBox">
          <span className="contact__label">{config.contactLabel}</span>
          <a
            className="contact__link"
            id="contactLink"
            href={`https://wa.me/${config.contactPhone.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span aria-hidden="true">&#9742;</span>
            <span>{config.contactName || config.contactPhone}</span>
          </a>
        </section>
      )}

      {/* 9. Closing */}
      <section className="sec closing">
        <span className="flourish" aria-hidden="true">
          ✿
        </span>
        {config.closingNote && (
          <p className="closing__note" id="closingNote">
            {config.closingNote}
          </p>
        )}
        {config.hashtag && (
          <p className="closing__hashtag" id="closingHashtag">
            {config.hashtag}
          </p>
        )}
      </section>

      {/* 10. Calendar Widget */}
      <section id="da3wa-cal" dir="rtl">
        {(() => {
          const calInfo = getCalendarDisplayInfo(config.date, config.dateText);
          return (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="cal-title m-0">احفظ الموعد ✿</p>
                {onOpenEdit && (
                  <button
                    type="button"
                    onClick={() => onOpenEdit('datetime')}
                    className="text-[11px] text-[#7d5694] hover:text-[#5a3a20] font-bold flex items-center gap-1 cursor-pointer bg-[#a97fc0]/10 hover:bg-[#a97fc0]/20 px-2 py-0.5 rounded-full transition-colors"
                  >
                    <Edit3 className="w-3 h-3 text-[#a97fc0]" />
                    <span>تعديل الموعد</span>
                  </button>
                )}
              </div>
              <div className="cal">
                <div className="cal-top">{calInfo.monthYear}</div>
                <div className="cal-body">
                  <div className="cal-wd">{calInfo.weekday}</div>
                  <div className="cal-day">{calInfo.dayNumberArabic}</div>
                  <div className="cal-time">{config.timeText}</div>
                </div>
                <div className="cal-foot">
                  <p className="cal-cap">📲 أضِف الموعد إلى تقويم هاتفك بضغطة</p>
                  <div className="cal-btns">
                    <a href={getGoogleCalendarUrl()} target="_blank" rel="noopener noreferrer">
                      تقويم جوجل
                    </a>
                    <button type="button" onClick={handleDownloadIcs}>
                      تقويم آيفون / ملف
                    </button>
                  </div>
                </div>
              </div>
            </>
          );
        })()}
      </section>

      {/* 11. RSVP Attendance Form (تأكيد الحضور) */}
      <section id="da3wa-rsvp" dir="rtl">
        <div className="rsvp-card">
          <h3>تأكيد الحضور</h3>
          <div className="orn-line" aria-hidden="true">
            <span className="text-[#a97fc0]">✿</span>
          </div>
          <p className="sub">يسعدنا ويشرفنا حضوركم ومشاركتنا فرحتنا</p>

          {rsvpSubmitted ? (
            <div className="ok py-4">
              <div className="text-4xl mb-2">🤍</div>
              <p className="font-bold text-[#4c3a28] text-base">تم تسجيل تأكيدكم بنجاح!</p>
              <p className="text-sm text-[#8d7b64] mt-1">ننتظركم بكل بهجة وسرور</p>
            </div>
          ) : (
            <form onSubmit={handleRSVPSubmit}>
              <div>
                <label>الاسم الكامل</label>
                <input
                  type="text"
                  required
                  placeholder="اكتب اسمك الكريم"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
              </div>

              <div>
                <label>رقم الهاتف / الواتساب</label>
                <input
                  type="tel"
                  placeholder="05XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div>
                <label>هل ستشرفنا بالحضور؟</label>
                <div className="pills">
                  <button
                    type="button"
                    className={`pill ${status === 'yes' ? 'active' : ''}`}
                    onClick={() => setStatus('yes')}
                  >
                    نعم، سأحضر ✨
                  </button>
                  <button
                    type="button"
                    className={`pill ${status === 'maybe' ? 'active' : ''}`}
                    onClick={() => setStatus('maybe')}
                  >
                    ربما
                  </button>
                  <button
                    type="button"
                    className={`pill ${status === 'no' ? 'active' : ''}`}
                    onClick={() => setStatus('no')}
                  >
                    أعتذر 🤍
                  </button>
                </div>
              </div>

              {status === 'yes' && (
                <div>
                  <label>عدد المرافقين</label>
                  <div className="flex items-center justify-center gap-4 mt-2">
                    <button
                      type="button"
                      onClick={() => setGuestsCount(Math.max(1, guestsCount - 1))}
                      className="w-9 h-9 rounded-full border border-[#a97fc0]/40 bg-[#fffdf6] text-lg font-bold text-[#4c3a28]"
                    >
                      -
                    </button>
                    <span className="text-xl font-bold font-aref text-[#4c3a28]">
                      {toArabicDigits(guestsCount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setGuestsCount(guestsCount + 1)}
                      className="w-9 h-9 rounded-full border border-[#a97fc0]/40 bg-[#fffdf6] text-lg font-bold text-[#4c3a28]"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label>ملاحظة أو رسالة لأصحاب الفرح</label>
                <textarea
                  rows={2}
                  placeholder="مباركة أو كلمة طيبة..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <button type="submit" className="send">
                إرسال الرد
              </button>
            </form>
          )}
        </div>
      </section>

      {/* 12. Wishes Guestbook (كلمات المهنّئين) */}
      <section className="wishes" id="da3wa-wishes">
        <div className="wishes-h">
          <h3>كلمات المهنّئين ✿</h3>
        </div>

        <div className="wish-list" id="da3wa-wish-list">
          {wishes.map((w) => (
            <div key={w.id} className="wish">
              <div className="wish-av" style={{ background: w.avatarBg || '#a97fc0' }}>
                {w.avatarLetter || w.name.charAt(0)}
              </div>
              <div className="wish-body">
                <div className="wish-name">{w.name}</div>
                <div className="wish-msg">{w.message}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Wish Form */}
        <div className="mt-6 p-4 rounded-2xl bg-[#fcf9f0] border border-[#a97fc0]/30 shadow-sm">
          <h4 className="font-aref font-bold text-[#4c3a28] text-base mb-2 text-center">
            أضف كلمتك وتهنئتك لأصحاب الفرح ✍️
          </h4>
          {wishSubmitted ? (
            <p className="text-center text-sm font-bold text-[#7d5694] py-2">
              شكراً لمشاركتك الكريمة ودعواتك الطيبة! ✨
            </p>
          ) : (
            <form onSubmit={handleWishSubmit} className="space-y-2">
              <input
                type="text"
                required
                placeholder="اسمك الكريم"
                value={wishName}
                onChange={(e) => setWishName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#a97fc0]/40 text-sm bg-white text-[#4c3a28]"
              />
              <textarea
                required
                rows={2}
                placeholder="اكتب أطيب أمنياتك وتبريكاتك..."
                value={wishMsg}
                onChange={(e) => setWishMsg(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#a97fc0]/40 text-sm bg-white text-[#4c3a28]"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#a97fc0] hover:bg-[#976cb0] text-white font-bold text-sm transition-all"
              >
                إرسال التهنئة 🤍
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Credit Footer matching Halaheel */}
      <footer className="text-center py-6 text-xs text-[#8d7b64]">
        <p>تصميم بطاقة باب الفرح • منصّة هلاهيل الأصلية</p>
      </footer>
    </article>
  );
};
