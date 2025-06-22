# Build Troubleshooting Guide

## Current Build Issues

### Symptoms
- SwiftCompile failures in multiple files
- SubscriptionBenefitsView.swift compilation error
- Build process fails at Swift compilation stage

## Troubleshooting Steps

### 1. Clean Build Folder
```bash
# In Xcode
Product → Clean Build Folder (Shift+Cmd+K)

# Or via command line
rm -rf ~/Library/Developer/Xcode/DerivedData/musicgenmain-*
```

### 2. Reset Package Dependencies
```bash
# In Xcode
File → Packages → Reset Package Caches
File → Packages → Resolve Package Versions
```

### 3. Check Swift Version Compatibility
- Ensure all files use Swift 5.0+ syntax
- Check for deprecated APIs
- Verify iOS deployment target (16.6)

### 4. Common Fixes

#### Missing Imports
Add these imports to files as needed:
```swift
import SwiftUI
import Foundation
import Firebase
import FirebaseAuth
import FirebaseFirestore
import StoreKit
```

#### Type Ambiguity
- Use fully qualified names (e.g., `StoreKit.Transaction`)
- Check for naming conflicts between modules

#### Access Control
- Ensure proper access levels (public, internal, private)
- Check @MainActor annotations

### 5. Build Settings to Check
- **iOS Deployment Target**: 16.6
- **Swift Language Version**: 5.0
- **Build Active Architecture Only**: Yes (Debug)
- **Enable Modules**: Yes

### 6. Firebase Configuration
- Verify GoogleService-Info.plist is in project
- Check bundle ID matches Firebase config
- Ensure all Firebase packages are up to date

### 7. Clean Installation Steps
1. Delete app from simulator
2. Clean build folder
3. Delete DerivedData
4. Restart Xcode
5. Build and run

### 8. Dependency Conflicts
Check for version conflicts in:
- Firebase SDK (currently 10.29.0)
- StoreKit 2 requirements
- Swift Concurrency support

## Quick Fixes to Try

### Fix 1: Update Package Dependencies
```bash
# Update to latest compatible versions
swift package update
```

### Fix 2: Reset Simulator
```bash
xcrun simctl erase all
```

### Fix 3: Verify Xcode Command Line Tools
```bash
xcode-select --install
sudo xcode-select --switch /Applications/Xcode.app
```

### Fix 4: Check for Syntax Issues
```bash
# Lint Swift files
swiftlint autocorrect --path musicgenmain/
```

## If All Else Fails

1. Create a new Xcode project
2. Copy source files one by one
3. Add dependencies incrementally
4. Test build after each addition

## Build Command for Testing
```bash
xcodebuild -project musicgenmain.xcodeproj \
  -scheme musicgenmain \
  -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 16' \
  clean build
```

## Error Log Location
```
~/Library/Developer/Xcode/DerivedData/musicgenmain-*/Logs/Build/
```

---

**Note**: The build issues appear to be related to module resolution and Swift compilation. The individual files parse correctly, suggesting the issue is with project configuration or dependencies.