import Foundation

extension DateInterval {
    static func current(_ component: Calendar.Component) -> DateInterval {
        Calendar.current.dateInterval(of: component, for: .now) ?? DateInterval(start: .now, duration: 0)
    }
}

extension Date {
    var shortDisplayText: String {
        formatted(date: .abbreviated, time: .omitted)
    }

    var monthDisplayText: String {
        formatted(.dateTime.month(.abbreviated))
    }
}
