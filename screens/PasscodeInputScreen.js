import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated, Image } from 'react-native';
import { firestore, auth } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore'; 

const PasscodeInputScreen = ({ navigation, route }) => {
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [storedPasscode, setStoredPasscode] = useState(''); // Temporary storage for the passcode
  const maxDigits = 4; // Define the maximum number of digits for the passcode
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Extract email from route params
  const email = route.params?.email || '';

  const handleNumberPress = (number) => {
    if (isConfirming) {
      if (confirmPasscode.length < maxDigits) {
        setConfirmPasscode(prev => prev + number);
      }
    } else {
      if (passcode.length < maxDigits) {
        setPasscode(prev => prev + number);
      }
    }
  };

  const handleDeletePress = () => {
    if (isConfirming) {
      if (confirmPasscode.length > 0) {
        setConfirmPasscode(prev => prev.slice(0, -1));
      }
    } else {
      if (passcode.length > 0) {
        setPasscode(prev => prev.slice(0, -1));
      }
    }
  };

  const handleConfirmPress = async () => {
    if (isConfirming) {
      if (confirmPasscode.length === maxDigits) {
        if (confirmPasscode === storedPasscode) {
          setLoading(true);
          Animated.loop(
            Animated.timing(rotateAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            })
          ).start();
          
          try {
            const user = auth.currentUser;
            if (!user) {
              throw new Error('User not authenticated');
            }

            // Register passcode in Firestore under user's email as document ID
            const userDocRef = doc(firestore, 'users', email);
            await setDoc(userDocRef, { passcode: storedPasscode });

            setLoading(false);
            navigation.navigate('Profile'); // Navigate to profile or home screen after successful verification
          } catch (error) {
            setLoading(false);
            console.error('Error registering passcode:', error);
            Alert.alert('Registration Error', 'Failed to register passcode.');
          }
        } else {
          Alert.alert('Passcode Mismatch', 'The passcodes do not match.');
          // Reset states to allow user to re-enter passcode
          setPasscode('');
          setConfirmPasscode('');
          setStoredPasscode('');
          setIsConfirming(false);
        }
      } else {
        Alert.alert('Incomplete Passcode', 'Please enter 4 digits.');
      }
    } else {
      if (passcode.length === maxDigits) {
        setStoredPasscode(passcode); // Store passcode temporarily
        setIsConfirming(true);
        setPasscode(''); // Clear the initial passcode for security reasons
      } else {
        Alert.alert('Incomplete Passcode', 'Please enter 4 digits.');
      }
    }
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isConfirming ? 'Confirm Passcode' : 'Set Passcode'}</Text>
      <View style={styles.passcodeContainer}>
        {/* Display passcode circles */}
        {Array.from({ length: maxDigits }).map((_, index) => (
          <View key={index} style={[styles.passcodeCircle, (isConfirming ? confirmPasscode : passcode).length > index && styles.passcodeFilled]} />
        ))}
      </View>
      {/* Number grid */}
      <View style={styles.numberGrid}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
          <TouchableOpacity key={number} style={styles.numberButton} onPress={() => handleNumberPress(String(number))}>
            <Text style={styles.numberText}>{number}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.numberButton} onPress={handleDeletePress}>
          <Text style={styles.numberText}>DEL</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.numberButton} onPress={() => handleNumberPress('0')}>
          <Text style={styles.numberText}>0</Text>
        </TouchableOpacity>
      </View>
      {/* Confirm button */}
      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmPress} disabled={loading}>
        {loading ? (
          <Animated.View style={[styles.loadingContainer, { transform: [{ rotate: rotateInterpolate }] }]}>
            <Image source={require('../assets/tire.png')} style={styles.loadingImage} />
          </Animated.View>
        ) : (
          <Text style={styles.confirmButtonText}>{isConfirming ? 'Confirm' : 'Next'}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  passcodeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  passcodeCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0C55B',
    marginHorizontal: 10,
  },
  passcodeFilled: {
    backgroundColor: '#E0C55B', // Change color to indicate filled circle
  },
  numberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
    width: '80%', // Ensure the grid is centered
  },
  numberButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderColor: '#E0C55B',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
  },
  numberText: {
    fontSize: 24,
    color: 'white'
  },
  confirmButton: {
    width: '80%',
    height: 50,
    backgroundColor: '#E0C55B',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    position: 'relative', // Ensure positioning for loading indicator
  },
  confirmButtonText: {
    fontSize: 18,
    color: '#FFF',
  },
  loadingContainer: {
    position: 'absolute',
  },
  loadingImage: {
    width: 30,
    height: 30,
  },
});

export default PasscodeInputScreen;
