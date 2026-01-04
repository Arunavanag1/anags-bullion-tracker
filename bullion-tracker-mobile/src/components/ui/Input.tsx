import React from 'react';
import { View, Text, TextInput, TextInputProps, ViewStyle } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, containerStyle, ...props }: InputProps) {
  return (
    <View style={containerStyle}>
      {label && (
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: '#2D1B1B',
            marginBottom: 6,
          }}
        >
          {label}
        </Text>
      )}
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: error ? '#DC2626' : '#F5E6DC',
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 16,
          color: '#2D1B1B',
          backgroundColor: '#FFFFFF',
        }}
        placeholderTextColor="#A89186"
        {...props}
      />
      {error && (
        <Text
          style={{
            fontSize: 12,
            color: '#DC2626',
            marginTop: 4,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
