import SwiftUI

struct ExpenseTypeBadge: View {
    let type: ExpenseType

    var body: some View {
        Text(type.rawValue)
            .font(.caption.weight(.semibold))
            .foregroundStyle(type.tint)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(type.tint.opacity(0.12), in: Capsule())
    }
}

#Preview {
    HStack {
        ExpenseTypeBadge(type: .need)
        ExpenseTypeBadge(type: .want)
    }
    .padding()
}
