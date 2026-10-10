// Arabic Date and Time helpers for Bab Invitation

export const ARABIC_DIGITS: { [key: string]: string } = {
  '0': '٠',
  '1': '١',
  '2': '٢',
  '3': '٣',
  '4': '٤',
  '5': '٥',
  '6': '٦',
  '7': '٧',
  '8': '٨',
  '9': '٩',
};

export function toArabicDigits(val: number | string): string {
  return String(val).replace(/\d/g, (d) => ARABIC_DIGITS[d] || d);
}

export const ARABIC_WEEKDAYS = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
];

export const ARABIC_MONTHS_LEVANT = [
  'كانون الثاني',
  'شباط',
  'آذار',
  'نيسان',
  'أيار',
  'حزيران',
  'تموز',
  'آب',
  'أيلول',
  'تشرين الأول',
  'تشرين الثاني',
  'كانون الأول',
];

export const ARABIC_MONTHS_COMMON = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

/**
 * Format a Date object into Arabic dateText and timeText strings
 */
export function formatArabicDateTime(
  dateObj: Date,
  useLevantMonths: boolean = true
): {
  dateIso: string;
  dateText: string;
  timeText: string;
  weekday: string;
  dayOfMonth: number;
  monthName: string;
  year: number;
} {
  const d = isNaN(dateObj.getTime()) ? new Date() : dateObj;

  const weekday = ARABIC_WEEKDAYS[d.getDay()];
  const monthName = useLevantMonths
    ? ARABIC_MONTHS_LEVANT[d.getMonth()]
    : ARABIC_MONTHS_COMMON[d.getMonth()];
  const dayOfMonth = d.getDate();
  const year = d.getFullYear();

  const arabicDay = toArabicDigits(dayOfMonth);
  const arabicYear = toArabicDigits(year);

  const dateText = `يوم ${weekday}، ${arabicDay} ${monthName} ${arabicYear}`;

  let hours = d.getHours();
  const minutes = d.getMinutes();
  const isPM = hours >= 12;
  hours = hours % 12;
  if (hours === 0) hours = 12;

  const timePeriod = isPM ? 'مساءً' : 'صباحاً';
  const arabicHour = toArabicDigits(hours);
  const arabicMin = minutes === 0 ? '' : ` و ${toArabicDigits(minutes)} دقيقة`;

  const timeText = `الساعة ${arabicHour}${arabicMin} ${timePeriod}`;

  // Local ISO format YYYY-MM-DDTHH:mm:ss
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

  return {
    dateIso,
    dateText,
    timeText,
    weekday,
    dayOfMonth,
    monthName,
    year,
  };
}

/**
 * Get date details for Calendar display
 */
export function getCalendarDisplayInfo(dateIsoStr: string, dateText?: string) {
  const d = new Date(dateIsoStr);
  const isValid = !isNaN(d.getTime());
  const actualDate = isValid ? d : new Date();

  const weekday = ARABIC_WEEKDAYS[actualDate.getDay()];
  const monthName = ARABIC_MONTHS_LEVANT[actualDate.getMonth()];
  const year = actualDate.getFullYear();
  const day = actualDate.getDate();

  return {
    monthYear: `${monthName} ${year}`,
    weekday: dateText?.includes('،') ? dateText.split('،')[0].replace('يوم ', '') : weekday,
    dayNumber: day,
    dayNumberArabic: toArabicDigits(day),
  };
}

/**
 * Generate preset upcoming dates for quick selection
 */
export function getDatePresets() {
  const now = new Date();

  // Next Friday (7:00 PM)
  const nextFriday = new Date(now);
  const daysUntilFriday = (5 - now.getDay() + 7) % 7 || 7;
  nextFriday.setDate(now.getDate() + daysUntilFriday);
  nextFriday.setHours(19, 0, 0, 0);

  // In two weeks Friday
  const inTwoWeeks = new Date(nextFriday);
  inTwoWeeks.setDate(nextFriday.getDate() + 7);
  inTwoWeeks.setHours(20, 0, 0, 0);

  // In one month
  const inOneMonth = new Date(now);
  inOneMonth.setMonth(now.getMonth() + 1);
  inOneMonth.setDate(15);
  inOneMonth.setHours(19, 30, 0, 0);

  return [
    {
      label: 'الجمعة القادمة (٧:٠٠ م)',
      date: nextFriday,
    },
    {
      label: 'عطلة الأسبوع بعد القادمة (٨:٠٠ م)',
      date: inTwoWeeks,
    },
    {
      label: 'الشهر القادم (منتصف الشهر)',
      date: inOneMonth,
    },
  ];
}
