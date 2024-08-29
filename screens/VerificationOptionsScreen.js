import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { auth } from '../firebaseConfig';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Import icon library

const VerificationOptionsScreen = ({ navigation }) => {

  // Function to check if a user is authenticated
  const checkAuthentication = () => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!user) {
        navigation.navigate('Landing'); // Navigate to landing screen if no user
      }
    });
    return () => unsubscribe(); // Cleanup subscription on unmount
  };

  useEffect(() => {
    checkAuthentication();
  }, []);

  const handleFingerprintVerify = async () => {
    try {
      const hasFingerprint = await LocalAuthentication.hasHardwareAsync();
      if (!hasFingerprint) {
        Alert.alert('Fingerprint authentication is not available on this device.');
        return;
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        Alert.alert('No fingerprints are enrolled on this device. Please add fingerprints in device settings.');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate with your fingerprint',
      });

      if (result.success) {
        navigation.navigate('Home'); // Navigate to home screen on success
      } else {
        Alert.alert('Fingerprint authentication failed.');
      }
    } catch (error) {
      console.error('Error during fingerprint authentication:', error);
      Alert.alert('An error occurred during fingerprint authentication.');
    }
  };

  const handlePasscodeVerify = () => {
    navigation.navigate('PasscodeVerificationScreen'); // Navigate to passcode verification screen
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Verification Method</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.optionButton} onPress={handleFingerprintVerify}>
          <Icon name="fingerprint" size={90} color="#E0C55B" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionButton} onPress={handlePasscodeVerify}>
          <Icon name="lock" size={90} color="#E0C55B" />
        </TouchableOpacity>
      </View>
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
    marginBottom: 30,
  },
  buttonContainer: {
    flexDirection: 'row', // Align buttons horizontally
    justifyContent: 'center', // Center the buttons horizontally
    alignItems: 'center', // Center the buttons vertically
  },
  optionButton: {
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginHorizontal: 10, // Space between buttons
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VerificationOptionsScreen;
