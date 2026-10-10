export type OccasionType = 'wedding' | 'baby' | 'engagement' | 'graduation' | 'party' | 'custom';

export interface ProgramItem {
  time: string;
  title: string;
}

export interface BabInvitationConfig {
  id: string;
  occasion: OccasionType;
  occasionKicker: string; // e.g. "دعوة زفاف" or "دعوة استقبال مولود"
  groom: string;
  bride: string;
  singleName?: string; // If single celebrant
  isSingleName?: boolean;
  date: string; // ISO string e.g. "2026-11-20T19:00:00"
  dateText: string; // e.g. "يوم الجمعة، ٢٠ تشرين الثاني ٢٠٢٦"
  timeText: string; // e.g. "الساعة السابعة مساءً"
  heroSub: string; // "فتحنا باب فرحتنا… وطارت البشائر تدعوكم"
  verse: string;
  invitationText: string;
  groomParents?: string;
  brideParents?: string;
  venueName: string;
  venueAddr: string;
  mapUrl: string;
  program: ProgramItem[];
  notes: string[];
  noteCardText: string; // "جنة الأطفال منازلهم 🏠"
  closingNote: string;
  closingFamilies: string;
  hashtag: string;
  contactLabel: string;
  contactName: string;
  contactPhone: string;
  musicYoutubeId?: string;
  musicTitle?: string;
  musicAutoPlay?: boolean;
}

export interface RSVPResponse {
  id: string;
  invitationId: string;
  guestName: string;
  phone: string;
  status: 'yes' | 'no' | 'maybe';
  guestsCount: number;
  message?: string;
  submittedAt: string;
}

export interface GuestWish {
  id: string;
  invitationId: string;
  name: string;
  message: string;
  submittedAt: string;
  avatarBg?: string;
  avatarLetter?: string;
}
