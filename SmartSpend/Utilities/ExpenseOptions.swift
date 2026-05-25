import SwiftUI

enum ExpenseCategory: String, CaseIterable, Identifiable {
    case groceries = "Groceries"
    case eatingOut = "Eating Out"
    case coffee = "Coffee"
    case rent = "Rent"
    case car = "Car"
    case gas = "Gas"
    case shopping = "Shopping"
    case subscriptions = "Subscriptions"
    case gym = "Gym"
    case family = "Family"
    case medical = "Medical"
    case travel = "Travel"
    case other = "Other"

    var id: String { rawValue }

    var iconName: String {
        switch self {
        case .groceries:
            return "cart.fill"
        case .eatingOut:
            return "fork.knife"
        case .coffee:
            return "cup.and.saucer.fill"
        case .rent:
            return "house.fill"
        case .car:
            return "car.fill"
        case .gas:
            return "fuelpump.fill"
        case .shopping:
            return "bag.fill"
        case .subscriptions:
            return "repeat.circle.fill"
        case .gym:
            return "figure.strengthtraining.traditional"
        case .family:
            return "person.3.fill"
        case .medical:
            return "cross.case.fill"
        case .travel:
            return "airplane"
        case .other:
            return "ellipsis.circle.fill"
        }
    }

    var tint: Color {
        switch self {
        case .groceries:
            return .green
        case .eatingOut:
            return .orange
        case .coffee:
            return .brown
        case .rent:
            return .indigo
        case .car:
            return .mint
        case .gas:
            return .teal
        case .shopping:
            return .pink
        case .subscriptions:
            return .purple
        case .gym:
            return .red
        case .family:
            return .cyan
        case .medical:
            return .blue
        case .travel:
            return .yellow
        case .other:
            return .gray
        }
    }

    static func from(_ rawValue: String) -> ExpenseCategory {
        ExpenseCategory(rawValue: rawValue) ?? .other
    }
}

enum PaymentMethod: String, CaseIterable, Identifiable {
    case creditCard = "Credit Card"
    case debitCard = "Debit Card"
    case cash = "Cash"
    case applePay = "Apple Pay"
    case other = "Other"

    var id: String { rawValue }
}

enum ExpenseType: String, CaseIterable, Identifiable {
    case need = "Need"
    case want = "Want"

    var id: String { rawValue }

    var tint: Color {
        switch self {
        case .need:
            return .green
        case .want:
            return .orange
        }
    }

    static func from(_ rawValue: String) -> ExpenseType {
        ExpenseType(rawValue: rawValue) ?? .want
    }
}

enum ExpenseHistoryFilter: String, CaseIterable, Identifiable {
    case today = "Today"
    case thisWeek = "This Week"
    case thisMonth = "This Month"
    case thisYear = "This Year"
    case all = "All"

    var id: String { rawValue }

    var dateInterval: DateInterval? {
        switch self {
        case .today:
            return DateInterval.current(.day)
        case .thisWeek:
            return DateInterval.current(.weekOfYear)
        case .thisMonth:
            return DateInterval.current(.month)
        case .thisYear:
            return DateInterval.current(.year)
        case .all:
            return nil
        }
    }
}
