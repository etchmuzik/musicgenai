# Quick Test Plan - MusicGen AI

## ✅ BUILD STATUS: SUCCESS

The app now builds and runs successfully. Here's what to test immediately:

## 1. Launch & First Run
```bash
# Run on simulator
open -a Simulator
xcodebuild -project musicgenmain.xcodeproj -scheme musicgenmain -destination 'platform=iOS Simulator,name=iPhone 16' run
```

## 2. Priority Test Areas

### Authentication (5 min)
- [ ] Launch app - should show welcome screen
- [ ] Tap "Get Started" 
- [ ] Create new account with email/password
- [ ] Verify Firebase user created
- [ ] Check free plan (5 credits) assigned
- [ ] Sign out and sign back in

### Subscription Display (5 min)
- [ ] Main screen shows subscription status
- [ ] Displays "Free" plan with 5 generations
- [ ] Shows 0/2 daily usage
- [ ] Tap subscription area
- [ ] View all three plans with pricing
- [ ] Check "Upgrade to Premium" button

### Generation Interface (10 min)
- [ ] Select different genres (Techno, House, etc.)
- [ ] Select different moods
- [ ] Enter custom prompt text
- [ ] Toggle instrumental on/off
- [ ] Check lyrics editor appears
- [ ] Try duration controls
- [ ] Enable extended mode
- [ ] Try to generate (will show maintenance error)

### Error Handling (5 min)
- [ ] Generate button shows PiAPI maintenance message
- [ ] Check no points deducted on error
- [ ] Verify user-friendly error messages
- [ ] Test with no internet (airplane mode)

### Navigation (5 min)
- [ ] Tab bar navigation works
- [ ] Library tab (may be empty)
- [ ] Explore tab
- [ ] Profile tab shows user info
- [ ] All screens load without crashes

## 3. Expected Behaviors

### What SHOULD Work:
- ✅ Authentication flow
- ✅ UI navigation
- ✅ Form inputs and validation
- ✅ Subscription display
- ✅ Error messages for PiAPI down

### What WON'T Work:
- ❌ Music generation (PiAPI down)
- ❌ Track playback (no tracks)
- ❌ Export/share (no tracks)
- ❌ Actual purchases (need App Store config)

## 4. Quick Commands

### Check Firebase User
```bash
# In Firebase Console
# Authentication > Users
# Should see new user with email
```

### Monitor Logs
```bash
# In Xcode
# View > Debug Area > Show Debug Area
# Watch for Firebase/API errors
```

### Test Different Devices
```bash
# iPhone SE (small)
xcrun simctl list devices | grep "iPhone SE"

# iPad
xcrun simctl list devices | grep "iPad"
```

## 5. Bug Report Template

If you find issues:

**Issue**: [Brief description]
**Screen**: [Where it happened]
**Steps**: 
1. [First step]
2. [Second step]
**Expected**: [What should happen]
**Actual**: [What happened]
**Screenshot**: [If applicable]

---

Start with authentication test, then move through the list. The app should be fully functional except for actual music generation due to PiAPI maintenance.