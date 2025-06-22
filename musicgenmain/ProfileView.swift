import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var appSettings: AppSettings
    @EnvironmentObject var firebaseManager: FirebaseManager
    @State private var notificationsEnabled = true
    @State private var autoSave = true
    @State private var highQuality = false
    @State private var showingSettings = false
    @State private var showingSubscriptions = false
    @State private var showingSignOutAlert = false
    @State private var showingDeleteAccountAlert = false
    @State private var showingResetLimitsAlert = false
    
    var body: some View {
        NavigationView {
            ZStack {
                // Background
                LinearGradient(
                    colors: appSettings.isDarkMode ? [Color.gray.opacity(0.3), Color.black] : [Color.gray.opacity(0.1), Color.white],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 0) {
                        // Profile header
                        headerSection
                            .padding(.top, 20)
                        
                        // Subscription status section
                        if let userProfile = firebaseManager.userProfile {
                            subscriptionSection(userProfile)
                                .padding(.top, 25)
                        }
                        
                        // Points and usage section
                        if let userProfile = firebaseManager.userProfile {
                            pointsSection(userProfile)
                                .padding(.top, 20)
                        }
                        
                        // Stats section
                        statsSection
                            .padding(.top, 25)
                        
                        // Settings section
                        settingsSection
                            .padding(.top, 30)
                        
                        // Action buttons section
                        actionButtonsSection
                            .padding(.top, 30)
                        
                        // Bottom padding to prevent tab bar overlap
                        Color.clear
                            .frame(height: 100)
                    }
                }
            }
            .navigationBarHidden(true)
        }
        .sheet(isPresented: $showingSubscriptions) {
            SubscriptionView()
                .environmentObject(firebaseManager)
        }
    }
    
    @ViewBuilder
    private var headerSection: some View {
        VStack(spacing: 15) {
            // Profile image
            if let profileImageURL = firebaseManager.userProfile?.profileImageURL,
               let url = URL(string: profileImageURL) {
                AsyncImage(url: url) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    Circle()
                        .fill(LinearGradient(colors: [.purple, .blue], startPoint: .topLeading, endPoint: .bottomTrailing))
                        .overlay(
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        )
                }
                .frame(width: 100, height: 100)
                .clipShape(Circle())
            } else {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [.purple, .blue],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 100, height: 100)
                    .overlay(
                        Text(String(firebaseManager.userProfile?.displayName.prefix(2).uppercased() ?? "DJ"))
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                    )
            }
            
            VStack(spacing: 5) {
                Text(firebaseManager.userProfile?.displayName ?? "Music Creator")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(appSettings.isDarkMode ? .white : .black)
                
                Text(firebaseManager.userProfile?.email ?? "user@example.com")
                    .font(.subheadline)
                    .foregroundColor(.gray)
                
                // Member since
                if let createdAt = firebaseManager.userProfile?.createdAt {
                    Text("Member since \(createdAt, style: .date)")
                        .font(.caption)
                        .foregroundColor(.gray)
                }
            }
        }
    }
    
    @ViewBuilder
    private func subscriptionSection(_ userProfile: MusicGenUserProfile) -> some View {
        VStack(alignment: .leading, spacing: 15) {
            HStack {
                Text("Subscription")
                    .font(.headline)
                    .foregroundColor(appSettings.isDarkMode ? .white : .black)
                
                Spacer()
                
                Button("Upgrade") {
                    showingSubscriptions = true
                }
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.blue)
            }
            
            HStack {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Image(systemName: userProfile.currentPlan.icon)
                            .foregroundColor(userProfile.currentPlan.color)
                        Text(userProfile.currentPlan.displayName)
                            .font(.title3)
                            .fontWeight(.semibold)
                        
                        if userProfile.currentPlan != .free {
                            Text("$\(Double(truncating: userProfile.currentPlan.monthlyPrice as NSNumber), specifier: "%.2f")/mo")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    
                    HStack {
                        Circle()
                            .fill(userProfile.subscriptionStatus.color)
                            .frame(width: 8, height: 8)
                        Text(userProfile.subscriptionStatus.displayName)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }
                
                Spacer()
                
                if userProfile.currentPlan == .free {
                    Button("Upgrade Now") {
                        showingSubscriptions = true
                    }
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(
                        LinearGradient(colors: [.orange, .red], startPoint: .leading, endPoint: .trailing)
                    )
                    .cornerRadius(20)
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(appSettings.isDarkMode ? Color.black.opacity(0.3) : Color.white.opacity(0.8))
                .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
        )
        .padding(.horizontal, 20)
    }
    
    @ViewBuilder
    private func pointsSection(_ userProfile: MusicGenUserProfile) -> some View {
        VStack(spacing: 15) {
            // Points balance
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Generation Points")
                        .font(.headline)
                        .foregroundColor(appSettings.isDarkMode ? .white : .black)
                    
                    HStack(spacing: 15) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("\(userProfile.totalPoints)")
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(.green)
                            Text("Available")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text("\(userProfile.usedPointsToday)/\(userProfile.currentPlan.dailyLimit)")
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(userProfile.usedPointsToday >= userProfile.currentPlan.dailyLimit ? .red : .blue)
                            Text("Used Today")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                
                Spacer()
                
                VStack(spacing: 8) {
                    Image(systemName: "bolt.circle.fill")
                        .font(.system(size: 40))
                        .foregroundColor(.yellow)
                    
                    if userProfile.totalPoints <= 0 {
                        Button("Get More") {
                            showingSubscriptions = true
                        }
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(.white)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.orange)
                        .cornerRadius(12)
                    }
                }
            }
            
            // Usage progress
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("Daily Usage")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    
                    Spacer()
                    
                    Text("\(Int(userProfile.dailyProgress * 100))%")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.secondary)
                }
                
                ProgressView(value: userProfile.dailyProgress)
                    .progressViewStyle(LinearProgressViewStyle(tint: userProfile.currentPlan.color))
            }
            
            // Weekly refresh info
            if Calendar.current.isDate(userProfile.lastPointRefresh, inSameDayAs: Date()) {
                HStack {
                    Image(systemName: "arrow.clockwise")
                        .foregroundColor(.blue)
                    Text("Points refresh weekly")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Spacer()
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(appSettings.isDarkMode ? Color.black.opacity(0.3) : Color.white.opacity(0.8))
                .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
        )
        .padding(.horizontal, 20)
    }
    
    @ViewBuilder
    private var statsSection: some View {
        HStack(spacing: 30) {
            StatItem(
                title: "Tracks", 
                value: "\(firebaseManager.userProfile?.tracks.count ?? 0)"
            )
            StatItem(
                title: "Generations", 
                value: "\(firebaseManager.userProfile?.totalGenerations ?? 0)"
            )
            StatItem(
                title: "Total Plays", 
                value: formatNumber(firebaseManager.userProfile?.totalPlays ?? 0)
            )
        }
        .padding(.vertical, 20)
        .padding(.horizontal, 25)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(appSettings.isDarkMode ? Color.black.opacity(0.3) : Color.white.opacity(0.8))
                .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
        )
        .padding(.horizontal, 20)
    }
    
    @ViewBuilder
    private var settingsSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Settings")
                .font(.headline)
                .foregroundColor(appSettings.isDarkMode ? .white : .black)
                .padding(.horizontal, 20)
                .padding(.bottom, 15)
            
            VStack(spacing: 0) {
                SettingRow(
                    icon: appSettings.isDarkMode ? "moon.fill" : "sun.max.fill",
                    title: "Theme",
                    subtitle: appSettings.isDarkMode ? "Dark Mode" : "Light Mode"
                ) {
                    withAnimation {
                        appSettings.isDarkMode.toggle()
                    }
                }
                
                Divider()
                    .padding(.leading, 50)
                
                SettingToggle(
                    icon: "bell.fill",
                    title: "Notifications",
                    subtitle: "Get updates on your releases",
                    isOn: $notificationsEnabled
                )
                
                Divider()
                    .padding(.leading, 50)
                
                SettingToggle(
                    icon: "square.and.arrow.down.fill",
                    title: "Auto Save",
                    subtitle: "Automatically save your work",
                    isOn: $autoSave
                )
                
                Divider()
                    .padding(.leading, 50)
                
                SettingToggle(
                    icon: "waveform.circle.fill",
                    title: "High Quality Export",
                    subtitle: "Export at maximum quality",
                    isOn: $highQuality
                )
            }
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(appSettings.isDarkMode ? Color.black.opacity(0.3) : Color.white.opacity(0.8))
                    .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
            )
            .padding(.horizontal, 20)
        }
    }
    
    @ViewBuilder
    private var actionButtonsSection: some View {
        VStack(spacing: 12) {
            ActionButton(
                icon: "person.fill",
                title: "Edit Profile",
                color: .blue
            ) {
                // Edit profile action
            }
            
            ActionButton(
                icon: "questionmark.circle.fill",
                title: "Help & Support",
                color: .green
            ) {
                // Help action
            }
            
            ActionButton(
                icon: "creditcard",
                title: "Manage Subscription",
                color: .green
            ) {
                showingSubscriptions = true
            }
            
            ActionButton(
                icon: "rectangle.portrait.and.arrow.right",
                title: "Sign Out",
                color: .red
            ) {
                firebaseManager.signOut()
            }
        }
        .padding(.horizontal, 20)
    }
    
    private func formatNumber(_ number: Int) -> String {
        if number >= 1000000 {
            return String(format: "%.1fM", Double(number) / 1000000)
        } else if number >= 1000 {
            return String(format: "%.1fK", Double(number) / 1000)
        } else {
            return "\(number)"
        }
    }
}

