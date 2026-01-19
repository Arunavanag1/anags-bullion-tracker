import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { CameraView, Camera, BarcodeScanningResult } from 'expo-camera';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const VIEWFINDER_SIZE = SCREEN_WIDTH * 0.7;

interface CertScannerProps {
  visible: boolean;
  onClose: () => void;
  onScan: (certNumber: string, service: 'pcgs' | 'ngc') => void;
}

/**
 * Parses PCGS 22-digit ITF barcode to extract cert number
 * Format: 01 + PCGS# (6) + Grade (4) + CertNumber (10, last 8 significant)
 * Example: 0000037570053028633460 -> cert number 28633460
 */
function parsePcgsBarcode(data: string): string | null {
  // Remove any non-numeric characters
  const cleaned = data.replace(/\D/g, '');

  // PCGS barcodes are 22 digits
  if (cleaned.length !== 22) {
    return null;
  }

  // Cert number is in positions 14-22 (0-indexed: 14-21, inclusive)
  // But the actual cert number is 8 digits, positions 14-21
  const certNumber = cleaned.substring(14, 22).replace(/^0+/, '');

  return certNumber || null;
}

/**
 * Parses NGC QR code URL to extract cert number
 * Format: https://www.ngccoin.com/certlookup/{cert-number}/
 */
function parseNgcQrCode(data: string): string | null {
  // Match NGC cert lookup URL pattern
  const match = data.match(/ngccoin\.com\/certlookup\/(\d+)/i);
  return match ? match[1] : null;
}

export function CertScanner({ visible, onClose, onScan }: CertScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (visible) {
      (async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
      })();
      // Reset scanned state when modal opens
      setScanned(false);
    }
  }, [visible]);

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (scanned) return;

    const { type, data } = result;

    // Try to parse based on barcode type
    let certNumber: string | null = null;
    let service: 'pcgs' | 'ngc' = 'pcgs';

    if (type === 'qr') {
      // NGC uses QR codes
      certNumber = parseNgcQrCode(data);
      if (certNumber) {
        service = 'ngc';
      }
    } else if (type === 'itf14' || type === 'codabar' || type === 'code128') {
      // PCGS uses ITF (Interleaved 2 of 5) barcodes
      // Also check other common 1D formats that might be used
      certNumber = parsePcgsBarcode(data);
      if (certNumber) {
        service = 'pcgs';
      }
    }

    // If we couldn't parse with specific logic, try both
    if (!certNumber) {
      // Try PCGS format first (numeric only)
      certNumber = parsePcgsBarcode(data);
      if (certNumber) {
        service = 'pcgs';
      } else {
        // Try NGC format
        certNumber = parseNgcQrCode(data);
        if (certNumber) {
          service = 'ngc';
        }
      }
    }

    // If still no match, check if it's a raw cert number (7-8 digits)
    if (!certNumber) {
      const cleaned = data.replace(/\D/g, '');
      if (cleaned.length >= 7 && cleaned.length <= 10) {
        certNumber = cleaned;
        // Default to PCGS for numeric-only barcodes
        service = 'pcgs';
      }
    }

    if (certNumber) {
      setScanned(true);
      onScan(certNumber, service);
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {hasPermission === null ? (
          <View style={styles.centered}>
            <Text style={styles.text}>Requesting camera permission...</Text>
          </View>
        ) : hasPermission === false ? (
          <View style={styles.centered}>
            <Text style={styles.text}>Camera permission denied</Text>
            <Text style={styles.subText}>
              Please enable camera access in your device settings
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cameraContainer}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ['itf14', 'qr', 'code128', 'codabar', 'code39'],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            />

            {/* Overlay with viewfinder */}
            <View style={styles.overlay}>
              {/* Top dark area */}
              <View style={styles.overlayTop} />

              {/* Middle row with viewfinder */}
              <View style={styles.overlayMiddle}>
                <View style={styles.overlaySide} />
                <View style={styles.viewfinder}>
                  {/* Corner brackets */}
                  <View style={[styles.corner, styles.cornerTopLeft]} />
                  <View style={[styles.corner, styles.cornerTopRight]} />
                  <View style={[styles.corner, styles.cornerBottomLeft]} />
                  <View style={[styles.corner, styles.cornerBottomRight]} />
                </View>
                <View style={styles.overlaySide} />
              </View>

              {/* Bottom dark area */}
              <View style={styles.overlayBottom}>
                <Text style={styles.instructionText}>
                  Point camera at PCGS barcode or NGC QR code
                </Text>
              </View>
            </View>

            {/* Close button */}
            <TouchableOpacity style={styles.closeButtonOverlay} onPress={onClose}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>

            {/* Service indicators */}
            <View style={styles.serviceIndicators}>
              <View style={styles.serviceTag}>
                <Text style={styles.serviceTagText}>PCGS Barcode</Text>
              </View>
              <View style={styles.serviceTag}>
                <Text style={styles.serviceTagText}>NGC QR Code</Text>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  subText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  cameraContainer: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: VIEWFINDER_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  viewfinder: {
    width: VIEWFINDER_SIZE,
    height: VIEWFINDER_SIZE,
    backgroundColor: 'transparent',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 30,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#3B82F6',
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  closeButtonOverlay: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '300',
  },
  closeButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  serviceIndicators: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  serviceTag: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  serviceTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});
