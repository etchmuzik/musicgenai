# MusicGen AI - Full App Testing Checklist

## Pre-Test Setup
- [ ] Build successfully compiles
- [ ] Test on multiple iOS versions (16.6+)
- [ ] Test on different device sizes (iPhone SE, iPhone 15, iPad)
- [ ] Clean install (delete app and reinstall)
- [ ] Test with and without internet connection

---

## 1. Authentication & Onboarding

### First Launch
- [ ] Welcome screen displays correctly
- [ ] All onboarding text is readable
- [ ] Navigation between onboarding screens works
- [ ] Skip button functions properly

### Sign Up Flow
- [ ] Email validation works (invalid emails rejected)
- [ ] Password requirements enforced (min 6 characters)
- [ ] Display name can be set
- [ ] Error messages display for existing accounts
- [ ] Success redirects to main app

### Sign In Flow
- [ ] Valid credentials log in successfully
- [ ] Invalid credentials show error message
- [ ] Forgot password functionality (if implemented)
- [ ] Remember me / auto-login works
- [ ] Sign out functionality works

### Firebase Integration
- [ ] User profile created in Firestore
- [ ] Free plan (5 credits) assigned to new users
- [ ] Profile data syncs correctly

---

## 2. Subscription & Payments

### Subscription Display
- [ ] Current plan shows correctly in header
- [ ] Remaining generations count is accurate
- [ ] Daily usage progress bar updates
- [ ] Plan benefits display correctly

### Subscription View
- [ ] All three tiers display with correct pricing
- [ ] Free plan shows as current for new users
- [ ] Product prices load from App Store
- [ ] "Most Popular" badge on Pro plan
- [ ] Benefits comparison table accurate

### Purchase Flow
- [ ] Purchase button triggers App Store payment sheet
- [ ] Successful purchase updates user plan
- [ ] Failed purchase shows appropriate error
- [ ] Restore purchases functionality works
- [ ] Subscription syncs with Firebase

### Limits & Restrictions
- [ ] Free users limited to 5 total generations
- [ ] Daily limits enforced (2/10/25/100)
- [ ] Upgrade prompt shows when limits hit
- [ ] Generate button disabled at limits

---

## 3. Music Generation

### Generation Interface
- [ ] Genre selection works (all 10 genres)
- [ ] Mood selection works (all 9 moods)
- [ ] Custom prompt text input works
- [ ] Prompt character limit (if any)
- [ ] Duration selection changes correctly
- [ ] Extended mode toggle functions

### Lyrics Feature
- [ ] Instrumental toggle works
- [ ] Lyrics editor appears when not instrumental
- [ ] Lyrics templates load correctly
- [ ] Helper buttons (Verse, Chorus, etc.) work
- [ ] Character count displays

### Style Reference (Extended Mode)
- [ ] Upload button only shows in extended mode
- [ ] File picker opens correctly
- [ ] Audio file uploads work
- [ ] Supported formats accepted (MP3, WAV, M4A)
- [ ] Unsupported formats rejected with error
- [ ] Remove button clears selection

### Generation Process
- [ ] Points deducted when generation starts
- [ ] Progress bar shows realistic progress
- [ ] Step descriptions update during generation
- [ ] Time estimates are reasonable
- [ ] Cancel functionality (if implemented)
- [ ] Error handling for failed generations

### Generation Results
- [ ] Preview tracks display correctly
- [ ] Track thumbnails show
- [ ] Play buttons work
- [ ] Track selection checkboxes function
- [ ] Extend button appears (standard mode only)
- [ ] Share functionality works
- [ ] Save to library works

---

## 4. Library & Track Management

### Library View
- [ ] All saved tracks display
- [ ] Track sorting works (date, name, etc.)
- [ ] Search/filter functionality
- [ ] Track details show correctly
- [ ] Play functionality from library
- [ ] Delete tracks works
- [ ] Batch selection (if implemented)

### Track Player
- [ ] Global player docks correctly
- [ ] Play/pause controls work
- [ ] Progress bar updates
- [ ] Volume controls function
- [ ] Skip forward/back works
- [ ] Minimized player shows current track
- [ ] Player persists across screens

