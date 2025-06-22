import SwiftUI

struct PublishView: View {
    @EnvironmentObject var appSettings: AppSettings
    let track: TrackData
    
    @State private var trackTitle = ""
    @State private var artistName = ""
    @State private var description = ""
    @State private var selectedGenre = "Electronic"
    @State private var agreedToTerms = false
    @State private var selectedPlan = "Basic"
    @State private var showingSubmission = false
    @State private var submissionProgress: Double = 0
    @State private var isSubmitting = false
    
    let genres = ["Electronic", "House", "Techno", "Trance", "Ambient", "Experimental"]
    let plans = ["Basic", "Premium", "Exclusive"]
    
    var body: some View {
        NavigationView {
            ZStack {
                // Background gradient
                LinearGradient(
                    colors: appSettings.isDarkMode ? [Color.orange.opacity(0.3), Color.black] : [Color.orange.opacity(0.1), Color.white],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 25) {
                        // Header
                        VStack(spacing: 10) {
                            Image(systemName: "globe")
                                .font(.system(size: 60))
                                .foregroundColor(.orange)
                                .shadow(color: .orange.opacity(0.5), radius: 10)
                            
                            Text("Publish to Label")
                                .font(.largeTitle)
                                .fontWeight(.bold)
                                .foregroundColor(appSettings.isDarkMode ? .white : Color(red: 0.1, green: 0.1, blue: 0.2))
                            
                            Text("Submit your track to our record label")
                                .font(.subheadline)
                                .foregroundColor(.gray)
                        }
                        .padding(.top, 30)
                        
                        // Track preview
                        VStack(spacing: 15) {
                            Text("Track Preview")
                                .font(.headline)
                                .foregroundColor(appSettings.isDarkMode ? .white : .black)
                            
                            HStack(spacing: 15) {
                                RoundedRectangle(cornerRadius: 15)
                                    .fill(
                                        LinearGradient(
                                            colors: [.orange, .red],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        )
                                    )
                                    .frame(width: 80, height: 80)
                                    .overlay(
                                        Image(systemName: "music.note")
                                            .font(.title)
                                            .foregroundColor(.white)
                                    )
                                
                                VStack(alignment: .leading, spacing: 5) {
                                    Text(track.title)
                                        .font(.headline)
                                        .foregroundColor(appSettings.isDarkMode ? .white : .black)
                                    
                                    Text("\(track.genre) • \(track.mood)")
                                        .font(.subheadline)
                                        .foregroundColor(.gray)
                                    
                                    Text(track.formattedDuration)
                                        .font(.caption)
                                        .foregroundColor(.gray)
                                }
                                
                                Spacer()
                            }
                            .padding()
                            .background(appSettings.isDarkMode ? Color.white.opacity(0.05) : Color.black.opacity(0.03))
                            .cornerRadius(15)
                        }
                        .padding(.horizontal)
                        
                        // Submission form
                        VStack(alignment: .leading, spacing: 20) {
                            Text("Release Information")
                                .font(.headline)
                                .foregroundColor(appSettings.isDarkMode ? .white : .black)
                            
                            VStack(alignment: .leading, spacing: 15) {
                                VStack(alignment: .leading, spacing: 5) {
                                    Text("Track Title")
                                        .font(.subheadline)
                                        .foregroundColor(.gray)
                                    TextField("Enter track title", text: $trackTitle)
                                        .textFieldStyle(RoundedBorderTextFieldStyle())
                                }
                                
                                VStack(alignment: .leading, spacing: 5) {
                                    Text("Artist Name")
                                        .font(.subheadline)
                                        .foregroundColor(.gray)
                                    TextField("Your artist name", text: $artistName)
                                        .textFieldStyle(RoundedBorderTextFieldStyle())
                                }
                                
                                VStack(alignment: .leading, spacing: 5) {
                                    Text("Genre")
                                        .font(.subheadline)
                                        .foregroundColor(.gray)
                                    
                                    ScrollView(.horizontal, showsIndicators: false) {
                                        HStack(spacing: 10) {
                                            ForEach(genres, id: \.self) { genre in
                                                GenreTag(
                                                    title: genre,
                                                    isSelected: selectedGenre == genre,
                                                    action: { selectedGenre = genre }
                                                )
                                                .environmentObject(appSettings)
                                            }
                                        }
                                    }
                                }
                                
                                VStack(alignment: .leading, spacing: 5) {
                                    Text("Description")
                                        .font(.subheadline)
                                        .foregroundColor(.gray)
                                    TextField("Tell us about your track...", text: $description, axis: .vertical)
                                        .textFieldStyle(RoundedBorderTextFieldStyle())
                                        .frame(minHeight: 80)
                                }
                            }
                        }
                        .padding()
                        .background(appSettings.isDarkMode ? Color.white.opacity(0.05) : Color.black.opacity(0.03))
                        .cornerRadius(20)
                        .padding(.horizontal)
                        
                        // Release plans
                        VStack(alignment: .leading, spacing: 15) {
                            Text("Release Plan")
                                .font(.headline)
                                .foregroundColor(appSettings.isDarkMode ? .white : .black)
                            
                            VStack(spacing: 12) {
                                ReleasePlanCard(
                                    title: "Basic",
                                    price: "Free",
                                    features: ["Digital distribution", "Basic analytics", "30% revenue share"],
                                    isSelected: selectedPlan == "Basic",
                                    action: { selectedPlan = "Basic" }
                                )
                                .environmentObject(appSettings)
                                
                                ReleasePlanCard(
                                    title: "Premium",
                                    price: "$29",
                                    features: ["Priority distribution", "Advanced analytics", "50% revenue share", "Playlist pitching"],
                                    isSelected: selectedPlan == "Premium",
                                    action: { selectedPlan = "Premium" }
                                )
                                .environmentObject(appSettings)
                                
                                ReleasePlanCard(
                                    title: "Exclusive",
                                    price: "$99",
                                    features: ["Instant distribution", "Full analytics suite", "70% revenue share", "Marketing support", "Radio promotion"],
                                    isSelected: selectedPlan == "Exclusive",
                                    action: { selectedPlan = "Exclusive" }
                                )
                                .environmentObject(appSettings)
                            }
                        }
                        .padding(.horizontal)
                        
                        // Terms and submit
                        VStack(spacing: 20) {
                            Toggle(isOn: $agreedToTerms) {
                                Text("I agree to the terms and conditions")
                                    .font(.subheadline)
                                    .foregroundColor(appSettings.isDarkMode ? .white : .black)
                            }
                            .toggleStyle(SwitchToggleStyle(tint: .orange))
                            .padding(.horizontal)
                            
                            Button(action: submitTrack) {
                                ZStack {
                                    if isSubmitting {
                                        HStack {
                                            ProgressView()
                                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                            Text("Submitting... \(Int(submissionProgress * 100))%")
                                                .fontWeight(.semibold)
                                        }
                                    } else {
                                        HStack {
                                            Image(systemName: "paperplane.fill")
                                            Text("Submit to Label")
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
                                        colors: [.orange, .red],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                                .cornerRadius(20)
                                .opacity(canSubmit ? 1 : 0.5)
                            }
                            .disabled(!canSubmit || isSubmitting)
                            .padding(.horizontal)
                        }
                        .padding(.bottom, 30)
                    }
                }
            }
            .navigationTitle("Publish")
            .navigationBarTitleDisplayMode(.inline)
            .onAppear {
                trackTitle = track.title
                selectedGenre = track.genre
            }
        }
        .sheet(isPresented: $showingSubmission) {
            SubmissionSuccessView()
                .environmentObject(appSettings)
        }
    }
    
    var canSubmit: Bool {
        !trackTitle.isEmpty && !artistName.isEmpty && agreedToTerms
    }
    
    func submitTrack() {
        isSubmitting = true
        submissionProgress = 0
        
        // Simulate submission
        Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { timer in
            submissionProgress += 0.05
            if submissionProgress >= 1.0 {
                timer.invalidate()
                isSubmitting = false
                showingSubmission = true
            }
        }
    }
}

struct GenreTag: View {
    @EnvironmentObject var appSettings: AppSettings
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.caption)
                .fontWeight(.medium)
                .foregroundColor(isSelected ? .white : (appSettings.isDarkMode ? .white : .black))
                .padding(.horizontal, 15)
                .padding(.vertical, 8)
                .background(
                    isSelected ? LinearGradient(colors: [.orange, .red], startPoint: .leading, endPoint: .trailing) : LinearGradient(colors: [Color.gray.opacity(0.1), Color.gray.opacity(0.1)], startPoint: .leading, endPoint: .trailing)
                )
                .cornerRadius(15)
        }
    }
}

