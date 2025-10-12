import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

// Components
import ErrorBoundary from './components/ErrorBoundary';
import SplashScreenComponent from './components/SplashScreen';
import LoginScreen from './components/LoginScreen';
import WorkProposalsScreen from './components/WorkProposalsScreen';
import WorkUpdateScreen from './components/WorkUpdateScreen';
import WorkProgressScreen from './components/WorkProgressScreen';

// Services
import AuthService from './services/auth';

// Keep splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authenticated = await AuthService.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSplashComplete = () => {
    setShowSplash(false);
    SplashScreen.hideAsync();
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (showSplash || isLoading) {
    return <SplashScreenComponent onLoadComplete={handleSplashComplete} />;
  }

  return (
    <ErrorBoundary>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2196F3',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Login" options={{ headerShown: false }}>
            {(props) => <LoginScreen {...props} onLogin={handleLogin} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen 
              name="WorkProposals" 
              component={WorkProposalsScreen}
              options={{ 
                title: 'Work Proposals',
                headerShown: false 
              }}
            />
            <Stack.Screen 
              name="WorkUpdate" 
              component={WorkUpdateScreen}
              options={{ 
                title: 'Update Work',
                headerBackTitleVisible: false 
              }}
            />
            <Stack.Screen 
              name="WorkProgress" 
              component={WorkProgressScreen}
              options={{ 
                title: 'Submit Progress',
                headerBackTitleVisible: false 
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
    </ErrorBoundary>
  );
}