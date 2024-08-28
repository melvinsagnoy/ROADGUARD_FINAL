import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated, Image } from 'react-native';
import { firestore } from '../firebaseConfig'; // Ensure firestore is imported correctly
import { doc, getDoc } from 'firebase/firestore';
import { auth } from '../firebaseConfig'; // Import auth from firebaseConfig

const PasscodeVerificationScreen = ({ navigation }) => {
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const maxDigits = 4; // Define the maximum number of digits for the passcode
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const handleNumberPress = (number) => {
    if (passcode.length < maxDigits) {
      setPasscode(passcode + number); // Concatenate the pressed number to the passcode
    }
  };

  const handleDeletePress = () => {
    if (passcode.length > 0) {
      setPasscode(passcode.slice(0, -1)); // Remove the last digit from the passcode
    }
  };

  const handleVerifyPasscode = async () => {
    if (passcode.length === maxDigits) {
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

        const email = user.email; // Retrieve the authenticated user's email
        const userDocRef = doc(firestore, 'users', email);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          const storedPasscode = userData.passcode;

          if (passcode === storedPasscode) {
            setLoading(false);
            navigation.navigate('Home'); // Navigate to home screen after successful verification
          } else {
            setLoading(false);
            Alert.alert('Incorrect Passcode', 'Please enter the correct passcode.');
          }
        } else {
          setLoading(false);
          Alert.alert('User Data Not Found', 'User data does not exist in Firestore.');
        }
      } catch (error) {
        setLoading(false);
        console.error('Error verifying passcode:', error);
        Alert.alert('Verification Error', 'Failed to verify passcode.');
      }
    } else {
      Alert.alert('Incomplete Passcode', 'Please enter 4 digits.');
    }
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Passcode</Text>
      <View style={styles.passcodeContainer}>
        {/* Display passcode circles */}
        {Array.from({ length: maxDigits }).map((_, index) => (
          <View key={index} style={[styles.passcodeCircle, passcode.length > index && styles.passcodeFilled]} />
        ))}
      </View>
      {/* Number grid */}
      <View style={styles.numberGrid}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
          <TouchableOpacity
            key={number}
            style={styles.numberButton}
            onPress={() => handleNumberPress(String(number))}
          >
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
      {/* Verify button */}
      <TouchableOpacity style={styles.verifyButton} onPress={handleVerifyPasscode}>
        {loading ? (
          <Animated.View style={[styles.loadingContainer, { transform: [{ rotate: rotateInterpolate }] }]}>
            <Image source={require('../assets/tire.png')} style={styles.loadingImage} />
          </Animated.View>
        ) : (
          <Text style={styles.verifyButtonText}>Verify Passcode</Text>
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
    backgroundColor: '#545151',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 30,
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
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderColor: '#E0C55B',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 15, // Increased margin for spacing
  },
  numberText: {
    fontSize: 24,
    color: 'white',
  },
  verifyButton: {
    width: '80%',
    height: 50,
    backgroundColor: '#E0C55B',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginTop: 20,
    position: 'relative', // Ensure positioning for loading indicator
  },
  verifyButtonText: {
    fontSize: 18,
    color: '#000',
  },
  loadingContainer: {
    position: 'absolute',
  },
  loadingImage: {
    width: 30,
    height: 30,
  },
});

export default PasscodeVerificationScreen;
