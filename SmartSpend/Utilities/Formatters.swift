import Foundation

enum AppFormatters {
    static let currency: NumberFormatter = {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.locale = .current
        formatter.maximumFractionDigits = 2
        return formatter
    }()
}

extension Double {
    var currencyText: String {
        AppFormatters.currency.string(from: NSNumber(value: self)) ?? "$\(String(format: "%.2f", self))"
    }
}
