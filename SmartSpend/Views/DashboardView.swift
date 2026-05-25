import SwiftData
import SwiftUI

struct DashboardView: View {
    @Query(sort: \Expense.date, order: .reverse) private var expenses: [Expense]

    private var todayTotal: Double {
        ExpenseAnalyticsService.total(from: expenses, in: DateInterval.current(.day))
    }

    private var weekTotal: Double {
        ExpenseAnalyticsService.total(from: expenses, in: DateInterval.current(.weekOfYear))
    }

    private var monthTotal: Double {
        ExpenseAnalyticsService.total(from: expenses, in: DateInterval.current(.month))
    }

    private var yearTotal: Double {
        ExpenseAnalyticsService.total(from: expenses, in: DateInterval.current(.year))
    }

    private var topMonthlyCategory: CategorySpending? {
        ExpenseAnalyticsService.topCategoryThisMonth(from: expenses)
    }

    private var possibleSavings: Double {
        SavingsAdvisorService.possibleMonthlySavings(from: expenses)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 14) {
                    SummaryCard(
                        title: "Today",
                        value: todayTotal.currencyText,
                        subtitle: "Spent today",
                        iconName: "sun.max.fill",
                        tint: .orange
                    )

                    SummaryCard(
                        title: "This Week",
                        value: weekTotal.currencyText,
                        subtitle: "Current week",
                        iconName: "calendar.badge.clock",
                        tint: .blue
                    )

                    SummaryCard(
                        title: "This Month",
                        value: monthTotal.currencyText,
                        subtitle: "Current month",
                        iconName: "calendar",
                        tint: .purple
                    )

                    SummaryCard(
                        title: "This Year",
                        value: yearTotal.currencyText,
                        subtitle: "Year to date",
                        iconName: "chart.line.uptrend.xyaxis",
                        tint: .green
                    )
                }
                .padding(.horizontal)

                VStack(spacing: 14) {
                    SummaryCard(
                        title: "Top Category",
                        value: topMonthlyCategory?.category ?? "No data",
                        subtitle: topMonthlyCategory.map { "\($0.amount.currencyText) this month" } ?? "Add expenses to see trends",
                        iconName: "crown.fill",
                        tint: .yellow
                    )

                    SummaryCard(
                        title: "Possible Savings",
                        value: possibleSavings.currencyText,
                        subtitle: possibleSavings > 0 ? "Based on advisor rules" : "No obvious savings flags",
                        iconName: "banknote.fill",
                        tint: .mint
                    )
                }
                .padding()
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("SmartSpend")
        }
    }
}

#Preview {
    DashboardView()
        .modelContainer(PreviewSampleData.container)
}
