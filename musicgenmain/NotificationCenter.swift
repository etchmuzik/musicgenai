import SwiftUI

// MARK: - In-App Notification System

struct NotificationOverlay: View {
    @EnvironmentObject var universalAPI: UniversalPiAPI
    @EnvironmentObject var appSettings: AppSettings
    
    var body: some View {
        VStack(spacing: 10) {
            ForEach(universalAPI.notifications) { notification in
                NotificationCard(notification: notification)
                    .environmentObject(appSettings)
                    .transition(.move(edge: .top).combined(with: .opacity))
            }
            Spacer()
        }
        .padding(.horizontal)
        .padding(.top, 10)
        .animation(.easeInOut(duration: 0.3), value: universalAPI.notifications.count)
    }
}

struct NotificationCard: View {
    @EnvironmentObject var appSettings: AppSettings
    @EnvironmentObject var universalAPI: UniversalPiAPI
    let notification: InAppNotification
    
    var notificationColor: Color {
        switch notification.type {
        case .success: return .green
        case .error: return .red
        case .warning: return .orange
        case .info: return .blue
        }
    }
    
    var notificationIcon: String {
        switch notification.type {
        case .success: return "checkmark.circle.fill"
        case .error: return "xmark.circle.fill"
        case .warning: return "exclamationmark.triangle.fill"
        case .info: return "info.circle.fill"
        }
    }
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: notificationIcon)
                .font(.title2)
                .foregroundColor(notificationColor)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(notification.title)
                    .font(.headline)
                    .fontWeight(.semibold)
                    .foregroundColor(appSettings.isDarkMode ? .white : .black)
                
                Text(notification.message)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }
            
            Spacer()
            
            Button(action: {
                universalAPI.removeNotification(notification.id)
            }) {
                Image(systemName: "xmark")
                    .font(.caption)
                    .foregroundColor(.gray)
                    .padding(8)
                    .background(Color.gray.opacity(0.2))
                    .clipShape(Circle())
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(appSettings.isDarkMode ? Color.black.opacity(0.8) : Color.white)
                .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 2)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(notificationColor.opacity(0.3), lineWidth: 1)
        )
    }
}

// MARK: - Generation Progress Overlay

struct GenerationProgressOverlay: View {
    @EnvironmentObject var universalAPI: UniversalPiAPI
    @EnvironmentObject var appSettings: AppSettings
    
    var body: some View {
        if universalAPI.isGenerating {
            ZStack {
                Color.black.opacity(0.6)
                    .ignoresSafeArea()
                
                VStack(spacing: 20) {
                    // Animated music waves
                    HStack(spacing: 4) {
                        ForEach(0..<8, id: \.self) { index in
                            RoundedRectangle(cornerRadius: 2)
                                .fill(Color.blue)
                                .frame(width: 6, height: CGFloat.random(in: 20...60))
                                .animation(
                                    .easeInOut(duration: 0.6)
                                    .repeatForever()
                                    .delay(Double(index) * 0.1),
                                    value: true
                                )
                        }
                    }
                    .frame(height: 60)
                    
                    VStack(spacing: 10) {
                        Text("Generating Your Music...")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                        
                        Text("Creating amazing tracks just for you")
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.8))
                        
                        // Progress bar
                        ProgressView(value: universalAPI.generationProgress)
                            .progressViewStyle(LinearProgressViewStyle())
                            .frame(width: 200)
                            .accentColor(.blue)
                        
                        Text("\(Int(universalAPI.generationProgress * 100))% Complete")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.7))
                    }
                    
                    // Active tasks count
                    if !universalAPI.currentTaskIds.isEmpty {
                        Text("\(universalAPI.currentTaskIds.count) task(s) running")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.6))
                    }
                }
                .padding(30)
                .background(
                    RoundedRectangle(cornerRadius: 20)
                        .fill(Color.black.opacity(0.8))
                        .overlay(
                            RoundedRectangle(cornerRadius: 20)
                                .stroke(Color.blue.opacity(0.3), lineWidth: 1)
                        )
                )
            }
            .transition(.opacity)
            .animation(.easeInOut(duration: 0.3), value: universalAPI.isGenerating)
        }
    }
}

// MARK: - Queue Status View

struct QueueStatusView: View {
    @EnvironmentObject var universalAPI: UniversalPiAPI
    @EnvironmentObject var appSettings: AppSettings
    
    var body: some View {
        if !universalAPI.generationQueue.isEmpty {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Image(systemName: "line.horizontal.3")
                        .font(.title3)
                        .foregroundColor(.blue)
                    
                    Text("Generation Queue")
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    Spacer()
                    
                    Text("\(universalAPI.generationQueue.count) tasks")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                ForEach(universalAPI.generationQueue.prefix(3)) { task in
                    QueueTaskRow(task: task)
                }
                
                if universalAPI.generationQueue.count > 3 {
                    Text("+ \(universalAPI.generationQueue.count - 3) more...")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .padding(.leading)
                }
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(appSettings.isDarkMode ? Color.white.opacity(0.05) : Color.black.opacity(0.03))
            )
            .padding(.horizontal)
        }
    }
}

struct QueueTaskRow: View {
    let task: GenerationTask
    
    var statusColor: Color {
        switch task.status {
        case .queued: return .gray
        case .processing: return .blue
        case .completed: return .green
        case .failed: return .red
        }
    }
    
    var statusIcon: String {
        switch task.status {
        case .queued: return "clock"
        case .processing: return "waveform"
        case .completed: return "checkmark.circle.fill"
        case .failed: return "xmark.circle.fill"
        }
    }
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: statusIcon)
                .font(.caption)
                .foregroundColor(statusColor)
                .frame(width: 20)
            
            VStack(alignment: .leading, spacing: 2) {
                Text("\(task.genre) • \(task.mood)")
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                if let prompt = task.prompt, !prompt.isEmpty {
                    Text(prompt)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 2) {
                Text(task.status.description)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(statusColor)
                
                if task.status == .completed, let tracksCount = task.tracks?.count {
                    Text("\(tracksCount) tracks")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 6)
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(statusColor.opacity(0.1))
        )
    }
}

// MARK: - Extensions

extension GenerationTask.TaskStatus {
    var description: String {
        switch self {
        case .queued: return "Queued"
        case .processing: return "Processing"
        case .completed: return "Completed"
        case .failed: return "Failed"
        }
    }
}

// MARK: - Preview Helpers

struct NotificationCenter_Previews: PreviewProvider {
    static var previews: some View {
        ZStack {
            Color.gray.opacity(0.1)
                .ignoresSafeArea()
            
            VStack {
                NotificationOverlay()
                Spacer()
                QueueStatusView()
            }
        }
        .environmentObject(UniversalPiAPI.shared)
        .environmentObject(AppSettings())
    }
}