struct StatItem: View {
    let title: String
    let value: String
    @EnvironmentObject var appSettings: AppSettings
    
    var body: some View {
        VStack(spacing: 5) {
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(appSettings.isDarkMode ? .white : .black)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.gray)
        }
    }
}

struct SettingRow: View {
    let icon: String
    let title: String
    let subtitle: String
    let action: () -> Void
    @EnvironmentObject var appSettings: AppSettings
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 15) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(.blue)
                    .frame(width: 25, height: 25)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.headline)
                        .foregroundColor(appSettings.isDarkMode ? .white : .black)
                    
                    Text(subtitle)
                        .font(.caption)
                        .foregroundColor(.gray)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 15)
        }
    }
}

struct SettingToggle: View {
    let icon: String
    let title: String
    let subtitle: String
    @Binding var isOn: Bool
    @EnvironmentObject var appSettings: AppSettings
    
    var body: some View {
        HStack(spacing: 15) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(.blue)
                .frame(width: 25, height: 25)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.headline)
                    .foregroundColor(appSettings.isDarkMode ? .white : .black)
                
                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            
            Spacer()
            
            Toggle("", isOn: $isOn)
                .toggleStyle(SwitchToggleStyle(tint: .blue))
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 15)
    }
}

struct ActionButton: View {
    let icon: String
    let title: String
    let color: Color
    let action: () -> Void
    @EnvironmentObject var appSettings: AppSettings
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 15) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)
                    .frame(width: 25, height: 25)
                
                Text(title)
                    .font(.headline)
                    .foregroundColor(appSettings.isDarkMode ? .white : .black)
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 15)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(appSettings.isDarkMode ? Color.black.opacity(0.3) : Color.white.opacity(0.8))
                    .shadow(color: .black.opacity(0.1), radius: 3, x: 0, y: 1)
            )
        }
    }
}

struct ProfileView_Previews: PreviewProvider {
    static var previews: some View {
        ProfileView()
            .environmentObject(AppSettings())
    }
}