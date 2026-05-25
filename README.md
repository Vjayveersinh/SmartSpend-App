# SmartSpend

SmartSpend now includes two versions:

- `SmartSpend`: a native iPhone app built with SwiftUI, SwiftData, and Swift Charts for iOS 17 or later.
- `SmartSpendWeb`: a browser-based local-first app that runs on Windows, macOS, Linux, Android, and iPhone. It includes local login/create-account screens so expenses are separated by user on the same device/browser.

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

## Run the Web App

Open `SmartSpendWeb/index.html` directly in a browser, or run a local server for PWA/offline support:

```powershell
cd SmartSpendWeb
python -m http.server 5173
```

Then open `http://localhost:5173`.

The web login is local-only. Accounts and expenses are stored in the browser on the current device; they do not sync across devices until a backend such as Firebase, Supabase, or a custom API is added.
