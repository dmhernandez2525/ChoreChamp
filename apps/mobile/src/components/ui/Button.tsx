import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  type TouchableOpacityProps,
} from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
}

const variantStyles = {
  primary: {
    container: 'bg-primary-500 active:bg-primary-600',
    text: 'text-white',
  },
  secondary: {
    container: 'bg-secondary-500 active:bg-secondary-600',
    text: 'text-white',
  },
  outline: {
    container: 'border-2 border-primary-500 bg-transparent active:bg-primary-50',
    text: 'text-primary-500',
  },
  ghost: {
    container: 'bg-transparent active:bg-gray-100',
    text: 'text-primary-500',
  },
  danger: {
    container: 'bg-danger-500 active:bg-danger-600',
    text: 'text-white',
  },
};

const sizeStyles = {
  sm: {
    container: 'px-3 py-2 rounded-lg',
    text: 'text-sm',
  },
  md: {
    container: 'px-4 py-3 rounded-xl',
    text: 'text-base',
  },
  lg: {
    container: 'px-6 py-4 rounded-xl',
    text: 'text-lg',
  },
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <TouchableOpacity
      className={`
        flex-row items-center justify-center
        ${sizeStyle.container}
        ${variantStyle.container}
        ${isDisabled ? 'opacity-50' : ''}
        ${className || ''}
      `}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? '#6366f1' : '#ffffff'}
        />
      ) : (
        <Text
          className={`
            font-semibold
            ${sizeStyle.text}
            ${variantStyle.text}
          `}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
