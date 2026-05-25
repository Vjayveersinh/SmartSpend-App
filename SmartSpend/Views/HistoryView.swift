import SwiftData
import SwiftUI

struct HistoryView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Expense.date, order: .reverse) private var expenses: [Expense]
    @State private var selectedFilter: ExpenseHistoryFilter = .thisMonth

    private var filteredExpenses: [Expense] {
        ExpenseAnalyticsService.expenses(from: expenses, in: selectedFilter.dateInterval)
    }

    private var filteredTotal: Double {
        ExpenseAnalyticsService.total(from: filteredExpenses)
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                filterBar

                List {
                    Section {
                        HStack {
                            Text("Total")
                                .font(.headline)
                            Spacer()
                            Text(filteredTotal.currencyText)
                                .font(.headline)
                        }
                    }

                    if filteredExpenses.isEmpty {
                        EmptyStateView(
                            title: "No Expenses",
                            message: "No expenses match this filter yet.",
                            iconName: "tray"
                        )
                        .listRowBackground(Color.clear)
                    } else {
                        ForEach(filteredExpenses) { expense in
                            ExpenseRow(expense: expense)
                        }
                        .onDelete(perform: deleteExpenses)
                    }
                }
                .listStyle(.insetGrouped)
            }
            .navigationTitle("History")
        }
    }

    private var filterBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(ExpenseHistoryFilter.allCases) { filter in
                    Button {
                        selectedFilter = filter
                    } label: {
                        Text(filter.rawValue)
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(selectedFilter == filter ? .white : .primary)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(
                                selectedFilter == filter ? Color.blue : Color(.secondarySystemGroupedBackground),
                                in: Capsule()
                            )
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 10)
        }
        .background(Color(.systemGroupedBackground))
    }

    private func deleteExpenses(at offsets: IndexSet) {
        for index in offsets {
            modelContext.delete(filteredExpenses[index])
        }

        try? modelContext.save()
    }
}

private struct ExpenseRow: View {
    let expense: Expense

    private var category: ExpenseCategory {
        ExpenseCategory.from(expense.category)
    }

    private var type: ExpenseType {
        ExpenseType.from(expense.type)
    }

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: category.iconName)
                .foregroundStyle(category.tint)
                .frame(width: 36, height: 36)
                .background(category.tint.opacity(0.12), in: RoundedRectangle(cornerRadius: 8))

            VStack(alignment: .leading, spacing: 4) {
                Text(expense.category)
                    .font(.headline)

                Text(expense.note.isEmpty ? expense.paymentMethod : expense.note)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)

                Text(expense.date.shortDisplayText)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 6) {
                Text(expense.amount.currencyText)
                    .font(.headline)

                ExpenseTypeBadge(type: type)
            }
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    HistoryView()
        .modelContainer(PreviewSampleData.container)
}
