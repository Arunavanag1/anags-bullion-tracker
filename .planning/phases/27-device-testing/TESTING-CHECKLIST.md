# Mobile App Testing Checklist

## Test Environment Setup

- [ ] Expo Go installed on test device
- [ ] Development server running (`npm start` in bullion-tracker-mobile)
- [ ] Backend server running (localhost or deployed)
- [ ] Test account credentials ready

---

## 1. Authentication Flows

### 1.1 Login Screen
- [ ] Email field accepts input
- [ ] Password field masks input
- [ ] Login button disabled when fields empty
- [ ] Login button enabled when both fields have content
- [ ] Successful login navigates to Dashboard
- [ ] Invalid credentials show error message
- [ ] Error message is clear and helpful
- [ ] "Register" link navigates to registration screen

### 1.2 Registration Screen
- [ ] All required fields present (email, password, confirm password)
- [ ] Password validation enforced (8+ chars, uppercase, lowercase, number)
- [ ] Password mismatch shows error
- [ ] Successful registration navigates to Dashboard
- [ ] Duplicate email shows appropriate error
- [ ] Back button returns to Login

### 1.3 Logout
- [ ] Logout option accessible from app
- [ ] Logout clears session
- [ ] After logout, cannot access protected screens
- [ ] Returns to Login screen

### 1.4 Session Persistence
- [ ] Close app and reopen - stays logged in
- [ ] Token refresh works (if session expires)
- [ ] Force quit app and reopen - stays logged in

---

## 2. Dashboard Screen

### 2.1 Portfolio Summary
- [ ] Portfolio value displays correctly
- [ ] Value updates when collection changes
- [ ] Melt value shown in parentheses
- [ ] Loading state visible while fetching

### 2.2 Spot Prices
- [ ] Gold, Silver, Platinum prices displayed
- [ ] Price pills show current spot prices
- [ ] Prices update/refresh appropriately

### 2.3 Allocation Chart
- [ ] Donut chart renders correctly
- [ ] Shows breakdown by metal type
- [ ] Percentages are accurate
- [ ] Legend is readable

### 2.4 Top Performers
- [ ] Shows items with highest gain/loss
- [ ] Values are correct
- [ ] Tap navigates to item detail (if implemented)

### 2.5 Portfolio Chart
- [ ] Historical chart renders
- [ ] Chart is interactive (if applicable)
- [ ] Time range selection works (if applicable)

---

## 3. Collection Screen

### 3.1 Collection List
- [ ] All items display in list
- [ ] Item cards show: image, title, metal type, value
- [ ] Pull-to-refresh works
- [ ] Loading state shows when fetching

### 3.2 Item Cards
- [ ] Images load correctly
- [ ] Metal badge displays correct color (gold/silver/platinum)
- [ ] Title truncates properly if too long
- [ ] Weight displays correctly
- [ ] Value displays correctly

### 3.3 Search/Filter (if implemented)
- [ ] Search by title works
- [ ] Filter by metal type works
- [ ] Results update immediately

### 3.4 Navigation
- [ ] Tap item navigates to detail view
- [ ] Back navigation works correctly

---

## 4. Add Item Screen

### 4.1 Category Selection
- [ ] Category step shows Bullion vs Numismatic options
- [ ] Selection highlights correctly
- [ ] Can proceed to next step

### 4.2 Bullion Form
- [ ] Metal type selector works (Gold/Silver/Platinum)
- [ ] Weight input accepts decimal values
- [ ] Unit selector works (oz, g, kg)
- [ ] Quantity input works
- [ ] Premium percentage input works
- [ ] Purchase price input works
- [ ] All validations enforce correctly

### 4.3 Numismatic Form
- [ ] Coin search input works
- [ ] Search results display
- [ ] Grade picker shows all grade options
- [ ] Grading service selector (PCGS/NGC/Raw)
- [ ] Certification number input (if graded)
- [ ] Problem coin badge selector
- [ ] Custom value input works

### 4.4 Grading Step
- [ ] Grade scale shows correctly
- [ ] Grade selection updates display
- [ ] Grading service affects available grades

### 4.5 Photo Capture
- [ ] Camera permission requested
- [ ] Camera opens successfully
- [ ] Can take photo
- [ ] Photo preview displays
- [ ] Can retake photo
- [ ] Photo uploads correctly

### 4.6 Form Submission
- [ ] Submit button disabled until form valid
- [ ] Successful submission shows confirmation
- [ ] Item appears in collection after adding
- [ ] Errors display clearly

---

## 5. Gallery (Collage) Screen

