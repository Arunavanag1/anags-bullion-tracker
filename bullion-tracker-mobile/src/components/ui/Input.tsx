import React from 'react';
import { View, Text, TextInput, TextInputProps, ViewStyle, StyleSheet } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputAccessoryViewID?: string;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  ({ label, error, containerStyle, inputAccessoryViewID, ...props }, ref) => {
    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text style={styles.label}>
            {label}
          </Text>
        )}
        <TextInput
          ref={ref}
          inputAccessoryViewID={inputAccessoryViewID}
          style={[
            styles.input,
            error ? styles.inputError : undefined,
          ]}
          placeholderTextColor="#A89186"
          {...props}
        />
        {error && (
          <Text style={styles.errorText}>
            {error}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D1B1B',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#F5E6DC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#2D1B1B',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#DC2626',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
  },
});
