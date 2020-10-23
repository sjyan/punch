# punch
A (very) custom node script to emulate the simplicity of punching in and out of work.
---

`npm install` to install dependencies and `touch .env` to store your spreadsheet ID. Hours get added to a google sheet through the spreadsheets API. First usage of the script will prompt you to save a `credentials.json` file in the root directory. If you've made it that far the next time you spin up the script it should save a `token.json` file. Then it's just clockwork baby.

`.env` file should look like this:

```
SPREADSHEET_ID=ABC123
```

Annnd my spreadsheet looks roughly like this:

| in    | out   | time | week | notes | total |
|-------|-------|------|------|-------|-------|
| 9:00  | 17:00 | 8.00 | 1    |       | 11.50 |
| 12:00 | 15:00 | 3.00 | 1    |       |       |
| 9:00  | 9:30  | 0.50 | 2    |       |       |

Contrived? Perhaps, but it works for me for now.

