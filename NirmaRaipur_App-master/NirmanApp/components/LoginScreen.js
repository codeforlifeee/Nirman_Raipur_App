import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import AuthService from '../services/auth';

const LoginScreen = ({ navigation, onLogin }) => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    // Display the API URL for debugging
    const url = process.env.EXPO_PUBLIC_API_URL || 'Not configured';
    setApiUrl(url);
    console.log('LoginScreen: API URL:', url);
  }, []);

  const testConnection = async () => {
    setTestingConnection(true);
    try {
      console.log('Testing connection to:', apiUrl);
      const response = await fetch(apiUrl.replace('/api', '/'), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        Alert.alert('Success', 'Server is reachable!');
      } else {
        Alert.alert('Connection Issue', `Server responded with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      Alert.alert(
        'Connection Failed',
        `Cannot connect to server at ${apiUrl}\n\nError: ${error.message}\n\nMake sure:\n1. Backend server is running\n2. IP address is correct\n3. Phone and computer are on same network`
      );
    } finally {
      setTestingConnection(false);
    }
  };

  const handleLogin = async () => {
    // Trim whitespace from inputs
    const email = credentials.email.trim();
    const password = credentials.password.trim();

    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      console.log('LoginScreen: Starting login process...');
      const result = await AuthService.login({ email, password });
      console.log('LoginScreen: Login result:', result.success ? 'Success' : 'Failed');

      if (result.success) {
        Alert.alert('Success', 'Login successful!');
        onLogin();
      } else {
        console.error('LoginScreen: Login failed with error:', result.error);
        Alert.alert('Login Failed', result.error || 'Unable to login. Please try again.');
      }
    } catch (error) {
      console.error('LoginScreen: Unexpected error:', error);
      Alert.alert('Error', error.message || 'An unexpected error occurred. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const updateCredentials = (field, value) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content} className="flex-1 justify-center px-5">
        <View style={styles.logoContainer} className="w-20 h-20 rounded-full bg-primary-500 justify-center items-center self-center mb-5">
          <Text style={styles.logoEmoji} className="text-3xl text-white">🏗️</Text>
        </View>

        <Text style={styles.title} className="text-3xl font-bold text-gray-700 text-center mb-2">
          Welcome Back
        </Text>
        <Text style={styles.subtitle} className="text-base text-gray-500 text-center mb-10">
          Sign in to your account
        </Text>

        <View style={styles.formContainer} className="bg-white rounded-xl p-5 shadow-sm">
          <View style={styles.inputGroup} className="mb-5">
            <Text style={styles.label} className="text-base font-semibold text-gray-700 mb-2">
              Email
            </Text>
            <TextInput
              style={styles.input}
              className="border border-gray-300 rounded-lg px-3 py-3 text-base bg-gray-50"
              placeholder="Enter your email"
              value={credentials.email}
              onChangeText={(value) => updateCredentials('email', value)}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup} className="mb-5">
            <Text style={styles.label} className="text-base font-semibold text-gray-700 mb-2">
              Password
            </Text>
            <TextInput
              style={styles.input}
              className="border border-gray-300 rounded-lg px-3 py-3 text-base bg-gray-50"
              placeholder="Enter your password"
              value={credentials.password}
              onChangeText={(value) => updateCredentials('password', value)}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            className={`rounded-lg py-4 items-center mt-3 ${loading ? 'bg-gray-300' : 'bg-primary-500'}`}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText} className="text-white text-base font-semibold">
                Sign In
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.forgotPassword} className="mt-5 items-center">
          <Text style={styles.forgotPasswordText} className="text-primary-500 text-sm">
            Forgot Password?
          </Text>
        </TouchableOpacity>

        {/* API URL Display for debugging */}
        <View style={styles.apiUrlContainer} className="mt-4 p-2 bg-gray-100 rounded">
          <Text style={styles.apiUrlLabel} className="text-xs text-gray-500 text-center">
            API Server:
          </Text>
          <Text style={styles.apiUrlText} className="text-xs text-gray-700 text-center font-mono">
            {apiUrl}
          </Text>
          
          {/* Test Connection Button */}
          <TouchableOpacity
            style={styles.testButton}
            onPress={testConnection}
            disabled={testingConnection}
          >
            {testingConnection ? (
              <ActivityIndicator size="small" color="#2196F3" />
            ) : (
              <Text style={styles.testButtonText}>Test Connection</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#f5f5f5',
    color: '#333',
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    marginTop: 20,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '500',
  },
  apiUrlContainer: {
    marginTop: 16,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  apiUrlLabel: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginBottom: 4,
  },
  apiUrlText: {
    fontSize: 11,
    color: '#555',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  testButton: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  testButtonText: {
    color: '#2196F3',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default LoginScreen;