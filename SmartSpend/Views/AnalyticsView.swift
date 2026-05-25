import Charts
import SwiftData
import SwiftUI

struct AnalyticsView: View {
    @Query(sort: \Expense.date, order: .reverse) private var expenses: [Expense]

    private var currentMonthCategoryTotals: [CategorySpending] {
        ExpenseAnalyticsService.categoryTotals(from: expenses, in: DateInterval.current(.month))
    }

    private var dailyTrend: [DailySpending] {
        ExpenseAnalyticsService.dailyTotalsForCurrentMonth(from: expenses)
    }

    private var needWantTotals: [TypeSpending] {
        ExpenseAnalyticsService
            .typeTotals(from: expenses, in: DateInterval.current(.month))
            .filter { $0.amount > 0 }
    }

    private var monthlySummary: [MonthlySpending] {
        ExpenseAnalyticsService.monthlyTotalsForCurrentYear(from: expenses)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    chartCard(title: "Spending by Category") {
                        if currentMonthCategoryTotals.isEmpty {
                            chartEmptyState
                        } else {
                            Chart(currentMonthCategoryTotals) { item in
                                BarMark(
                                    x: .value("Amount", item.amount),
                                    y: .value("Category", item.category)
                                )
                                .foregroundStyle(ExpenseCategory.from(item.category).tint)
                            }
                            .chartXAxisLabel("Amount")
                            .frame(height: 260)
                        }
                    }

                    chartCard(title: "Daily Spending Trend") {
                        Chart(dailyTrend) { item in
                            AreaMark(
                                x: .value("Day", item.date),
                                y: .value("Amount", item.amount)
                            )
                            .foregroundStyle(.blue.opacity(0.16))

                            LineMark(
                                x: .value("Day", item.date),
                                y: .value("Amount", item.amount)
                            )
                            .foregroundStyle(.blue)
                            .interpolationMethod(.catmullRom)
                        }
                        .chartXAxis {
                            AxisMarks(values: .stride(by: .day, count: 7)) {
                                AxisValueLabel(format: .dateTime.day())
                            }
                        }
                        .frame(height: 220)
                    }

                    chartCard(title: "Need vs Want") {
                        if needWantTotals.isEmpty {
                            chartEmptyState
                        } else {
                            Chart(needWantTotals) { item in
                                SectorMark(
                                    angle: .value("Amount", item.amount),
                                    innerRadius: .ratio(0.58),
                                    angularInset: 2
                                )
                                .foregroundStyle(by: .value("Type", item.type))
                            }
                            .frame(height: 220)
                        }
                    }

                    chartCard(title: "Monthly Spending Summary") {
                        Chart(monthlySummary) { item in
                            BarMark(
                                x: .value("Month", item.monthStart, unit: .month),
                                y: .value("Amount", item.amount)
                            )
                            .foregroundStyle(.green)
                        }
                        .chartXAxis {
                            AxisMarks(values: .stride(by: .month)) {
                                AxisValueLabel(format: .dateTime.month(.abbreviated))
                            }
                        }
                        .frame(height: 220)
                    }
                }
                .padding()
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Analytics")
        }
    }

    private var chartEmptyState: some View {
        EmptyStateView(
            title: "No Chart Data",
            message: "Add expenses this month to populate this chart.",
            iconName: "chart.bar"
        )
        .frame(height: 220)
    }

    private func chartCard<Content: View>(
        title: String,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.headline)

            content()
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.background, in: RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(.quaternary, lineWidth: 1)
        )
    }
}

#Preview {
    AnalyticsView()
        .modelContainer(PreviewSampleData.container)
}
