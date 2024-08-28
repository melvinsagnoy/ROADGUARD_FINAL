// FingerprintVerificationScreen.js

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { authenticateAsync } from 'expo-local-authentication';

const FingerprintVerification = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const authenticateWithFingerprint = async () => {
    setLoading(true);

    try {
      const result = await authenticateAsync({
        promptMessage: 'Authenticate with fingerprint',
      });

      if (result.success) {
        Alert.alert('Success', 'Fingerprint authenticated successfully!');
        navigation.replace('Home'); // Replace current screen with HomeScreen upon successful authentication
      } else if (result.error) {
        console.error('Authentication failed:', result.error);
        Alert.alert('Authentication failed', 'Fingerprint authentication failed');
      } else {
        console.warn('Authentication cancelled by user');
      }
    } catch (error) {
      console.error('Error authenticating with fingerprint:', error);
      Alert.alert('Error', 'Failed to authenticate with fingerprint.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fingerprint Verification</Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#E0C55B' }]}
        onPress={authenticateWithFingerprint}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Use Fingerprint</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#545151',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  button: {
    width: 300,
    height: 53,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#E0C55B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: 'black',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default FingerprintVerification;
