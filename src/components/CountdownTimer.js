export default function CountdownTimer({ now, deadline }) {
  const remaining = Math.max(0, Math.ceil((deadline - now) / 1000));
  const parts = [Math.floor(remaining / 3600), Math.floor(remaining / 60) % 60, remaining % 60];
  return <time className="countdown">{parts.map(part => String(part).padStart(2, '0')).join(':')}</time>;
}
