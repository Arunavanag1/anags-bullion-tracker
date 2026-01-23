import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../App';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signUp(name, email, password);
      // Navigation will happen automatically via auth state change
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message || 'Could not create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#FFFBF8' }}
      contentContainerStyle={{ padding: 24, paddingTop: 60 }}
    >
      {/* Header */}
      <View style={{ marginBottom: 40, alignItems: 'center' }}>
        <Text style={{ fontSize: 32, fontWeight: '700', color: '#2D1B1B', marginBottom: 8 }}>
          Create Account
        </Text>
        <Text style={{ fontSize: 16, color: '#8B6B61', textAlign: 'center' }}>
          Start tracking your precious metals collection
        </Text>
      </View>

      {/* Form */}
      <View style={{ gap: 20 }}>
        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#2D1B1B', marginBottom: 8 }}>
            Name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            autoCapitalize="words"
            autoComplete="off"
            style={{
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#F5E6DC',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 16,
              color: '#2D1B1B',
            }}
          />
        </View>

        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#2D1B1B', marginBottom: 8 }}>
            Email
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            style={{
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#F5E6DC',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 16,
              color: '#2D1B1B',
            }}
          />
        </View>

        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#2D1B1B', marginBottom: 8 }}>
            Password
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password-new"
            textContentType="newPassword"
            style={{
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#F5E6DC',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 16,
              color: '#2D1B1B',
            }}
          />
        </View>

        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#2D1B1B', marginBottom: 8 }}>
            Confirm Password
          </Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password-new"
            textContentType="newPassword"
            style={{
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#F5E6DC',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 16,
              color: '#2D1B1B',
            }}
          />
        </View>

        <View style={{ marginTop: 8 }}>
          <Button onPress={handleSignUp} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : 'Create Account'}
          </Button>
        </View>
      </View>

      {/* Sign In Link */}
      <View style={{ marginTop: 32, alignItems: 'center' }}>
        <Text style={{ fontSize: 14, color: '#8B6B61' }}>
          Already have an account?{' '}
          <Text
            onPress={() => navigation.navigate('Login')}
            style={{ color: '#E76F51', fontWeight: '600' }}
          >
            Sign In
          </Text>
        </Text>
      </View>
    </ScrollView>
  );
}
