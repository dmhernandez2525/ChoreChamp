import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Input } from '../../components/ui';
import { useAuthStore } from '../../stores/auth-store';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { signIn, isLoading, error, clearError } = useAuthStore();

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    clearError();

    if (!validate()) return;

    try {
      await signIn({ email: email.trim().toLowerCase(), password });
    } catch {
      Alert.alert('Sign In Failed', error || 'Please check your credentials and try again.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6 py-8"
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo/Header */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-primary-500 rounded-2xl items-center justify-center mb-4">
              <Text className="text-4xl">🏆</Text>
            </View>
            <Text className="text-3xl font-bold text-gray-900">Welcome Back!</Text>
            <Text className="text-gray-500 mt-2 text-center">
              Sign in to continue to ChoreChamp
            </Text>
          </View>

          {/* Error Banner */}
          {error && (
            <View className="bg-danger-50 border border-danger-200 rounded-xl p-4 mb-6">
              <Text className="text-danger-700 text-center">{error}</Text>
            </View>
          )}

          {/* Form */}
          <View className="mb-6">
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              error={errors.password}
              isPassword
              autoCapitalize="none"
              autoComplete="password"
              textContentType="password"
            />
          </View>

          {/* Login Button */}
          <Button
            title="Sign In"
            onPress={handleLogin}
            isLoading={isLoading}
            size="lg"
            className="mb-4"
          />

          {/* Sign Up Link */}
          <View className="flex-row justify-center items-center">
            <Text className="text-gray-500">{"Don't have an account? "}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text className="text-primary-500 font-semibold">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