### Track Actions
- [ ] Download/export tracks
- [ ] Share to social media
- [ ] Copy share link
- [ ] Add to favorites
- [ ] Track metadata displays

---

## 5. Explore & Community

### Explore Feed
- [ ] Published tracks load
- [ ] Infinite scroll works
- [ ] Track previews play
- [ ] Like functionality works
- [ ] Play counts update
- [ ] User attribution shows

### Publishing
- [ ] Publish button works from library
- [ ] Published tracks appear in explore
- [ ] Unpublish functionality
- [ ] Published track privacy settings

---

## 6. Profile & Settings

### Profile View
- [ ] User info displays correctly
- [ ] Stats accurate (total generations, plays)
- [ ] Edit profile functionality
- [ ] Profile image upload
- [ ] Subscription info shows

### Settings
- [ ] Dark/light mode toggle
- [ ] Notification preferences save
- [ ] High quality export toggle
- [ ] Auto-save preference
- [ ] About/version info displays
- [ ] Privacy policy link works
- [ ] Terms of service link works

### Account Management
- [ ] Change password (if implemented)
- [ ] Delete account option
- [ ] Export user data
- [ ] Sign out confirmation

---

## 7. Error Handling & Edge Cases

### Network Errors
- [ ] No internet connection message
- [ ] API timeout handling
- [ ] Retry mechanisms work
- [ ] Offline mode (if applicable)

### Generation Errors
- [ ] PiAPI maintenance message shows
- [ ] Failed generation handling
- [ ] Insufficient credits error
- [ ] Daily limit reached error

### Payment Errors
- [ ] Purchase cancelled handling
- [ ] Payment failed messages
- [ ] Restore purchases errors
- [ ] Subscription expired handling

### Data Validation
- [ ] Empty state messages
- [ ] Invalid input handling
- [ ] File size limits enforced
- [ ] Character limits work

---

## 8. Performance Testing

### Load Times
- [ ] App launch < 3 seconds
- [ ] Screen transitions smooth
- [ ] Image loading optimized
- [ ] Audio loading efficient

### Memory Usage
- [ ] No memory leaks
- [ ] Background audio handling
- [ ] Large file handling
- [ ] Multiple tracks in memory

### Battery Usage
- [ ] Reasonable battery drain
- [ ] Background activity minimal
- [ ] Audio playback efficient

---

## 9. Accessibility

### VoiceOver Support
- [ ] All buttons have labels
- [ ] Navigation is logical
- [ ] Important info announced
- [ ] Form inputs accessible

### Visual Accessibility
- [ ] Text contrast sufficient
- [ ] Dynamic type support
- [ ] Color blind friendly
- [ ] Animations respect reduce motion

---

## 10. Cross-Device Testing

### iPhone Testing
- [ ] iPhone SE (small screen)
- [ ] iPhone 15 (standard)
- [ ] iPhone 15 Pro Max (large)
- [ ] Landscape orientation

### iPad Testing
- [ ] iPad layout optimized
- [ ] Split view support
- [ ] Keyboard shortcuts
- [ ] Apple Pencil (if applicable)

---

## 11. Final Checks

### App Store Requirements
- [ ] App icon displays correctly
- [ ] Launch screen works
- [ ] No placeholder text
- [ ] No debug/test content
- [ ] Screenshots ready
- [ ] App description accurate

### Legal & Compliance
- [ ] Privacy policy accessible
- [ ] Terms of service accessible
- [ ] GDPR compliance (if needed)
- [ ] Age rating appropriate
- [ ] Content moderation

### Analytics & Monitoring
- [ ] Analytics events firing
- [ ] Crash reporting active
- [ ] Performance monitoring
- [ ] User feedback mechanism

---

## Test Results Summary

| Area | Pass | Fail | Notes |
|------|------|------|-------|
| Authentication | | | |
| Subscriptions | | | |
| Generation | | | |
| Library | | | |
| Performance | | | |
| Accessibility | | | |

**Overall Status**: [ ] Ready for Release / [ ] Needs Fixes

**Critical Issues**:
1. 
2. 
3. 

**Minor Issues**:
1. 
2. 
3. 

**Tested By**: ________________
**Date**: ________________
**Version**: ________________