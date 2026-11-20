import { act, fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import App from './App';
import { InviteFriends } from './components/Share';

jest.mock('axios', () => ({ get: jest.fn(), post: jest.fn() }));

const originalEndpoint = process.env.REACT_APP_API_ENDPOINT;

const emptyRound = day => ({ day, numberOfPlayers: 0, leaderboard: [] });

beforeEach(() => {
  process.env.REACT_APP_API_ENDPOINT = 'https://game.example/';
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-11-20T23:59:58Z'));
  localStorage.clear();
  axios.get.mockReset();
  axios.post.mockReset();
});

afterEach(() => {
  if (originalEndpoint === undefined) delete process.env.REACT_APP_API_ENDPOINT;
  else process.env.REACT_APP_API_ENDPOINT = originalEndpoint;
  jest.useRealTimers();
});

test('locks and restores a zero guess, then reopens and reveals the score at UTC midnight', async () => {
  axios.get
    .mockResolvedValueOnce({ data: { day: '2026-11-20', count: 1 } })
    .mockResolvedValueOnce({ data: { day: '2026-11-20', count: 2 } })
    .mockResolvedValueOnce({ data: { day: '2026-11-20', count: 2 } })
    .mockResolvedValueOnce({ data: { day: '2026-11-21', count: 0 } });
  axios.post
    .mockResolvedValueOnce({ data: emptyRound('2026-11-19') })
    .mockResolvedValueOnce({ data: { day: '2026-11-20' } })
    .mockResolvedValueOnce({ data: emptyRound('2026-11-19') })
    .mockResolvedValueOnce({ data: {
      day: '2026-11-20', numberOfPlayers: 1, averageGuess: 0, target: 0,
      userGuess: 0, userRank: 1, userDistance: 0, leaderboard: [{ username: 'Ada', guess: 0, rank: 1 }],
    } });

  const { unmount } = render(<App />);
  await screen.findByText('No guesses were submitted yesterday.');
  await screen.findByText('1 guess this round');
  expect(screen.queryByRole('button', { name: 'Copy invite link' })).toBeNull();
  const scale = screen.getByRole('slider');
  const guessInput = screen.getByLabelText('Your guess');
  expect(scale.value).toBe('0');
  expect(guessInput.value).toBe('0');
  expect(scale.step).toBe('0.01');
  fireEvent.change(scale, { target: { value: '37.25' } });
  expect(guessInput.value).toBe('37.25');
  fireEvent.click(screen.getByRole('button', { name: 'Increase guess by 0.01' }));
  expect(scale.value).toBe('37.26');
  fireEvent.click(screen.getByRole('button', { name: 'Decrease guess by 0.01' }));
  expect(guessInput.value).toBe('37.25');
  fireEvent.change(guessInput, { target: { value: '0' } });
  expect(scale.value).toBe('0');
  fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'Ada' } });
  fireEvent.click(screen.getByRole('button', { name: 'Lock in my guess' }));
  await screen.findByText('Guess locked in.');
  await screen.findByText('2 guesses this round');
  expect(screen.getByRole('button', { name: 'Copy invite link' })).toBeTruthy();
  expect(JSON.parse(localStorage.getItem('usernames'))['2026-11-20']).toEqual({ username: 'Ada', guess: 0 });

  unmount();
  render(<App />);
  expect(screen.getByText('Guess locked in.')).toBeTruthy();
  await screen.findByText('No guesses were submitted yesterday.');
  await screen.findByText('2 guesses this round');

  act(() => jest.advanceTimersByTime(2000));
  expect(screen.getByLabelText('Username').value).toBe('Ada');
  expect(screen.getByRole('slider').value).toBe('0');
  expect(screen.queryByText('2 guesses this round')).toBeNull();
  await screen.findByText('0 guesses this round');
  await screen.findByText('You placed 1 of 1');
  expect(screen.getByText('Right on target')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Share score' })).toBeTruthy();
  expect(axios.post).toHaveBeenLastCalledWith(expect.stringContaining('previous-results'), { username: 'Ada' }, expect.anything());
});

test('shares the game URL and a challenge through the native share sheet', async () => {
  const original = Object.getOwnPropertyDescriptor(navigator, 'share');
  const share = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'share', { configurable: true, value: share });
  try {
    render(<InviteFriends />);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Invite friends' })));
    expect(share).toHaveBeenCalledWith({
      title: 'Two Thirds',
      text: 'I just played Two Thirds. Can you outwit the crowd?',
      url: window.location.origin + window.location.pathname,
    });
  } finally {
    if (original) Object.defineProperty(navigator, 'share', original);
    else delete navigator.share;
  }
});
