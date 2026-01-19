# Phase 51: Mobile Cert Scanner - Discovery

## Research Summary

Phase goal: Add camera-based barcode/QR scanning for cert number extraction on mobile.

### Key Findings

#### 1. expo-camera Barcode Scanning

**Current State:**
- Project uses `expo-image-picker` for photos but does NOT have `expo-camera` installed
- Expo SDK 54 is current

**expo-camera CameraView:**
- Built-in barcode scanning via `onBarcodeScanned` callback
- Returns `{ type, data }` where type is barcode format and data is decoded content
- Supports `barcodeScannerSettings` prop to filter barcode types

**Supported Barcode Types:**
- `aztec`, `ean13`, `ean8`, `qr`, `pdf417`, `upc_e`, `datamatrix`
- `code39`, `code93`, `itf14`, `codabar`, `code128`, `upc_a`

**Note:** PCGS uses Interleaved 2 of 5 (ITF) format. expo-camera supports `itf14` which is a variant of ITF.

#### 2. PCGS Barcode Format

**Structure:** 22-digit Interleaved 2 of 5 barcode

Format breakdown for `0101234560065098765432`:
- Digits 1-2: `01` prefix
- Digits 3-8: Coin/spec PCGS number (6 digits, zero-padded)
- Digits 9-12: Grade (4 digits, zero-padded with leading zeros)
- Digits 13-22: Cert number (8 digits, zero-padded)

**Example:** Barcode `0000037570053028633460`
- PCGS Number: 003757
- Grade: 0053 (AU-53)
- Cert Number: 28633460

**Extraction Logic:**
```typescript
function parsePcgsBarcode(barcode: string): { pcgsNumber: string; grade: number; certNumber: string } | null {
  if (barcode.length !== 22) return null;
  return {
    pcgsNumber: barcode.substring(2, 8).replace(/^0+/, ''), // Remove leading zeros
    grade: parseInt(barcode.substring(8, 12), 10),
    certNumber: barcode.substring(14, 22).replace(/^0+/, ''), // 8-digit cert
  };
}
```

#### 3. NGC Format

- NGC uses QR codes on the back of holders
- QR codes link directly to NGC verification page
- expo-camera supports `qr` barcode type
- QR data is URL: `https://www.ngccoin.com/certlookup/{cert-number}/`

**Extraction Logic:**
```typescript
function parseNgcQrCode(data: string): string | null {
  const match = data.match(/ngccoin\.com\/certlookup\/(\d+)/);
  return match ? match[1] : null;
}
```

### Technical Approach

1. **Install expo-camera** (`npx expo install expo-camera`)
2. **Create CertScanner component** with CameraView
3. **Configure barcode types**: `['itf14', 'qr']` to catch both PCGS and NGC
4. **Parse scanned data** to extract cert number
5. **Auto-detect service** based on barcode type (ITF = PCGS, QR = NGC)
6. **Integrate with NumismaticForm** - add "Scan Cert" button that opens scanner modal
7. **Auto-populate** cert number field and trigger lookup

### Platform Considerations

- **iOS**: Camera permission required (`NSCameraUsageDescription` in Info.plist)
- **Android**: Camera permission auto-handled by Expo
- expo-camera on Android uses Google code scanner
- expo-camera on iOS uses DataScannerViewController (iOS 16+)

### Dependencies to Add

```json
{
  "expo-camera": "~16.1.6"
}
```

### UI Flow

1. User taps "Scan Cert" button in NumismaticForm (graded coin section)
2. Full-screen camera modal opens with viewfinder overlay
3. User points camera at PCGS barcode or NGC QR code
4. On successful scan:
   - Extract cert number
   - Auto-detect grading service (PCGS vs NGC)
   - Close scanner
   - Populate cert number field
   - Trigger existing cert lookup flow (PCGS auto-fills, NGC shows manual link)

### Risk Assessment

**Low Risk:**
- expo-camera is well-maintained Expo library
- Barcode scanning is built-in, no additional dependencies
- Integration with existing NumismaticForm is straightforward

**Medium Risk:**
- ITF-14 vs generic ITF compatibility (may need testing)
- Camera overlay styling for good UX

**No OCR Needed:**
- Barcodes contain all needed data
- OCR was considered but unnecessary given barcode support

Sources:
- [Expo Camera Documentation](https://docs.expo.dev/versions/latest/sdk/camera/)
- [PCGS Barcode Layout](https://www.pcgs.com/barcode)
- [expo-camera barcode migration guide](https://github.com/expo/fyi/blob/main/barcode-scanner-to-expo-camera.md)
