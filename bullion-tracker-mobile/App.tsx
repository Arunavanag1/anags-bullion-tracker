import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { SpotPricesProvider } from './src/contexts/SpotPricesContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { CollectionScreen } from './src/screens/CollectionScreen';
import { AddItemScreen } from './src/screens/AddItemScreen';
import { CollageScreen } from './src/screens/CollageScreen';
import { ActivityIndicator, View, Text } from 'react-native';
import { api } from './src/lib/api';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type RootStackParamList = {
  Dashboard: undefined;
  Collection: undefined;
  AddItem: { itemId?: string };
  Collage: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: '#FFFBF8',
        },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function MainNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTintColor: '#2D1B1B',
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
        headerShadowVisible: true,
        contentStyle: {
          backgroundColor: '#FFFBF8',
        },
      }}
    >
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Collection"
        component={CollectionScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AddItem"
        component={AddItemScreen}
        options={({ route }) => ({
          title: route.params?.itemId ? 'Edit Item' : 'Add Item',
        })}
      />
      <Stack.Screen
        name="Collage"
        component={CollageScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFBF8' }}>
        <ActivityIndicator size="large" color="#E76F51" />
        <Text style={{ marginTop: 16, color: '#8B6B61', fontSize: 16 }}>
          Loading Bullion Tracker...
        </Text>
      </View>
    );
  }

  return user ? <MainNavigator /> : <AuthNavigator />;
}

export default function App() {
  // Sync coin reference data on app startup for offline use
  useEffect(() => {
    api.syncCoinsCache().catch(err => {
      console.warn('Failed to sync coins cache on startup:', err);
    });
  }, []);

  return (
    <AuthProvider>
      <SpotPricesProvider>
        <StatusBar style="dark" />
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </SpotPricesProvider>
    </AuthProvider>
  );
}
