import React, { useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

const SplashScreen = ({ onLoadComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onLoadComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container} className="flex-1 bg-white justify-center items-center">
      <View style={styles.content} className="flex-1 justify-center items-center">
        <View style={styles.logoContainer} className="w-30 h-30 rounded-full bg-blue-50 justify-center items-center mb-5 shadow-lg">
          <Text style={styles.logoEmoji} className="text-5xl">🏗️</Text>
        </View>
        <Text style={styles.title} className="text-3xl font-bold text-gray-700 mb-2">
          Nirman Mobile
        </Text>
        <Text style={styles.subtitle} className="text-base text-gray-500 mb-10">
          Construction Management
        </Text>
        <ActivityIndicator
          size="large"
          color="#2196F3"
          style={styles.loader}
          className="mt-5"
        />
      </View>
      <Text style={styles.version} className="text-xs text-gray-400 mb-8">
        Version 1.0.0
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  loader: {
    marginTop: 20,
  },
  version: {
    fontSize: 12,
    color: '#999',
    marginBottom: 32,
  },
});

export default SplashScreen;