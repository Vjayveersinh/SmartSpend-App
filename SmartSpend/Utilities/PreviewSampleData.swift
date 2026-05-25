import Foundation
import SwiftData

@MainActor
enum PreviewSampleData {
    static let container: ModelContainer = {
        do {
            let configuration = ModelConfiguration(isStoredInMemoryOnly: true)
            let container = try ModelContainer(for: Expense.self, configurations: configuration)

            sampleExpenses.forEach { expense in
                container.mainContext.insert(expense)
            }

            return container
        } catch {
            fatalError("Could not create preview container: \(error.localizedDescription)")
        }
    }()

    static var sampleExpenses: [Expense] {
        [
            Expense(
                amount: 68.45,
                category: .groceries,
                note: "Weekly groceries",
                paymentMethod: .debitCard,
                type: .need,
                date: .now
            ),
            Expense(
                amount: 18.90,
                category: .coffee,
                note: "Coffee with Sam",
                paymentMethod: .applePay,
                type: .want,
                date: Calendar.current.date(byAdding: .day, value: -1, to: .now) ?? .now
            ),
            Expense(
                amount: 52.30,
                category: .eatingOut,
                note: "Lunch",
                paymentMethod: .creditCard,
                type: .want,
                date: Calendar.current.date(byAdding: .day, value: -2, to: .now) ?? .now
            ),
            Expense(
                amount: 130.00,
                category: .subscriptions,
                note: "Streaming and apps",
                paymentMethod: .creditCard,
                type: .want,
                date: Calendar.current.date(byAdding: .day, value: -5, to: .now) ?? .now
            ),
            Expense(
                amount: 1600.00,
                category: .rent,
                note: "Monthly rent",
                paymentMethod: .debitCard,
                type: .need,
                date: Calendar.current.date(byAdding: .day, value: -10, to: .now) ?? .now
            ),
            Expense(
                amount: 72.10,
                category: .gas,
                note: "Fill up",
                paymentMethod: .creditCard,
                type: .need,
                date: Calendar.current.date(byAdding: .month, value: -1, to: .now) ?? .now
            )
        ]
    }
}
