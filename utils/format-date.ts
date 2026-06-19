const JAKARTA_TZ = 'Asia/Jakarta';

export function formatJakartaTime(isoString: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: JAKARTA_TZ,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoString));
}

export function formatJakartaDate(isoString: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: JAKARTA_TZ,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(isoString));
}
