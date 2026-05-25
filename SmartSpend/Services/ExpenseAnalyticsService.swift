import Foundation

struct CategorySpending: Identifiable {
    let category: String
    let amount: Double

    var id: String { category }
}

struct DailySpending: Identifiable {
    let date: Date
    let amount: Double

    var id: Date { date }
}

struct TypeSpending: Identifiable {
    let type: String
    let amount: Double

    var id: String { type }
}

struct MonthlySpending: Identifiable {
    let monthStart: Date
    let amount: Double

    var id: Date { monthStart }
}

enum ExpenseAnalyticsService {
    // Keep calculations in one place so views stay simple and easy to read.
    static func expenses(from expenses: [Expense], in interval: DateInterval?) -> [Expense] {
        guard let interval else { return expenses }
        return expenses.filter { interval.contains($0.date) }
    }

    static func total(from expenses: [Expense], in interval: DateInterval? = nil) -> Double {
        self.expenses(from: expenses, in: interval).reduce(0) { $0 + $1.amount }
    }

    static func categoryTotals(from expenses: [Expense], in interval: DateInterval? = nil) -> [CategorySpending] {
        let filteredExpenses = self.expenses(from: expenses, in: interval)
        let grouped = Dictionary(grouping: filteredExpenses, by: \.category)

        return grouped
            .map { category, expenses in
                CategorySpending(category: category, amount: expenses.reduce(0) { $0 + $1.amount })
            }
            .sorted { $0.amount > $1.amount }
    }

    static func topCategoryThisMonth(from expenses: [Expense]) -> CategorySpending? {
        categoryTotals(from: expenses, in: DateInterval.current(.month)).first
    }

    static func typeTotals(from expenses: [Expense], in interval: DateInterval? = nil) -> [TypeSpending] {
        let filteredExpenses = self.expenses(from: expenses, in: interval)
        let grouped = Dictionary(grouping: filteredExpenses, by: \.type)

        return ExpenseType.allCases.map { type in
            let total = grouped[type.rawValue]?.reduce(0) { $0 + $1.amount } ?? 0
            return TypeSpending(type: type.rawValue, amount: total)
        }
    }

    static func dailyTotalsForCurrentMonth(from expenses: [Expense]) -> [DailySpending] {
        let calendar = Calendar.current
        let monthInterval = DateInterval.current(.month)
        let filteredExpenses = self.expenses(from: expenses, in: monthInterval)
        let grouped = Dictionary(grouping: filteredExpenses) { expense in
            calendar.startOfDay(for: expense.date)
        }

        guard let dayRange = calendar.range(of: .day, in: .month, for: .now) else {
            return []
        }

        // Return every day of the current month, even when the total is zero.
        return dayRange.compactMap { day -> DailySpending? in
            guard let date = calendar.date(
                from: calendar.dateComponents([.year, .month], from: .now)
                    .setting(day: day)
            ) else {
                return nil
            }

            let total = grouped[date]?.reduce(0) { $0 + $1.amount } ?? 0
            return DailySpending(date: date, amount: total)
        }
    }

    static func monthlyTotalsForCurrentYear(from expenses: [Expense]) -> [MonthlySpending] {
        let calendar = Calendar.current
        let yearInterval = DateInterval.current(.year)
        let filteredExpenses = self.expenses(from: expenses, in: yearInterval)
        let grouped = Dictionary(grouping: filteredExpenses) { expense in
            let parts = calendar.dateComponents([.year, .month], from: expense.date)
            return calendar.date(from: parts) ?? expense.date
        }

        // Return all 12 months so the chart layout stays stable during the year.
        return (1...12).compactMap { month -> MonthlySpending? in
            var parts = calendar.dateComponents([.year], from: .now)
            parts.month = month
            parts.day = 1

            guard let monthStart = calendar.date(from: parts) else {
                return nil
            }

            let total = grouped[monthStart]?.reduce(0) { $0 + $1.amount } ?? 0
            return MonthlySpending(monthStart: monthStart, amount: total)
        }
    }
}

private extension DateComponents {
    func setting(day: Int) -> DateComponents {
        var copy = self
        copy.day = day
        return copy
    }
}
