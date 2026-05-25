# SmartSpend Web

SmartSpend Web is a browser-based version of the expense tracker. It uses plain HTML, CSS, and JavaScript so it can run on Windows, macOS, Linux, Android, and iPhone.

## Features

- Add expenses with amount, category, note, payment method, date, and Need/Want type.
- Log in or create an account before seeing the app.
- Use the Node backend API for live accounts and per-user expense storage when available.
- Fall back to local browser storage when the API is not available.
- View dashboard totals for today, this week, this month, and this year.
- Filter expense history by Today, This Week, This Month, This Year, or All.
- See analytics charts drawn with the HTML canvas.
- Get rule-based savings suggestions.
- Install as a lightweight PWA when served over `http://localhost` or HTTPS.

## Run With Backend

From the repository root:

```powershell
npm install
npm start
```

Then open:

```text
http://localhost:5177
```

## Run Static Only

You can still open `index.html` directly in a browser.

For the PWA/offline service worker features, serve the folder with a local web server:

```powershell
cd SmartSpendWeb
python -m http.server 5173
```

Then open:

```text
http://localhost:5173
```

## Data

When served by the backend, account and expense data are stored on the server. In production, set `DATABASE_URL` so the server uses PostgreSQL.

When the backend API is not available, the app falls back to local browser storage. Local-only data stays in the current browser/device.
