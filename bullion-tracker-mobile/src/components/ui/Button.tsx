import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../../lib/colors';

interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  onPress,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const buttonStyles: ViewStyle = {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...getVariantStyles(variant),
    ...getSizeStyles(size),
    ...(disabled && { opacity: 0.5 }),
  };

  const textStyles: TextStyle = {
    fontWeight: '600',
    ...getTextVariantStyles(variant),
    ...getTextSizeStyles(size),
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[buttonStyles, style]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#FFFFFF' : Colors.accentTeal}
          size="small"
        />
      ) : (
        <Text style={[textStyles, textStyle]}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}

function getVariantStyles(variant: string): ViewStyle {
  switch (variant) {
    case 'primary':
      return {
        backgroundColor: Colors.accentTeal,
      };
    case 'secondary':
      return {
        backgroundColor: Colors.accentAmber,
      };
    case 'ghost':
      return {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.border,
      };
    case 'danger':
      return {
        backgroundColor: Colors.negative,
      };
    default:
      return {};
  }
}

function getTextVariantStyles(variant: string): TextStyle {
  switch (variant) {
    case 'primary':
    case 'secondary':
    case 'danger':
      return {
        color: '#FFFFFF',
      };
    case 'ghost':
      return {
        color: Colors.accentTeal,
      };
    default:
      return {};
  }
}

function getSizeStyles(size: string): ViewStyle {
  switch (size) {
    case 'sm':
      return {
        paddingHorizontal: 12,
        paddingVertical: 6,
      };
    case 'md':
      return {
        paddingHorizontal: 16,
        paddingVertical: 10,
      };
    case 'lg':
      return {
        paddingHorizontal: 24,
        paddingVertical: 14,
      };
    default:
      return {};
  }
}

function getTextSizeStyles(size: string): TextStyle {
  switch (size) {
    case 'sm':
      return {
        fontSize: 14,
      };
    case 'md':
      return {
        fontSize: 16,
      };
    case 'lg':
      return {
        fontSize: 18,
      };
    default:
      return {};
  }
}
