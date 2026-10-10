import { BabInvitationConfig } from '../types';
import { DEFAULT_DEMO_BAB } from '../data/defaultConfig';

export function encodeInvitationToUrl(config: BabInvitationConfig, asGuest: boolean = true): string {
  try {
    const jsonStr = JSON.stringify(config);
    const utf8Bytes = new TextEncoder().encode(jsonStr);
    let binary = '';
    utf8Bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    const base64 = btoa(binary);
    const urlSafe = encodeURIComponent(base64);
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('inv', urlSafe);
    if (asGuest) {
      url.searchParams.set('mode', 'guest');
    } else {
      url.searchParams.set('mode', 'edit');
    }
    return url.toString();
  } catch (err) {
    console.error('Failed to encode invitation', err);
    return window.location.href;
  }
}

export function isGuestModeUrl(): boolean {
  try {
    const url = new URL(window.location.href);
    const mode = url.searchParams.get('mode');
    const view = url.searchParams.get('view');
    if (mode === 'guest' || view === 'guest' || view === '1') {
      return true;
    }
    if (mode === 'edit' || mode === 'owner') {
      return false;
    }
    if (url.searchParams.has('inv')) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function decodeInvitationFromUrl(): BabInvitationConfig | null {
  try {
    const url = new URL(window.location.href);
    const invParam = url.searchParams.get('inv');

    if (invParam) {
      const base64 = decodeURIComponent(invParam);
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const jsonStr = new TextDecoder().decode(bytes);
      const parsed = JSON.parse(jsonStr) as Partial<BabInvitationConfig>;
      return {
        ...DEFAULT_DEMO_BAB,
        ...parsed,
      };
    }

    // Direct param fallbacks: ?groom=...&bride=...
    const groomParam = url.searchParams.get('groom');
    const brideParam = url.searchParams.get('bride');
    const nameParam = url.searchParams.get('name');
    if (groomParam || brideParam || nameParam) {
      return {
        ...DEFAULT_DEMO_BAB,
        groom: groomParam || nameParam || DEFAULT_DEMO_BAB.groom,
        bride: brideParam || '',
        isSingleName: !brideParam && !!nameParam,
      };
    }
  } catch (err) {
    console.error('Failed to decode invitation from URL', err);
  }
  return null;
}

export function buildWhatsAppShareMessage(config: BabInvitationConfig, shareUrl: string): string {
  const coupleName = config.isSingleName
    ? config.groom
    : `${config.groom} & ${config.bride}`;

  return `السلام عليكم ورحمة الله وبركاته 🌸

يسعدنا ويشرفنا دعوتكم لمشاركتنا فرحتنا بمناسبة ${config.occasionKicker}:
✨ *${coupleName}* ✨

📅 الموعد: ${config.dateText}
⏰ الوقت: ${config.timeText}
📍 المكان: ${config.venueName} — ${config.venueAddr}

🚪 صممنا لكم دعوة خاصة تفاعلية بأسلوب (باب الفرح من هلاهيل)، نرجو فتح الرابط ودقّ الباب ثلاثاً للدخول:
${shareUrl}

حضوركم يفتح أبواب سعادتنا 🤍`;
}
