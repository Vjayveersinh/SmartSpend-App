import SwiftData
import SwiftUI

@main
struct SmartSpendApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        // SwiftData creates and manages the local on-device store for Expense.
        .modelContainer(for: Expense.self)
    }
}