struct ReleasePlanCard: View {
    @EnvironmentObject var appSettings: AppSettings
    let title: String
    let price: String
    let features: [String]
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    VStack(alignment: .leading) {
                        Text(title)
                            .font(.headline)
                            .fontWeight(.bold)
                        Text(price)
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.orange)
                    }
                    
                    Spacer()
                    
                    Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                        .font(.title2)
                        .foregroundColor(isSelected ? .orange : .gray)
                }
                
                VStack(alignment: .leading, spacing: 5) {
                    ForEach(features, id: \.self) { feature in
                        HStack {
                            Image(systemName: "checkmark")
                                .font(.caption)
                                .foregroundColor(.green)
                            Text(feature)
                                .font(.caption)
                                .foregroundColor(.gray)
                        }
                    }
                }
            }
            .padding()
            .background(appSettings.isDarkMode ? Color.white.opacity(0.05) : Color.black.opacity(0.03))
            .cornerRadius(15)
            .overlay(
                RoundedRectangle(cornerRadius: 15)
                    .stroke(isSelected ? Color.orange : Color.clear, lineWidth: 2)
            )
        }
        .foregroundColor(appSettings.isDarkMode ? .white : .black)
    }
}

struct SubmissionSuccessView: View {
    @EnvironmentObject var appSettings: AppSettings
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        VStack(spacing: 30) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 100))
                .foregroundColor(.green)
            
            Text("Submission Successful!")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            Text("Your track has been submitted to our label. We'll review it within 5-7 business days and get back to you with feedback.")
                .font(.body)
                .multilineTextAlignment(.center)
                .foregroundColor(.gray)
                .padding(.horizontal)
            
            Button("Done") {
                presentationMode.wrappedValue.dismiss()
            }
            .font(.headline)
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.green)
            .cornerRadius(15)
            .padding(.horizontal)
        }
        .padding()
    }
}

struct PublishView_Previews: PreviewProvider {
    static var previews: some View {
        PublishView(track: TrackData(title: "Sample Track", genre: "Electronic", mood: "Energetic", prompt: "Sample prompt", duration: 225.0, audioURL: nil, taskId: nil, createdAt: Date(), isPublished: false, isFavorite: false, plays: 0, likes: 0, imageURL: nil, tags: ["electronic"]))
            .environmentObject(AppSettings())
    }
}