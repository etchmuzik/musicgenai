import SwiftUI

struct APIConfigView: View {
    @EnvironmentObject var appSettings: AppSettings
    @Environment(\.presentationMode) var presentationMode
    
    @State private var sunoAPIKey = ""
    @State private var elevenLabsAPIKey = ""
    @State private var replicateAPIKey = ""
    
    var body: some View {
        NavigationView {
            VStack(spacing: 25) {
                Text("API Configuration")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .padding(.top)
                
                Text("Add your API keys to enable AI music generation and voice synthesis")
                    .font(.subheadline)
                    .foregroundColor(.gray)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
                
                VStack(spacing: 20) {
                    APIKeyField(
                        title: "Suno API",
                        subtitle: "For AI music generation",
                        placeholder: "Enter your Suno API key",
                        apiKey: $sunoAPIKey,
                        websiteURL: "https://suno.com"
                    )
                    
                    APIKeyField(
                        title: "ElevenLabs API",
                        subtitle: "For voice synthesis & cloning",
                        placeholder: "Enter your ElevenLabs API key",
                        apiKey: $elevenLabsAPIKey,
                        websiteURL: "https://elevenlabs.io"
                    )
                    
                    APIKeyField(
                        title: "Replicate API",
                        subtitle: "For MusicGen (Meta) access",
                        placeholder: "Enter your Replicate API key",
                        apiKey: $replicateAPIKey,
                        websiteURL: "https://replicate.com"
                    )
                }
                .padding(.horizontal)
                
                Spacer()
                
                Button(action: saveAPIKeys) {
                    Text("Save API Keys")
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .cornerRadius(15)
                }
                .padding(.horizontal)
                .padding(.bottom, 30)
            }
            .navigationBarItems(trailing: Button("Done") {
                presentationMode.wrappedValue.dismiss()
            })
        }
        .onAppear {
            loadAPIKeys()
        }
    }
    
    func saveAPIKeys() {
        UserDefaults.standard.set(sunoAPIKey, forKey: "sunoAPIKey")
        UserDefaults.standard.set(elevenLabsAPIKey, forKey: "elevenLabsAPIKey")
        UserDefaults.standard.set(replicateAPIKey, forKey: "replicateAPIKey")
        presentationMode.wrappedValue.dismiss()
    }
    
    func loadAPIKeys() {
        sunoAPIKey = UserDefaults.standard.string(forKey: "sunoAPIKey") ?? ""
        elevenLabsAPIKey = UserDefaults.standard.string(forKey: "elevenLabsAPIKey") ?? ""
        replicateAPIKey = UserDefaults.standard.string(forKey: "replicateAPIKey") ?? ""
    }
}

struct APIKeyField: View {
    let title: String
    let subtitle: String
    let placeholder: String
    @Binding var apiKey: String
    let websiteURL: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    Text(subtitle)
                        .font(.caption)
                        .foregroundColor(.gray)
                }
                
                Spacer()
                
                Link("Get API Key", destination: URL(string: websiteURL)!)
                    .font(.caption)
                    .foregroundColor(.blue)
            }
            
            SecureField(placeholder, text: $apiKey)
                .textFieldStyle(RoundedBorderTextFieldStyle())
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(15)
    }
}

struct APIConfigView_Previews: PreviewProvider {
    static var previews: some View {
        APIConfigView()
            .environmentObject(AppSettings())
    }
}