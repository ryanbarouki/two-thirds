# Two Thirds

A daily number game. Guess from 0 to 100 and try to land closest to two-thirds of the crowd’s average.

## Run locally

Install dependencies with `npm ci`. Set `REACT_APP_API_ENDPOINT` in `.env.local` to the API Gateway stage URL, then run `npm start`.

Run the regression tests with `npm test -- --watchAll=false --runInBand` and build the frontend with `npm run build`.

## Backend

The AWS SAM template is in `lambdas/template.yaml`. Release the Lambda changes before the frontend. The UI reads yesterday’s results from `previous-results` and today’s guess count from `round-count`. New guesses use one conditional DynamoDB item per UTC day and username. Each successful write increments the round counter in the same transaction. The counter’s first access seeds it from any guesses already saved that day. The results handler also reads existing ISO timestamp keys, so historical guesses need no table migration.

Rounds close at 00:00 UTC. Equally close guesses share a rank. A tied round can therefore have placements such as 1, 1, 3.

## One-time results reminders

Verify a From address or its domain in Amazon SES in the backend region and obtain SES production sending access. Deploy the SAM stack with `ReminderSenderEmail` set to that address before releasing the frontend. The production Netlify build enables the opt-in UI through `netlify.toml`. For a local preview, set `REACT_APP_ENABLE_REMINDERS=true`. AWS runs the reminder function daily at 00:05 UTC. Players opt in once per completed guess, and reminders apply only to that round. Email addresses are removed from the reminder table after delivery, with a DynamoDB TTL for leftover entries.
