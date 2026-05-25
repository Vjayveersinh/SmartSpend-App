import SwiftUI

struct EmptyStateView: View {
    let title: String
    let message: String
    let iconName: String

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: iconName)
                .font(.system(size: 34, weight: .semibold))
                .foregroundStyle(.secondary)

            Text(title)
                .font(.headline)

            Text(message)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(28)
    }
}

#Preview {
    EmptyStateView(
        title: "No Expenses Yet",
        message: "Add your first expense to start tracking your spending.",
        iconName: "tray"
    )
}
