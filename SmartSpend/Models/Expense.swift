import Foundation
import SwiftData

@Model
final class Expense {
    // SwiftData persists these properties locally on the iPhone.
    @Attribute(.unique) var id: UUID
    var amount: Double
    var category: String
    var note: String
    var paymentMethod: String
    var type: String
    var date: Date
    var createdAt: Date

    init(
        id: UUID = UUID(),
        amount: Double,
        category: ExpenseCategory,
        note: String,
        paymentMethod: PaymentMethod,
        type: ExpenseType,
        date: Date = .now,
        createdAt: Date = .now
    ) {
        self.id = id
        self.amount = amount
        self.category = category.rawValue
        self.note = note
        self.paymentMethod = paymentMethod.rawValue
        self.type = type.rawValue
        self.date = date
        self.createdAt = createdAt
    }
}
