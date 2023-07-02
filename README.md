# TODO
- display total number of players
- google analytics
- test cases for back-end stuff
- serverside validation for the username and guess 
# Notes
- Countdown refreshes to next occurence of midnight once it has passed and gets the previous day results again
but this only works if the countdown is set to midnight UTC because the lambdas look for the previous UTC day not a 
specified time frame. If we want an arbitrary time period like midday - midday then need to change the lambda to look 
for that in the database. But this is fine for now.