### 5.1 Circular Carousel
- [ ] Items arranged in circular layout
- [ ] All items visible
- [ ] Items at front appear larger (3D effect)
- [ ] Items at back appear smaller/faded

### 5.2 Scroll Interaction
- [ ] Scroll rotates the carousel
- [ ] Rotation is smooth
- [ ] Scroll hint visible at bottom
- [ ] Scroll direction feels natural

### 5.3 Item Tap
- [ ] Tapping item opens lightbox
- [ ] Correct item opens

### 5.4 Empty State
- [ ] Shows appropriate message when no items
- [ ] Suggests adding items

---

## 6. Image Lightbox

### 6.1 Display
- [ ] Image displays large and centered
- [ ] Dark overlay background
- [ ] Close button (X) visible and tappable

### 6.2 Navigation (Multi-image items)
- [ ] Left/right arrows appear for multi-image items
- [ ] Swipe left/right navigates between images
- [ ] Image indicators show current position
- [ ] Tap indicators jump to that image

### 6.3 Swipe Gestures
- [ ] Swipe down dismisses lightbox
- [ ] Animation is smooth on dismiss
- [ ] Horizontal swipe navigates images

### 6.4 Details Panel
- [ ] Metal badge shows correct metal
- [ ] Title displays correctly
- [ ] Grade displays (if applicable)
- [ ] Weight displays with units
- [ ] Quantity displays (if > 1)
- [ ] Melt value displays correctly
- [ ] Numismatic value displays (if applicable)

### 6.5 Accessibility
- [ ] Close button has accessibility label
- [ ] Images have alt text
- [ ] Navigation buttons are accessible

---

## 7. Edit/Delete Item

### 7.1 Edit Flow
- [ ] Edit option accessible from item detail
- [ ] Form pre-populated with current values
- [ ] Changes can be saved
- [ ] Changes reflect in collection

### 7.2 Delete Flow
- [ ] Delete option accessible
- [ ] Confirmation prompt appears
- [ ] Cancel returns without deleting
- [ ] Confirm removes item
- [ ] Item no longer in collection

---

## 8. Data Sync

### 8.1 Add Sync
- [ ] Item added on mobile appears on web
- [ ] Images sync correctly

### 8.2 Edit Sync
- [ ] Item edited on mobile updates on web
- [ ] Changes sync within reasonable time

### 8.3 Delete Sync
- [ ] Item deleted on mobile removed from web

### 8.4 Refresh
- [ ] Pull-to-refresh fetches latest data
- [ ] Changes made on web appear on mobile after refresh

---

## 9. Performance

### 9.1 Load Times
- [ ] App starts in < 5 seconds
- [ ] Dashboard loads in < 3 seconds
- [ ] Collection list loads in < 3 seconds
- [ ] Images load progressively

### 9.2 Animations
- [ ] Carousel rotation is smooth (60fps)
- [ ] Lightbox gestures are responsive
- [ ] No jank or stuttering

### 9.3 Memory
- [ ] App doesn't crash with many items
- [ ] Scrolling through large collection is smooth

---

## 10. Error Handling

### 10.1 Network Errors
- [ ] Offline indicator shows when no network
- [ ] Error message when API fails
- [ ] Retry option available

### 10.2 Input Validation
- [ ] Invalid email format shows error
- [ ] Invalid password shows requirements
- [ ] Invalid numbers rejected
- [ ] Required fields enforced

### 10.3 Edge Cases
- [ ] Empty collection handled gracefully
- [ ] Very long item titles handled
- [ ] Items with no images handled
- [ ] Items with many images handled

---

## 11. Platform-Specific Checks

### 11.1 iOS Specific
- [ ] Safe area respected (notch, home indicator)
- [ ] Keyboard dismisses on tap outside
- [ ] Back gestures work
- [ ] Status bar style appropriate

### 11.2 Android Specific
- [ ] Back button behavior correct
- [ ] Status bar color appropriate
- [ ] Navigation bar handled
- [ ] Keyboard handling correct

---

## Test Summary

| Section | Passed | Failed | Blocked |
|---------|--------|--------|---------|
| Authentication | | | |
| Dashboard | | | |
| Collection | | | |
| Add Item | | | |
| Gallery | | | |
| Lightbox | | | |
| Edit/Delete | | | |
| Data Sync | | | |
| Performance | | | |
| Error Handling | | | |
| Platform-Specific | | | |

**Overall Status:** _________________

**Tester:** _________________

**Date:** _________________

**Device:** _________________

**OS Version:** _________________
