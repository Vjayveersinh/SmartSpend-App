import Foundation

struct SavingSuggestion: Identifiable {
    let id = UUID()
    let title: String
    let message: String
    let estimatedSavings: Double
    let iconName: String
}

enum SavingsAdvisorService {
    static func suggestions(from expenses: [Expense]) -> [SavingSuggestion] {
        // MVP rules only look at the current month and run entirely on device.
        let monthInterval = DateInterval.current(.month)
        let monthlyExpenses = ExpenseAnalyticsService.expenses(from: expenses, in: monthInterval)
        let monthlyTotal = ExpenseAnalyticsService.total(from: monthlyExpenses)
        let eatingOutTotal = total(for: .eatingOut, in: monthlyExpenses)
        let coffeeTotal = total(for: .coffee, in: monthlyExpenses)
        let subscriptionsTotal = total(for: .subscriptions, in: monthlyExpenses)
        let wantTotal = monthlyExpenses
            .filter { $0.type == ExpenseType.want.rawValue }
            .reduce(0) { $0 + $1.amount }

        var results: [SavingSuggestion] = []

        if eatingOutTotal > 250 {
            results.append(
                SavingSuggestion(
                    title: "Trim Eating Out",
                    message: "Eating Out is above $250 this month. Cooking a few more meals at home could lower this quickly.",
                    estimatedSavings: eatingOutTotal - 250,
                    iconName: "fork.knife"
                )
            )
        }

        if coffeeTotal > 75 {
            results.append(
                SavingSuggestion(
                    title: "Reduce Coffee Runs",
                    message: "Coffee spending is above $75 this month. Try replacing a few shop visits with coffee at home.",
                    estimatedSavings: coffeeTotal - 75,
                    iconName: "cup.and.saucer.fill"
                )
            )
        }

        if subscriptionsTotal > 80 {
            results.append(
                SavingSuggestion(
                    title: "Review Subscriptions",
                    message: "Subscriptions are above $80 this month. Canceling one unused plan may be an easy win.",
                    estimatedSavings: subscriptionsTotal - 80,
                    iconName: "repeat.circle.fill"
                )
            )
        }

        if monthlyTotal > 0 {
            let wantShare = wantTotal / monthlyTotal
            if wantShare > 0.40 {
                let targetWantTotal = monthlyTotal * 0.40
                results.append(
                    SavingSuggestion(
                        title: "Lower Want Spending",
                        message: "Want spending is more than 40% of this month's total. Moving closer to 40% would free up cash.",
                        estimatedSavings: wantTotal - targetWantTotal,
                        iconName: "scissors"
                    )
                )
            }
        }

        return results
    }

    static func possibleMonthlySavings(from expenses: [Expense]) -> Double {
        suggestions(from: expenses).reduce(0) { $0 + max(0, $1.estimatedSavings) }
    }

    private static func total(for category: ExpenseCategory, in expenses: [Expense]) -> Double {
        expenses
            .filter { $0.category == category.rawValue }
            .reduce(0) { $0 + $1.amount }
    }
}
