---
phase: 63-keyboard-management
plan: 01
type: summary
---

## What Was Built

Keyboard management for both BullionForm and NumismaticForm in the mobile add item flow:

1. **KeyboardAvoidingView** wraps form content with platform-appropriate behavior (`padding` on iOS, `height` on Android) and vertical offset to account for headers
2. **Tap-to-dismiss** via `TouchableWithoutFeedback` + `Keyboard.dismiss` on the outer container
3. **Interactive scroll dismiss** via `keyboardDismissMode="interactive"` on both form ScrollViews
4. **`keyboardShouldPersistTaps="handled"`** on both ScrollViews so buttons/selectors work while keyboard is open
5. **Increased paddingBottom** from 40 to 120 for extra scroll room when keyboard is visible
6. **Input ref forwarding** — Input component converted to `React.forwardRef` with `inputAccessoryViewID` support
7. **FormToolbar component** — iOS `InputAccessoryView` with Previous/Next/Done buttons (renders nothing on Android)
8. **BullionForm field refs** — 7-field ref chain with sequential navigation via toolbar and `onSubmitEditing`
9. **NumismaticForm field refs** — Dynamic ref chain (5 fields for RAW, 4 for graded) skipping complex components

## Files Changed

- `src/screens/AddItemScreen.tsx` — KeyboardAvoidingView + TouchableWithoutFeedback wrapper
- `src/components/ui/Input.tsx` — React.forwardRef + inputAccessoryViewID prop
- `src/components/ui/FormToolbar.tsx` — **NEW** — InputAccessoryView toolbar (iOS only)
- `src/components/addItem/BullionForm.tsx` — ScrollView props, field refs, toolbar integration
- `src/components/addItem/NumismaticForm.tsx` — ScrollView props, field refs, toolbar integration

## Commits

- `2fbc570` — Task 1: KeyboardAvoidingView and tap-to-dismiss
- `8e76ae1` — Task 2: Keyboard toolbar with Done/Next buttons

## Decisions

- Used standard React Native `KeyboardAvoidingView` instead of third-party library (no new dependencies)
- `InputAccessoryView` is iOS-only; Android relies on native `returnKeyType="next"` keyboard behavior
- Complex components (CoinSearchInput, GradePicker, PriceGuideDisplay) excluded from ref chain per plan
- Simple `React.forwardRef` used instead of `useImperativeHandle`

## Verification Status

- [x] TypeScript compiles without errors
- [x] No new dependencies added
- [ ] Human verification deferred to Phase 65 (Form UX Verification)
