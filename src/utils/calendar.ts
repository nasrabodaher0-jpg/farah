import { BabInvitationConfig } from '../types';

export function downloadCalendarEvent(invitation: BabInvitationConfig) {
  try {
    const startDate = new Date(invitation.date);
    const endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000);

    const formatTime = (d: Date) => {
      return d.toISOString().replace(/-|:|\.\d+/g, '');
    };

    const coupleName = invitation.isSingleName
      ? invitation.groom
      : `${invitation.groom} & ${invitation.bride}`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Halaheel Bab Al-Farah//AR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${invitation.id}-${Date.now()}@halaheel.com`,
      `DTSTAMP:${formatTime(new Date())}`,
      `DTSTART:${formatTime(startDate)}`,
      `DTEND:${formatTime(endDate)}`,
      `SUMMARY:${invitation.occasionKicker} - ${coupleName}`,
      `DESCRIPTION:${invitation.invitationText.replace(/\n/g, '\\n')}`,
      `LOCATION:${invitation.venueName} - ${invitation.venueAddr}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${coupleName}-invitation.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to generate calendar event', err);
  }
}
