import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../App';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      // Navigation will happen automatically via auth state change
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message || 'Invalid credentials');
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
          Welcome Back
        </Text>
        <Text style={{ fontSize: 16, color: '#8B6B61', textAlign: 'center' }}>
          Sign in to your TrakStack account
        </Text>
      </View>

      {/* Form */}
      <View style={{ gap: 20 }}>
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
            autoComplete="password"
            textContentType="password"
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
          <Button onPress={handleSignIn} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : 'Sign In'}
          </Button>
        </View>
      </View>

      {/* Sign Up Link */}
      <View style={{ marginTop: 32, alignItems: 'center' }}>
        <Text style={{ fontSize: 14, color: '#8B6B61' }}>
          Don't have an account?{' '}
          <Text
            onPress={() => navigation.navigate('Register')}
            style={{ color: '#E76F51', fontWeight: '600' }}
          >
            Sign Up
          </Text>
        </Text>
      </View>
    </ScrollView>
  );
}
