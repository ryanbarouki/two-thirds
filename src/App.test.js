import { act, fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import App from './App';

jest.mock('axios', () => ({ post: jest.fn() }));

const originalEndpoint = process.env.REACT_APP_API_ENDPOINT;

const emptyRound = day => ({ day, numberOfPlayers: 0, leaderboard: [] });

beforeEach(() => {
  process.env.REACT_APP_API_ENDPOINT = 'https://game.example/';
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-11-20T23:59:58Z'));
  localStorage.clear();
  axios.post.mockReset();
});

afterEach(() => {
  if (originalEndpoint === undefined) delete process.env.REACT_APP_API_ENDPOINT;
  else process.env.REACT_APP_API_ENDPOINT = originalEndpoint;
  jest.useRealTimers();
});

test('locks and restores a zero guess, then reopens and reveals the score at UTC midnight', async () => {
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
  fireEvent.change(screen.getByLabelText('Your guess'), { target: { value: '0' } });
  fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'Ada' } });
  fireEvent.click(screen.getByRole('button', { name: 'Lock in my guess' }));
  await screen.findByText('Guess locked in.');
  expect(JSON.parse(localStorage.getItem('usernames'))['2026-11-20']).toEqual({ username: 'Ada', guess: 0 });

  unmount();
  render(<App />);
  expect(screen.getByText('Guess locked in.')).toBeTruthy();
  await screen.findByText('No guesses were submitted yesterday.');

  act(() => jest.advanceTimersByTime(2000));
  expect(screen.getByLabelText('Username').value).toBe('Ada');
  await screen.findByText('You placed 1 of 1');
  expect(screen.getByText('Right on target')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Share score' })).toBeTruthy();
  expect(axios.post).toHaveBeenLastCalledWith(expect.stringContaining('previous-results'), { username: 'Ada' }, expect.anything());
});
