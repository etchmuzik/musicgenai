import SwiftUI

struct ExtendView: View {
    @EnvironmentObject var appSettings: AppSettings
    let track: TrackData
    @State private var extensionLength = 30.0
    @State private var extendDirection = "End"
    @State private var maintainStyle = true
    @State private var addVariation = false
    @State private var isProcessing = false
    @State private var processingProgress = 0.0
    
    let directions = ["Beginning", "End", "Both"]
    
    var body: some View {
        ZStack {
            LinearGradient(
                colors: appSettings.isDarkMode ? [Color.blue.opacity(0.3), Color.black] : [Color.blue.opacity(0.1), Color.white],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            VStack(spacing: 25) {
                // Header
                VStack(spacing: 10) {
                    Image(systemName: "waveform.badge.plus")
                        .font(.system(size: 60))
                        .foregroundColor(.blue)
                    
                    Text("Extend Track")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    
                    Text(track.title)
                        .font(.subheadline)
                        .foregroundColor(.gray)
                }
                .padding(.top, 30)
                
                // Extension settings
                VStack(alignment: .leading, spacing: 20) {
                    Text("Extension Settings")
                        .font(.headline)
                    
                    VStack(alignment: .leading, spacing: 15) {
                        HStack {
                            Text("Length: \(Int(extensionLength)) seconds")
                                .font(.subheadline)
                                .foregroundColor(.gray)
                            Spacer()
                        }
                        
                        Slider(value: $extensionLength, in: 10...120, step: 5)
                            .accentColor(.blue)
                        
                        Text("Direction")
                            .font(.subheadline)
                            .foregroundColor(.gray)
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 12) {
                                ForEach(directions, id: \.self) { direction in
                                    Button(action: { extendDirection = direction }) {
                                        Text(direction)
                                            .font(.subheadline)
                                            .fontWeight(.medium)
                                            .foregroundColor(extendDirection == direction ? .white : (appSettings.isDarkMode ? .white : .black))
                                            .padding(.horizontal, 20)
                                            .padding(.vertical, 10)
                                            .background(
                                                extendDirection == direction ? Color.blue : Color.gray.opacity(0.1)
                                            )
                                            .cornerRadius(20)
                                    }
                                }
                            }
                        }
                        
                        Toggle("Maintain Musical Style", isOn: $maintainStyle)
                            .toggleStyle(SwitchToggleStyle(tint: .blue))
                        
                        Toggle("Add Musical Variation", isOn: $addVariation)
                            .toggleStyle(SwitchToggleStyle(tint: .blue))
                    }
                }
                .padding()
                .background(appSettings.isDarkMode ? Color.white.opacity(0.05) : Color.black.opacity(0.03))
                .cornerRadius(20)
                .padding(.horizontal)
                
                Spacer()
                
                Button(action: processExtension) {
                    ZStack {
                        if isProcessing {
                            HStack {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                Text("Extending... \(Int(processingProgress * 100))%")
                                    .fontWeight(.semibold)
                            }
                        } else {
                            HStack {
                                Image(systemName: "waveform.badge.plus")
                                Text("Extend Track")
                                    .fontWeight(.semibold)
                            }
                        }
                    }
                    .font(.title3)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 20)
                    .background(Color.blue)
                    .cornerRadius(20)
                    .opacity(isProcessing ? 0.7 : 1)
                }
                .disabled(isProcessing)
                .padding(.horizontal)
                .padding(.bottom, 30)
            }
        }
        .navigationTitle("Extend")
        .navigationBarTitleDisplayMode(.inline)
    }
    
    func processExtension() {
        isProcessing = true
        processingProgress = 0
        
        Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { timer in
            processingProgress += 0.03
            if processingProgress >= 1.0 {
                timer.invalidate()
                isProcessing = false
            }
        }
    }
}

struct ExtendView_Previews: PreviewProvider {
    static var previews: some View {
        ExtendView(track: TrackData(title: "Sample Track", genre: "Electronic", mood: "Energetic", prompt: "Sample prompt", duration: 225.0, audioURL: nil, taskId: nil, createdAt: Date(), isPublished: false, isFavorite: false, plays: 0, likes: 0, imageURL: nil, tags: ["electronic"]))
            .environmentObject(AppSettings())
    }
}