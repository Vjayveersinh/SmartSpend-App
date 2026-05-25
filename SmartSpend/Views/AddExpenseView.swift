import SwiftData
import SwiftUI

struct AddExpenseView: View {
    @Environment(\.modelContext) private var modelContext

    @State private var amountText = ""
    @State private var selectedCategory: ExpenseCategory = .groceries
    @State private var noteText = ""
    @State private var selectedPaymentMethod: PaymentMethod = .creditCard
    @State private var selectedDate = Date()
    @State private var selectedType: ExpenseType = .need
    @State private var validationMessage: String?
    @State private var showSavedAlert = false

    var body: some View {
        NavigationStack {
            Form {
                Section("Expense Details") {
                    TextField("Amount", text: $amountText)
                        .keyboardType(.decimalPad)

                    Picker("Category", selection: $selectedCategory) {
                        ForEach(ExpenseCategory.allCases) { category in
                            Label(category.rawValue, systemImage: category.iconName)
                                .tag(category)
                        }
                    }

                    TextField("Description or note", text: $noteText, axis: .vertical)
                        .lineLimit(2...4)
                }

                Section("Payment") {
                    Picker("Payment Method", selection: $selectedPaymentMethod) {
                        ForEach(PaymentMethod.allCases) { method in
                            Text(method.rawValue).tag(method)
                        }
                    }

                    DatePicker("Date", selection: $selectedDate, displayedComponents: .date)

                    Picker("Expense Type", selection: $selectedType) {
                        ForEach(ExpenseType.allCases) { type in
                            Text(type.rawValue).tag(type)
                        }
                    }
                    .pickerStyle(.segmented)
                }

                if let validationMessage {
                    Section {
                        Text(validationMessage)
                            .font(.footnote)
                            .foregroundStyle(.red)
                    }
                }

                Section {
                    Button {
                        saveExpense()
                    } label: {
                        Label("Save Expense", systemImage: "checkmark.circle.fill")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(parsedAmount == nil)
                }
            }
            .navigationTitle("Add Expense")
            .alert("Expense Saved", isPresented: $showSavedAlert) {
                Button("OK", role: .cancel) {}
            } message: {
                Text("Your expense was stored locally on this iPhone.")
            }
        }
    }

    private var parsedAmount: Double? {
        let cleaned = amountText
            .replacingOccurrences(of: "$", with: "")
            .replacingOccurrences(of: ",", with: "")
            .trimmingCharacters(in: .whitespacesAndNewlines)

        guard let amount = Double(cleaned), amount > 0 else {
            return nil
        }

        return amount
    }

    private func saveExpense() {
        guard let amount = parsedAmount else {
            validationMessage = "Enter an amount greater than 0."
            return
        }

        let expense = Expense(
            amount: amount,
            category: selectedCategory,
            note: noteText.trimmingCharacters(in: .whitespacesAndNewlines),
            paymentMethod: selectedPaymentMethod,
            type: selectedType,
            date: selectedDate
        )

        modelContext.insert(expense)

        do {
            try modelContext.save()
            resetForm()
            showSavedAlert = true
        } catch {
            validationMessage = "Could not save this expense. Please try again."
        }
    }

    private func resetForm() {
        amountText = ""
        selectedCategory = .groceries
        noteText = ""
        selectedPaymentMethod = .creditCard
        selectedDate = .now
        selectedType = .need
        validationMessage = nil
    }
}

#Preview {
    AddExpenseView()
        .modelContainer(PreviewSampleData.container)
}
