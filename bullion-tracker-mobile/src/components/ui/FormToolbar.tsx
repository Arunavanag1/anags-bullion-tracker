import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  InputAccessoryView,
  Keyboard,
  Platform,
  StyleSheet,
} from 'react-native';

interface FormToolbarProps {
  inputAccessoryViewID: string;
  onPrevious: () => void;
  onNext: () => void;
  onDone: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

export function FormToolbar({
  inputAccessoryViewID,
  onPrevious,
  onNext,
  onDone,
  hasPrevious,
  hasNext,
}: FormToolbarProps) {
  // InputAccessoryView is iOS-only; Android uses returnKeyType for native navigation
  if (Platform.OS !== 'ios') {
    return null;
  }

  return (
    <InputAccessoryView nativeID={inputAccessoryViewID}>
      <View style={styles.toolbar}>
        <View style={styles.navButtons}>
          <TouchableOpacity
            onPress={onPrevious}
            disabled={!hasPrevious}
            style={styles.button}
          >
            <Text
              style={[
                styles.buttonText,
                !hasPrevious && styles.buttonTextDisabled,
              ]}
            >
              Previous
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onNext}
            disabled={!hasNext}
            style={styles.button}
          >
            <Text
              style={[
                styles.buttonText,
                !hasNext && styles.buttonTextDisabled,
              ]}
            >
              Next
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onDone} style={styles.button}>
          <Text style={[styles.buttonText, styles.doneText]}>Done</Text>
        </TouchableOpacity>
      </View>
    </InputAccessoryView>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
    height: 44,
    paddingHorizontal: 12,
  },
  navButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  buttonText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  buttonTextDisabled: {
    color: '#9CA3AF',
  },
  doneText: {
    fontWeight: '600',
  },
});
