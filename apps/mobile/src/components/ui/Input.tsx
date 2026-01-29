import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  type TextInputProps,
} from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  isPassword = false,
  className,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const hasError = !!error;
  const borderColor = hasError
    ? 'border-danger-500'
    : isFocused
    ? 'border-primary-500'
    : 'border-gray-300';

  return (
    <View className={`mb-4 ${className || ''}`}>
      {label && (
        <Text className="text-sm font-medium text-gray-700 mb-1.5">{label}</Text>
      )}
      <View
        className={`
          flex-row items-center
          border-2 rounded-xl
          bg-white
          ${borderColor}
          px-4 py-3
        `}
      >
        {leftIcon && <View className="mr-3">{leftIcon}</View>}
        <TextInput
          className="flex-1 text-base text-gray-900"
          placeholderTextColor="#9ca3af"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            className="ml-2 p-1"
          >
            <Text className="text-primary-500 text-sm font-medium">
              {showPassword ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        )}
        {rightIcon && !isPassword && <View className="ml-3">{rightIcon}</View>}
      </View>
      {(error || helperText) && (
        <Text
          className={`text-sm mt-1.5 ${
            hasError ? 'text-danger-500' : 'text-gray-500'
          }`}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
}
