import SwiftData
import SwiftUI

struct AdvisorView: View {
    @Query(sort: \Expense.date, order: .reverse) private var expenses: [Expense]

    private var suggestions: [SavingSuggestion] {
        SavingsAdvisorService.suggestions(from: expenses)
    }

    private var possibleSavings: Double {
        SavingsAdvisorService.possibleMonthlySavings(from: expenses)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    SummaryCard(
                        title: "Possible Monthly Savings",
                        value: possibleSavings.currencyText,
                        subtitle: suggestions.isEmpty ? "No simple savings flags found" : "\(suggestions.count) suggestion(s) this month",
                        iconName: "sparkles",
                        tint: .green
                    )

                    if suggestions.isEmpty {
                        EmptyStateView(
                            title: "Looking Good",
                            message: "Your spending is within the simple MVP advisor rules for this month.",
                            iconName: "checkmark.seal"
                        )
                        .background(.background, in: RoundedRectangle(cornerRadius: 14))
                    } else {
                        ForEach(suggestions) { suggestion in
                            suggestionCard(suggestion)
                        }
                    }
                }
                .padding()
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Advisor")
        }
    }

    private func suggestionCard(_ suggestion: SavingSuggestion) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: suggestion.iconName)
                .foregroundStyle(.blue)
                .frame(width: 38, height: 38)
                .background(.blue.opacity(0.12), in: RoundedRectangle(cornerRadius: 8))

            VStack(alignment: .leading, spacing: 6) {
                Text(suggestion.title)
                    .font(.headline)

                Text(suggestion.message)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                Text("Estimated savings: \(suggestion.estimatedSavings.currencyText)")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.green)
            }

            Spacer()
        }
        .padding()
        .background(.background, in: RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(.quaternary, lineWidth: 1)
        )
    }
}

#Preview {
    AdvisorView()
        .modelContainer(PreviewSampleData.container)
}
