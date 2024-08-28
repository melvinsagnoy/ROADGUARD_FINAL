import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import Icon from 'react-native-vector-icons/Ionicons';
import CombinedModal from './CombinedModal'; // Updated import

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleRegisterButtonPress = async () => {
    if (!email || !phoneNumber || !password || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    if (!termsAccepted) {
      Alert.alert('Agreement Required', 'You must agree to the terms and privacy policy.');
      return;
    }

    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      setLoading(false);
      Alert.alert('Registration Successful', 'You have registered successfully!');
      navigation.navigate('Passcode', { email: email });
    } catch (error) {
      setLoading(false);
      console.error('Error registering user:', error);
      Alert.alert('Registration Error', error.message);
    }
  };

  const handleAgree = () => {
    setTermsAccepted(true);
    setShowModal(false);
  };

  const handleCheckboxPress = () => {
    if (!termsAccepted) {
      Alert.alert('Agreement Required', 'You need to agree to the terms and privacy policy first.');
      return;
    }
    setTermsAccepted(!termsAccepted);
  };

  // Function to handle phone number input
  const handlePhoneNumberChange = (text) => {
    // Remove non-numeric characters
    const cleanedText = text.replace(/[^0-9]/g, '');
    // Limit to 11 digits
    if (cleanedText.length <= 11) {
      setPhoneNumber(cleanedText);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Email"
        onChangeText={(text) => setEmail(text)}
        value={email}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        onChangeText={handlePhoneNumberChange}
        value={phoneNumber}
        keyboardType="numeric" // Ensure only numbers are inputted
        maxLength={11} // Limit input to 11 digits
      />
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          onChangeText={(text) => setPassword(text)}
          value={password}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Icon name={showPassword ? 'eye-off' : 'eye'} size={20} color="#E0C55B" />
        </TouchableOpacity>
      </View>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Confirm Password"
          onChangeText={(text) => setConfirmPassword(text)}
          value={confirmPassword}
          secureTextEntry={!showConfirmPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          <Icon name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color="#E0C55B" />
        </TouchableOpacity>
      </View>
      <View style={styles.agreementContainer}>
        <TouchableOpacity
          style={[styles.customCheckbox, termsAccepted && styles.customCheckboxChecked]}
          onPress={handleCheckboxPress}
          disabled={!termsAccepted && !showModal}
        >
          {termsAccepted && <Icon name="checkmark" size={20} color="#FFF" />}
        </TouchableOpacity>
        <Text style={styles.agreementText}>
          I agree to the <Text style={styles.link} onPress={() => setShowModal(true)}>Terms and Conditions</Text> and <Text style={styles.link} onPress={() => setShowModal(true)}>Privacy Policy</Text>.
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.button, { opacity: loading ? 0.5 : 1 }]}
        onPress={handleRegisterButtonPress}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Registering...' : 'Register'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.loginText}>Already have an account? Login</Text>
      </TouchableOpacity>
      {showModal && (
        <CombinedModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          onAgree={handleAgree}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#545151',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  passwordContainer: {
    width: '100%',
    position: 'relative',
    marginBottom: 20,
  },
  passwordInput: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    paddingRight: 50,
  },
  toggleButton: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -12 }],
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#E0C55B',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 18,
    color: '#FFF',
  },
  loginText: {
    marginTop: 20,
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
  },
  agreementContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  customCheckbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: '#E0C55B',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  customCheckboxChecked: {
    backgroundColor: '#E0C55B',
  },
  agreementText: {
    fontSize: 16,
    color: '#FFF',
  },
  link: {
    color: '#E0C55B',
    textDecorationLine: 'underline',
  },
});

export default RegisterScreen;
