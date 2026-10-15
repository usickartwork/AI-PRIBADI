import { CGEvent } from '@/types/database';

/**
 * Generates an iCalendar (.ics) string for a given CG event
 */
export function generateICS(event: CGEvent): string {
  // Format date and time (assuming date is YYYY-MM-DD and time has hours/minutes e.g. "19:00 WIB" or "19:00")
  const dateClean = event.date.replace(/-/g, '');
  const timeMatch = event.time.match(/(\d{1,2}):(\d{2})/);
  
  let startTimeStr = '190000';
  let endTimeStr = '210000';

  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const startH = hours.toString().padStart(2, '0');
    const startM = minutes.toString().padStart(2, '0');
    startTimeStr = `${startH}${startM}00`;

    // Default duration: 2 hours
    const endH = ((hours + 2) % 24).toString().padStart(2, '0');
    endTimeStr = `${endH}${startM}00`;
  }

  const dtStart = `${dateClean}T${startTimeStr}`;
  const dtEnd = `${dateClean}T${endTimeStr}`;
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const description = [
    event.description || '',
    event.notes ? `Catatan: ${event.notes}` : '',
    event.maps_url ? `Lokasi Maps: ${event.maps_url}` : '',
  ]
    .filter(Boolean)
    .join('\\n\\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Faith Hub//CG Calendar//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:cgevent-${event.id}@faithhub.my.id`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${event.location}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Triggers a browser download/open of the .ics file
 */
export function downloadICS(event: CGEvent) {
  const icsData = generateICS(event);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${event.title.toLowerCase().replace(/\s+/g, '-')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
