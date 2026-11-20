# Two Thirds

A daily number game. Guess from 0 to 100 and try to land closest to two-thirds of the crowd’s average.

## Run locally

Install dependencies with `npm ci`. Set `REACT_APP_API_ENDPOINT` in `.env.local` to the API Gateway stage URL, then run `npm start`.

Run the regression tests with `npm test -- --watchAll=false --runInBand` and build the frontend with `npm run build`.

## Backend

The AWS SAM template is in `lambdas/template.yaml`. Release the Lambda changes before the frontend. The UI reads yesterday’s results from `previous-results` and today’s guess count from `round-count`. New guesses use one conditional DynamoDB item per UTC day and username. Each successful write increments the round counter in the same transaction. The counter’s first access seeds it from any guesses already saved that day. The results handler also reads existing ISO timestamp keys, so historical guesses need no table migration.

Rounds close at 00:00 UTC. Equally close guesses share a rank. A tied round can therefore have placements such as 1, 1, 3.
