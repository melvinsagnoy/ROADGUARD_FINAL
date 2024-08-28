import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Formik } from 'formik';
import * as yup from 'yup';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';

const loginValidationSchema = yup.object().shape({
  emailOrPhone: yup.string().required('Email or phone number is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters long').required('Password is required'),
});

const LoginScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [fontsLoaded] = useFonts({
    Poppins: require('../assets/fonts/Poppins-Regular.ttf'),
  });

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      // Check if input is an email or phone number
      if (values.emailOrPhone.includes('@')) {
        // Login with email
        await signInWithEmailAndPassword(auth, values.emailOrPhone, values.password);
      } else {
        // For simplicity, treating phone numbers as email in this example
        // Firebase Authentication only supports email/password and SMS-based authentication
        Alert.alert('Phone number login is not implemented in this example.');
        setLoading(false);
        return;
      }

      await AsyncStorage.setItem('user', JSON.stringify({ email: values.emailOrPhone })); // Save user data in local storage
      console.log('User data saved:', { email: values.emailOrPhone }); // Debugging line
      setLoading(false);
      navigation.navigate('VerificationOptions'); // Navigate to verification options
    } catch (error) {
      setLoading(false);
      Alert.alert('Login Error', error.message);
    }
  };

  if (!fontsLoaded) {
    return null; // Load font here or render a loading indicator
  }

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Formik
          validationSchema={loginValidationSchema}
          initialValues={{ emailOrPhone: '', password: '' }}
          onSubmit={handleLogin}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <>
              <View style={styles.header}>
                <Text style={[styles.label, styles.title, { fontFamily: 'Poppins' }]}>Sign-In</Text>
              </View>

              <Text style={[styles.label, styles.emailOrPhoneLabel, { fontFamily: 'Poppins' }]}>Email or Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email or phone number"
                onChangeText={handleChange('emailOrPhone')}
                onBlur={handleBlur('emailOrPhone')}
                value={values.emailOrPhone}
                placeholderTextColor="#7C7A7A"
                fontFamily='Poppins'
              />
              {touched.emailOrPhone && errors.emailOrPhone && <Text style={styles.errorText}>{errors.emailOrPhone}</Text>}

              <Text style={[styles.label, styles.passLabel, { fontFamily: 'Poppins' }]}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
                value={values.password}
                secureTextEntry
                placeholderTextColor="#7C7A7A"
                fontFamily='Poppins'
              />
              {touched.password && errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#E0C55B' }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Log-in</Text>
              </TouchableOpacity>
            </>
          )}
        </Formik>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={[styles.registerText, { fontFamily: 'Poppins' }]}>Don't have an account? Register</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#545151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: 0,
  },
  emailOrPhoneLabel: {
    marginTop: 20,
    padding: 5,
    fontSize: 15,
    marginLeft: 25,
    color: 'white',
  },
  passLabel: {
    padding: 5,
    fontSize: 15,
    marginLeft: 25,
    color: 'white',
  },
  label: {
    fontSize: 15,
    padding: 5,
    color: 'white',
    alignSelf: 'flex-start',
  },
  title: {
    color: 'white',
    padding: 10,
    marginTop: 0,
    fontSize: 40,
  },
  form: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    width: 300,
    height: 45,
    borderColor: '#7C7A7A',
    borderWidth: 2,
    marginBottom: 10,
    paddingLeft: 8,
    borderRadius: 20,
    color: 'white',
  },
  errorText: {
    height: 20,
    fontSize: 12,
    color: 'red',
    alignSelf: 'center',
  },
  registerText: {
    marginTop: 20,
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    width: 300,
    height: 53,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
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

export default LoginScreen;