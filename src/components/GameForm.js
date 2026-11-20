import { useEffect, useRef, useState } from 'react';
import { FiLock, FiMinus, FiPlus } from 'react-icons/fi';

const dialLabels = Array.from({ length: 11 }, (_, index) => index * 10);
const clampGuess = value => String(Math.min(10000, Math.max(0, Math.round(value * 100))) / 100);
const flickWindow = 90;
const coastDecay = 115;

export default function GameForm({ onSubmit, initialUsername }) {
  const [guess, setGuess] = useState('0');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(null);
  const drag = useRef(null);
  const animation = useRef(0);
  const slider = useRef(null);
  const hasGuess = guess !== '' && Number(guess) >= 0 && Number(guess) <= 100;
  const position = hasGuess ? Number(guess) : 0;
  const [whole, fraction] = position.toFixed(2).split('.');

  useEffect(() => () => cancelAnimationFrame(animation.current), []);

  const stopCoast = () => {
    cancelAnimationFrame(animation.current);
    animation.current = 0;
  };

  const changeGuess = value => {
    stopCoast();
    setGuess(value);
  };

  const coastFrom = (position, velocity) => {
    const start = performance.now();
    const tick = now => {
      const decay = Math.exp(-(now - start) / coastDecay);
      const value = position + velocity * coastDecay * (1 - decay);
      setGuess(clampGuess(value));
      const stillMoving = value > 0 && value < 100 && Math.abs(velocity * decay) > 0.004;
      animation.current = stillMoving ? requestAnimationFrame(tick) : 0;
    };
    animation.current = requestAnimationFrame(tick);
  };

  const startDrag = event => {
    if (pending || !event.isPrimary || event.button !== 0) return;
    stopCoast();
    const dial = event.currentTarget;
    const { left, width } = dial.getBoundingClientRect();
    drag.current = {
      id: event.pointerId, start: event.clientX, center: left + width / 2,
      unitsPerPixel: 50 / width, value: position, moved: false,
      samples: [{ x: event.clientX, time: event.timeStamp }],
    };
    slider.current.focus({ preventScroll: true });
    dial.setPointerCapture(event.pointerId);
  };

  const moveDrag = event => {
    const current = drag.current;
    if (current?.id !== event.pointerId) return;
    const distance = current.start - event.clientX;
    current.moved ||= Math.abs(distance) >= 3;
    if (!current.moved) return;
    setGuess(clampGuess(current.value + distance * current.unitsPerPixel));
    const { samples } = current;
    if (samples[samples.length - 1].x !== event.clientX) {
      samples.push({ x: event.clientX, time: event.timeStamp });
      while (samples.length > 2 && event.timeStamp - samples[0].time > flickWindow) samples.shift();
    }
  };

  const finishDrag = event => {
    const current = drag.current;
    if (current?.id !== event.pointerId) return;
    drag.current = null;
    if (!current.moved) {
      setGuess(clampGuess(current.value + (event.clientX - current.center) * current.unitsPerPixel));
      return;
    }

    const value = Number(clampGuess(current.value + (current.start - event.clientX) * current.unitsPerPixel));
    setGuess(String(value));
    if (event.pointerType !== 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const first = current.samples[0];
    const last = current.samples[current.samples.length - 1];
    const sampleTime = last.time - first.time;
    if (sampleTime <= 0 || event.timeStamp - last.time >= flickWindow) return;
    const speed = (first.x - last.x) * current.unitsPerPixel / sampleTime;
    const velocity = Math.min(0.34, Math.max(-0.34, speed));
    if (Math.abs(velocity) >= 0.018 && value > 0 && value < 100) coastFrom(value, velocity);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (pending) return;
    stopCoast();

    const fields = new FormData(event.currentTarget);
    setPending(true);
    setError('');
    try {
      const username = fields.get('username');
      const guess = Number(fields.get('guess'));
      if (request.current?.username !== username || request.current?.guess !== guess) {
        request.current = { username, guess, requestId: window.crypto?.randomUUID?.() };
      }
      await onSubmit(request.current);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="guess-form">
      <fieldset disabled={pending}>
        <div className="guess-playfield">
          <label htmlFor="guess">Your guess</label>
          <div className="guess-readout">
            <button type="button" className="tuning-button" onClick={() => changeGuess(clampGuess(position - 0.01))}
              disabled={position === 0} aria-label="Decrease guess by 0.01">
              <FiMinus aria-hidden="true" />
            </button>
            <div className="guess-face">
              <span className="guess-digits" aria-hidden="true">
                {hasGuess ? <>{whole}<small>.{fraction}</small></> : '—'}
              </span>
              <input id="guess" name="guess" className="guess-value" type="number" inputMode="decimal"
                min="0" max="100" step="0.01" placeholder="—" value={guess}
                onFocus={stopCoast} onChange={event => changeGuess(event.target.value)}
                aria-describedby="guess-hint" required />
            </div>
            <button type="button" className="tuning-button" onClick={() => changeGuess(clampGuess(position + 0.01))}
              disabled={position === 100} aria-label="Increase guess by 0.01">
              <FiPlus aria-hidden="true" />
            </button>
          </div>
          <div className="guess-ruler ruler-surface" style={{ '--guess-position': -position + '%' }}
            onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={finishDrag}
            onPointerCancel={() => { drag.current = null; }}>
            <div className="dial-tape ruler-marks" aria-hidden="true">
              {dialLabels.map(value => (
                <span key={value} style={{ left: value + '%' }}>{value}</span>
              ))}
            </div>
            <span className="dial-needle" aria-hidden="true" />
            <input ref={slider} type="range" className="guess-scale" min="0" max="100" step="0.01"
              value={position} onKeyDown={stopCoast} onChange={event => changeGuess(event.currentTarget.value)}
              aria-label="Choose a guess on the number line" aria-describedby="guess-hint" />
          </div>
          <p id="guess-hint">Slide the ruler or type a number.</p>
        </div>
        <div className="guess-entry">
          <div className="username-field">
            <label htmlFor="username">Username</label>
            <input id="username" name="username" autoComplete="nickname" defaultValue={initialUsername}
              pattern="[a-zA-Z0-9]+" maxLength={32} title="Use up to 32 letters or numbers" required />
          </div>
          <button className="primary-button" type="submit">
            <FiLock aria-hidden="true" />{pending ? 'Locking in…' : 'Lock in my guess'}
          </button>
        </div>
      </fieldset>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  );
}
