export const getDayString = (date = new Date()) => date.toISOString().slice(0, 10);

export const shiftDay = (day, offset) => {
  const date = new Date(day + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + offset);
  return getDayString(date);
};

export const formatDay = (day) => new Intl.DateTimeFormat('en', {
  month: 'short', day: 'numeric', timeZone: 'UTC',
}).format(new Date(day + 'T00:00:00Z'));

export const formatGuess = (guess) => new Intl.NumberFormat('en', {
  maximumFractionDigits: 2,
}).format(guess);
