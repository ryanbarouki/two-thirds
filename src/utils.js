export function getNextOccurrence(hour, minute=0) {
  const now = new Date();
  let next = new Date();

  next.setUTCHours(hour);
  next.setUTCMinutes(minute);
  next.setUTCSeconds(0);

  // If the desired time is in the past for the current day, add one day
  if (now > next) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}