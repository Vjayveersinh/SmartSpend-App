import SwiftUI

struct ContentView: View {
    var body: some View {
        TabView {
            DashboardView()
                .tabItem {
                    Label("Dashboard", systemImage: "house.fill")
                }

            AddExpenseView()
                .tabItem {
                    Label("Add Expense", systemImage: "plus.circle.fill")
                }

            HistoryView()
                .tabItem {
                    Label("History", systemImage: "list.bullet.rectangle")
                }

            AnalyticsView()
                .tabItem {
                    Label("Analytics", systemImage: "chart.bar.xaxis")
                }

            AdvisorView()
                .tabItem {
                    Label("Advisor", systemImage: "lightbulb.fill")
                }
        }
        .tint(.blue)
    }
}

#Preview {
    ContentView()
        .modelContainer(PreviewSampleData.container)
}
