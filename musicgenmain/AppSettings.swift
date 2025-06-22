import SwiftUI

class AppSettings: ObservableObject {
    @Published var isDarkMode: Bool {
        didSet {
            UserDefaults.standard.set(isDarkMode, forKey: "isDarkMode")
        }
    }
    
    init() {
        // Set dark mode as default (true), only change if user has explicitly set it to false
        if UserDefaults.standard.object(forKey: "isDarkMode") == nil {
            // First launch - default to dark mode
            self.isDarkMode = true
            UserDefaults.standard.set(true, forKey: "isDarkMode")
        } else {
            self.isDarkMode = UserDefaults.standard.bool(forKey: "isDarkMode")
        }
    }
}