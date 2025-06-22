# TODO – MusicGen App (Post-PiAPI Refactor)

_Last updated: 2025-06-16_

---

## 1. UI & Track Display

- [x] **Thumbnails for Multiple Outputs**
    - Show all generated tracks (multiple per generation) as thumbnails or cards in a row/grid.
    - Each thumbnail/card should include:
        - Track image
        - Track title
        - Play/pause button
        - Duration (if available)
        - "Extend" button

- [x] **Processing State**
    - Show a loading/processing indicator for tracks that are not yet fully generated/downloaded.

---

## 2. Player UX

- [x] **Player Docking**
    - Ensure the global audio player is always docked at the bottom and never overlaps or covers menu tabs/navigation.

---

## 3. Extend Feature

- [x] **Extend on Demand**
    - "Extend" should only appear as a button per track and must NOT trigger automatically.
    - When clicked, output from "Extend" should display next to the original track in the same grid.

---

## 4. API Integration

- [x] **Unified PiAPI Calls**
    - Confirm all backend/API calls for:
        - Generation
        - Polling for results
        - Extending tracks
    - ...are routed exclusively through the PiAPI endpoint, regardless of underlying model.

---

## 5. UI Consistency

- [x] **No Model/Debug Info in UI**
    - Hide all model names, API response details, or technical info from the user.
    - Only show: track visuals, title, play/pause, extend, duration.

---

## 6. Error Handling & Sync

- [x] **Cloud Sync Handling**
    - If Firestore/AppCheck fails, show "cloud sync offline" message.
    - Ensure app still supports local library management, track storage, and playback.
    - Handle play count and save-to-library functions gracefully during sync failures.

---

## 7. General QA

- [x] **All outputs always visible.**
- [x] No function or button triggers anything automatically (extend/remix/manual only).
- [x] Global music player is accessible and not interfering with main UI at any time.

---

> _Priority: High — Required for next build/release._