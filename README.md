# Two Thirds

A daily number game. Guess from 0 to 100 and try to land closest to two-thirds of the crowd’s average.

## Run locally

Install dependencies with `npm ci`. Set `REACT_APP_API_ENDPOINT` in `.env.local` to the API Gateway stage URL, then run `npm start`.

Run the regression tests with `npm test -- --watchAll=false --runInBand` and build the frontend with `npm run build`.

## Backend

The AWS SAM template is in `lambdas/template.yaml`. Release the Lambda changes before the frontend, which reads the round date and leaderboard from `previous-results`. New guesses use one conditional DynamoDB item per UTC day and username. The results handler also reads existing ISO timestamp keys, so historical guesses need no table migration.

Rounds close at 00:00 UTC. Equally close guesses share a rank. A tied round can therefore have placements such as 1, 1, 3.
