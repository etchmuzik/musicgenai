import SwiftUI
import Foundation

// MARK: - Subscription Benefits Showcase
struct SubscriptionBenefitsView: View {
    let userPlan: UserPackage
    @Binding var isPresented: Bool
    @State private var showingSubscriptionView = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 25) {
                    // Header with current plan
                    currentPlanHeader
                    
                    // Benefits comparison
                    benefitsComparisonSection
                    
                    // Feature highlights
                    featureHighlightsSection
                    
                    if userPlan != .unlimited {
                        // Upgrade prompts
                        upgradePromptsSection
                    }
                    
                    // Usage analytics
                    usageAnalyticsSection
                }
                .padding()
                .padding(.bottom, 100)
            }
            .navigationTitle("Your Benefits")
            .navigationBarItems(
                trailing: Button("Done") {
                    isPresented = false
                }
            )
        }
        .sheet(isPresented: $showingSubscriptionView) {
            SubscriptionView()
        }
    }
    
    // MARK: - Current Plan Header
    
    @ViewBuilder
    private var currentPlanHeader: some View {
        VStack(spacing: 15) {
            // Plan badge
            HStack {
                Image(systemName: userPlan.icon)
                    .font(.system(size: 30))
                    .foregroundColor(userPlan.color)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(userPlan.displayName)
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(userPlan.color)
                    
                    if userPlan != .free {
                        Text("ACTIVE PLAN")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 2)
                            .background(Color.green)
                            .cornerRadius(4)
                    }
                }
                
                Spacer()
                
                if userPlan != .free {
                    VStack(alignment: .trailing) {
                        Text(String(format: "$%.2f", Double(truncating: userPlan.monthlyPrice as NSNumber)))
                            .font(.title3)
                            .fontWeight(.bold)
                        Text("per month")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 15)
                    .fill(userPlan.color.opacity(0.1))
                    .overlay(
                        RoundedRectangle(cornerRadius: 15)
                            .stroke(userPlan.color, lineWidth: 2)
                    )
            )
            
            // Quick stats
            HStack(spacing: 20) {
                benefitStatCard(
                    title: "Generations",
                    value: "\(userPlan.pointsIncluded)",
                    subtitle: "per month",
                    icon: "wand.and.stars"
                )
                
                benefitStatCard(
                    title: "Daily Limit",
                    value: "\(userPlan.dailyLimit)",
                    subtitle: "per day",
                    icon: "clock"
                )
                
                benefitStatCard(
                    title: "Cost",
                    value: userPlan == .free ? "Free" : String(format: "$%.2f", Double(truncating: userPlan.costPerGeneration as NSNumber)),
                    subtitle: userPlan == .free ? "" : "per track",
                    icon: "dollarsign.circle"
                )
            }
        }
    }
    
    @ViewBuilder
    private func benefitStatCard(title: String, value: String, subtitle: String, icon: String) -> some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(userPlan.color)
            
            Text(value)
                .font(.headline)
                .fontWeight(.bold)
            
            VStack(spacing: 2) {
                Text(title)
                    .font(.caption)
                    .fontWeight(.medium)
                
                Text(subtitle)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(UIColor.secondarySystemBackground))
        .cornerRadius(12)
    }
    
    // MARK: - Benefits Comparison
    
    @ViewBuilder
    private var benefitsComparisonSection: some View {
        VStack(alignment: .leading, spacing: 15) {
            Text("Your Benefits")
                .font(.title2)
                .fontWeight(.bold)
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 12) {
                ForEach(userPlan.features, id: \.self) { feature in
                    HStack(spacing: 8) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                        
                        Text(feature)
                            .font(.subheadline)
                            .multilineTextAlignment(.leading)
                        
                        Spacer()
                    }
                    .padding()
                    .background(Color(UIColor.secondarySystemBackground))
                    .cornerRadius(10)
                }
            }
        }
    }
    
    // MARK: - Feature Highlights
    
    @ViewBuilder
    private var featureHighlightsSection: some View {
        VStack(alignment: .leading, spacing: 15) {
            Text("What Makes Your Plan Special")
                .font(.title2)
                .fontWeight(.bold)
            
            VStack(spacing: 12) {
                switch userPlan {
                case .free:
                    featureHighlight(
                        icon: "hand.wave",
                        title: "Getting Started",
                        description: "Perfect for trying out AI music generation",
                        color: .blue
                    )
                    
                case .starter:
                    featureHighlight(
                        icon: "star.fill",
                        title: "Creative Freedom",
                        description: "Enough generations for regular music creation",
                        color: .blue
                    )
                    
                case .pro:
                    featureHighlight(
                        icon: "crown.fill",
                        title: "Professional Power",
                        description: "Extended tracks and priority generation speed",
                        color: .purple
                    )
                    
                case .unlimited:
                    featureHighlight(
                        icon: "infinity",
                        title: "Ultimate Control",
                        description: "Commercial rights and API access for developers",
                        color: .orange
                    )
                }
                
                if userPlan != .free {
                    featureHighlight(
                        icon: "cloud.fill",
                        title: "Cloud Sync",
                        description: "Your tracks are automatically saved and synced",
                        color: .green
                    )
                }
                
                if userPlan == .pro || userPlan == .unlimited {
                    featureHighlight(
                        icon: "bolt.fill",
                        title: "Priority Queue",
                        description: "Your generations get processed faster",
                        color: .yellow
                    )
                }
            }
        }
    }
    
    @ViewBuilder
    private func featureHighlight(icon: String, title: String, description: String, color: Color) -> some View {
        HStack(spacing: 15) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
                .frame(width: 40)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Text(description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.leading)
            }
            
            Spacer()
        }
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(color.opacity(0.3), lineWidth: 1)
        )
    }
    
    // MARK: - Upgrade Prompts
    
    @ViewBuilder
    private var upgradePromptsSection: some View {
        VStack(alignment: .leading, spacing: 15) {
            Text("Unlock More")
                .font(.title2)
                .fontWeight(.bold)
            
            let nextTier = getNextTier()
            if let nextTier = nextTier {
                VStack(spacing: 12) {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Upgrade to \(nextTier.displayName)")
                                .font(.headline)
                                .fontWeight(.semibold)
                            
                            Text("Get \(nextTier.pointsIncluded - userPlan.pointsIncluded) more generations")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                        
                        Spacer()
                        
                        Button("Upgrade") {
                            showingSubscriptionView = true
                        }
                        .buttonStyle(.bordered)
                        .tint(nextTier.color)
                    }
                    
                    // Value proposition
                    HStack {
                        Text("💰")
                        Text(String(format: "Save $%.2f per generation", calculateSavings(from: userPlan, to: nextTier)))
                            .font(.caption)
                            .foregroundColor(.green)
                    }
                }
                .padding()
                .background(nextTier.color.opacity(0.1))
                .cornerRadius(12)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(nextTier.color.opacity(0.3), lineWidth: 1)
                )
            }
        }
    }
    
    // MARK: - Usage Analytics
    
    @ViewBuilder
    private var usageAnalyticsSection: some View {
        VStack(alignment: .leading, spacing: 15) {
            Text("Plan Comparison")
                .font(.title2)
                .fontWeight(.bold)
            
            // Comparison table
            VStack(spacing: 8) {
                // Header
                HStack {
                    Text("Feature")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    
                    ForEach(UserPackage.allCases, id: \.self) { plan in
                        Text(plan.displayName)
                            .font(.caption)
                            .fontWeight(.semibold)
                            .frame(width: 60)
                            .foregroundColor(plan == userPlan ? plan.color : .secondary)
                    }
                }
                .padding(.horizontal)
                
                Divider()
                
                // Generations
                comparisonRow(
                    feature: "Generations/month",
                    values: UserPackage.allCases.map { "\($0.pointsIncluded)" }
                )
                
                // Daily limit
                comparisonRow(
                    feature: "Daily limit",
                    values: UserPackage.allCases.map { "\($0.dailyLimit)" }
                )
                
                // Price
                comparisonRow(
                    feature: "Price",
                    values: UserPackage.allCases.map { $0 == .free ? "Free" : String(format: "$%.0f", Double(truncating: $0.monthlyPrice as NSNumber)) }
                )
            }
            .padding()
            .background(Color(UIColor.secondarySystemBackground))
            .cornerRadius(12)
        }
    }
    
    @ViewBuilder
    private func comparisonRow(feature: String, values: [String]) -> some View {
        HStack {
            Text(feature)
                .font(.subheadline)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            ForEach(Array(zip(UserPackage.allCases, values)), id: \.0) { plan, value in
                Text(value)
                    .font(.subheadline)
                    .fontWeight(plan == userPlan ? .bold : .regular)
                    .frame(width: 60)
                    .foregroundColor(plan == userPlan ? plan.color : .primary)
            }
        }
        .padding(.horizontal)
    }
    
    // MARK: - Helper Functions
    
    private func getNextTier() -> UserPackage? {
        switch userPlan {
        case .free: return .starter
        case .starter: return .pro
        case .pro: return .unlimited
        case .unlimited: return nil
        }
    }
    
    private func calculateSavings(from: UserPackage, to: UserPackage) -> Double {
        let fromCost = Double(truncating: from.costPerGeneration as NSNumber)
        let toCost = Double(truncating: to.costPerGeneration as NSNumber)
        return max(0, fromCost - toCost)
    }
}

// MARK: - Preview
struct SubscriptionBenefitsView_Previews: PreviewProvider {
    static var previews: some View {
        SubscriptionBenefitsView(
            userPlan: .pro,
            isPresented: .constant(true)
        )
    }
}