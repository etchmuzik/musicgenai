import SwiftUI
import PhotosUI

struct RemixView: View {
    @EnvironmentObject var appSettings: AppSettings
    @State private var selectedItem: PhotosPickerItem?
    @State private var uploadedFileName = ""
    @State private var remixStyle = "Electronic"
    @State private var remixIntensity: Double = 0.5
    @State private var preserveVocals = true
    @State private var addEffects = true
    @State private var showingFilePicker = false
    @State private var isProcessing = false
    @State private var uploadProgress: Double = 0
    
    var sourceTrack: TrackData?
    
    let remixStyles = ["Electronic", "Acoustic", "Hip-Hop", "Ambient", "Experimental"]
    
    var body: some View {
        NavigationView {
            ZStack {
                // Background gradient
                LinearGradient(
                    colors: appSettings.isDarkMode ? [Color.purple.opacity(0.3), Color.black] : [Color.purple.opacity(0.1), Color.white],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 25) {
                        // Header
                        VStack(spacing: 10) {
                            Image(systemName: "arrow.triangle.2.circlepath")
                                .font(.system(size: 60))
                                .foregroundColor(.purple)
                                .shadow(color: .purple.opacity(0.5), radius: 10)
                            
                            Text(sourceTrack != nil ? "Remix Track" : "Create Remix")
                                .font(.largeTitle)
                                .fontWeight(.bold)
                                .foregroundColor(appSettings.isDarkMode ? .white : Color(red: 0.1, green: 0.1, blue: 0.2))
                            
                            if let track = sourceTrack {
                                Text("Source: \(track.title)")
                                    .font(.subheadline)
                                    .foregroundColor(.gray)
                            }
                        }
                        .padding(.top, 30)
                        
                        // Upload section
                        VStack(alignment: .leading, spacing: 15) {
                            Label("Upload Audio", systemImage: "square.and.arrow.up")
                                .font(.headline)
                                .foregroundColor(appSettings.isDarkMode ? .white : .black)
                            
                            if uploadedFileName.isEmpty {
                                PhotosPicker(selection: $selectedItem, matching: .videos) {
                                    VStack(spacing: 15) {
                                        Image(systemName: "doc.badge.plus")
                                            .font(.system(size: 50))
                                            .foregroundColor(.purple)
                                        
                                        Text("Select audio file")
                                            .font(.headline)
                                        
                                        Text("MP3, WAV, M4A supported")
                                            .font(.caption)
                                            .foregroundColor(.gray)
                                    }
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 150)
                                    .background(appSettings.isDarkMode ? Color.white.opacity(0.05) : Color.black.opacity(0.03))
                                    .cornerRadius(20)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 20)
                                            .stroke(style: StrokeStyle(lineWidth: 2, dash: [5]))
                                            .foregroundColor(.purple.opacity(0.5))
                                    )
                                }
                                .onChange(of: selectedItem) { _ in
                                    uploadedFileName = "audio_file.mp3"
                                }
                            } else {
                                HStack {
                                    Image(systemName: "music.note")
                                        .font(.title2)
                                        .foregroundColor(.purple)
                                    
                                    VStack(alignment: .leading) {
                                        Text(uploadedFileName)
                                            .font(.headline)
                                        Text("3.2 MB • Ready to remix")
                                            .font(.caption)
                                            .foregroundColor(.gray)
                                    }
                                    
                                    Spacer()
                                    
                                    Button(action: {
                                        uploadedFileName = ""
                                        selectedItem = nil
                                    }) {
                                        Image(systemName: "xmark.circle.fill")
                                            .font(.title2)
                                            .foregroundColor(.gray)
                                    }
                                }
                                .padding()
                                .background(appSettings.isDarkMode ? Color.white.opacity(0.05) : Color.black.opacity(0.03))
                                .cornerRadius(15)
                            }
                        }
                        .padding(.horizontal)
                        
                        // Remix settings
                        VStack(alignment: .leading, spacing: 20) {
                            Label("Remix Settings", systemImage: "slider.horizontal.3")
                                .font(.headline)
                                .foregroundColor(appSettings.isDarkMode ? .white : .black)
                            
                            // Style selector
                            VStack(alignment: .leading, spacing: 10) {
                                Text("Style")
                                    .font(.subheadline)
                                    .foregroundColor(.gray)
                                
                                ScrollView(.horizontal, showsIndicators: false) {
                                    HStack(spacing: 12) {
                                        ForEach(remixStyles, id: \.self) { style in
                                            StyleButton(
                                                title: style,
                                                isSelected: remixStyle == style,
                                                action: { remixStyle = style }
                                            )
                                            .environmentObject(appSettings)
                                        }
                                    }
                                }
                            }
                            
                            // Intensity slider
                            VStack(alignment: .leading, spacing: 10) {
                                HStack {
                                    Text("Remix Intensity")
                                        .font(.subheadline)
                                        .foregroundColor(.gray)
                                    Spacer()
                                    Text("\(Int(remixIntensity * 100))%")
                                        .font(.caption)
                                        .foregroundColor(.purple)
                                }
                                
                                Slider(value: $remixIntensity, in: 0...1)
                                    .accentColor(.purple)
                            }
                            
                            // Options toggles
                            VStack(spacing: 15) {
                                Toggle(isOn: $preserveVocals) {
                                    HStack {
                                        Image(systemName: "mic.fill")
                                            .foregroundColor(.purple)
                                        Text("Preserve Vocals")
                                            .font(.subheadline)
                                    }
                                }
                                .toggleStyle(SwitchToggleStyle(tint: .purple))
                                
                                Toggle(isOn: $addEffects) {
                                    HStack {
                                        Image(systemName: "sparkles")
                                            .foregroundColor(.purple)
                                        Text("Add Creative Effects")
                                            .font(.subheadline)
                                    }
                                }
                                .toggleStyle(SwitchToggleStyle(tint: .purple))
                            }
                        }
                        .padding(.horizontal)
                        .padding()
                        .background(appSettings.isDarkMode ? Color.white.opacity(0.05) : Color.black.opacity(0.03))
                        .cornerRadius(20)
                        .padding(.horizontal)
                        
                        // Process button
                        Button(action: processRemix) {
                            ZStack {
                                if isProcessing {
                                    HStack {
                                        ProgressView()
                                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                        Text("Processing... \(Int(uploadProgress * 100))%")
                                            .fontWeight(.semibold)
                                    }
                                } else {
                                    HStack {
                                        Image(systemName: "wand.and.stars")
                                        Text("Create Remix")
                                            .fontWeight(.semibold)
                                    }
                                }
                            }
                            .font(.title3)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 20)
                            .background(
                                LinearGradient(
                                    colors: [.purple, .pink],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .cornerRadius(20)
                            .opacity(uploadedFileName.isEmpty || isProcessing ? 0.5 : 1)
                        }
                        .disabled(uploadedFileName.isEmpty || isProcessing)
                        .padding(.horizontal)
                        .padding(.bottom, 30)
                    }
                }
            }
            .navigationBarHidden(true)
        }
    }
    
    func processRemix() {
        isProcessing = true
        uploadProgress = 0
        
        // Simulate upload and processing
        Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { timer in
            uploadProgress += 0.05
            if uploadProgress >= 1.0 {
                timer.invalidate()
                isProcessing = false
                // Navigate to generation view with remix
            }
        }
    }
}

struct StyleButton: View {
    @EnvironmentObject var appSettings: AppSettings
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(isSelected ? .white : (appSettings.isDarkMode ? .white : .black))
                .padding(.horizontal, 20)
                .padding(.vertical, 10)
                .background(
                    isSelected ? LinearGradient(colors: [.purple, .pink], startPoint: .leading, endPoint: .trailing) : LinearGradient(colors: [Color.gray.opacity(0.1), Color.gray.opacity(0.1)], startPoint: .leading, endPoint: .trailing)
                )
                .cornerRadius(20)
        }
    }
}

struct RemixView_Previews: PreviewProvider {
    static var previews: some View {
        RemixView()
            .environmentObject(AppSettings())
    }
}