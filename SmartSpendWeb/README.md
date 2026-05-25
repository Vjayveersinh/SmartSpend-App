# SmartSpend Web

SmartSpend Web is a browser-based version of the expense tracker. It uses plain HTML, CSS, and JavaScript so it can run on Windows, macOS, Linux, Android, and iPhone.

## Features

- Add expenses with amount, category, note, payment method, date, and Need/Want type.
- Store expenses locally in the browser with `localStorage`.
- View dashboard totals for today, this week, this month, and this year.
- Filter expense history by Today, This Week, This Month, This Year, or All.
- See analytics charts drawn with the HTML canvas.
- Get rule-based savings suggestions.
- Install as a lightweight PWA when served over `http://localhost` or HTTPS.

## Run Locally

You can open `index.html` directly in a browser.

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

All data stays in the browser on the current device. Clearing site data or browser storage will remove saved expenses.
