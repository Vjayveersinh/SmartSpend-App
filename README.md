# SmartSpend

SmartSpend now includes two versions plus a deployable backend:

- `SmartSpend`: a native iPhone app built with SwiftUI, SwiftData, and Swift Charts for iOS 17 or later.
- `SmartSpendWeb`: a browser-based app that runs on Windows, macOS, Linux, Android, and iPhone.
- `server`: a Node/Express backend with account login, JWT sessions, and per-user expense storage.

## MVP Scope

- Add daily expenses with amount, category, note, payment method, date, and Need/Want type.
- Store all data locally on device with SwiftData.
- Show dashboard spending summaries for today, this week, this month, and this year.
- Browse expense history with Today, This Week, This Month, This Year, and All filters.
- View analytics charts for category spending, daily trend, Need vs Want, and monthly summary.
- Get simple rule-based saving suggestions.

## Project Structure

- `SmartSpend/Models`: SwiftData models.
- `SmartSpend/Views`: Main app screens.
- `SmartSpend/Components`: Reusable SwiftUI components.
- `SmartSpend/Services`: Calculation and advisor logic.
- `SmartSpend/Utilities`: App options, formatting, dates, and preview data.

## Open in Xcode

Open `SmartSpend.xcodeproj` in Xcode 15 or later, choose an iPhone simulator running iOS 17 or later, and press Run.

Because this project was generated from a Windows environment, run a first build in Xcode on macOS to let Xcode refresh signing and any local project metadata. If needed, set your development team in the target's Signing & Capabilities tab.

## Run the Full Web App With Backend

Install dependencies once:

```powershell
npm install
```

Start the backend and frontend together:

```powershell
npm start
```

Then open:

```text
http://localhost:5177
```

The backend uses PostgreSQL when `DATABASE_URL` is set. Without `DATABASE_URL`, it stores local development data in `server/data/smartspend-db.json`.

## Deploy Live

This repo includes `render.yaml` for Render Blueprint deployment:

1. Push the latest code to GitHub.
2. In Render, create a new Blueprint from this repository.
3. Render creates the web service and Postgres database from `render.yaml`.
4. After deployment, open the Render app URL and create accounts for you and your wife.

Each login has separate data. If you want one shared household view, create one shared family account for now.

## Run the Static Web App Only

Open `SmartSpendWeb/index.html` directly in a browser, or run a local server for PWA/offline support:

```powershell
cd SmartSpendWeb
python -m http.server 5173
```

Then open `http://localhost:5173`.

If the backend API is not available, the web app falls back to local browser storage for development.
