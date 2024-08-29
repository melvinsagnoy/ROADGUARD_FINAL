import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Animated, Image } from 'react-native';
import { Formik } from 'formik';
import * as yup from 'yup';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';

const loginValidationSchema = yup.object().shape({
  emailOrPhone: yup.string().required('Email or phone number is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters long').required('Password is required'),
});

const LoginScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [fontsLoaded] = useFonts({
    Poppins: require('../assets/fonts/Poppins-Regular.ttf'),
  });
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const handleLogin = async (values) => {
    setLoading(true);
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();

    const auth = getAuth();

    try {
      let userCredential;
      if (values.emailOrPhone.includes('@')) {
        // Login with email
        userCredential = await signInWithEmailAndPassword(auth, values.emailOrPhone, values.password);
      } else {
        // Login with phone number
        const phoneNumber = values.emailOrPhone.trim(); // Remove any extra spaces
        
        // Query Firestore for the document where the phoneNumber matches
        const q = query(collection(firestore, 'users'), where('phoneNumber', '==', phoneNumber));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          throw new Error('No user found with this phone number.');
        }

        let userData;
        querySnapshot.forEach((doc) => {
          userData = doc.data(); // Assuming only one document matches the phone number
        });

        // If the phone number exists in Firestore, log in with email/password
        userCredential = await signInWithEmailAndPassword(auth, userData.email, values.password);
      }

      await AsyncStorage.setItem('user', JSON.stringify({ email: values.emailOrPhone }));
      console.log('User data saved:', { email: values.emailOrPhone });
      setLoading(false);
      navigation.navigate('VerificationOptions');
    } catch (error) {
      setLoading(false);
      Alert.alert('Login Error', error.message);
    }
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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

              <Text style={[styles.label, styles.emailOrPhoneLabel, { fontFamily: 'Poppins' }]}>
                Email or Phone Number
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email or phone number"
                onChangeText={handleChange('emailOrPhone')}
                onBlur={handleBlur('emailOrPhone')}
                value={values.emailOrPhone}
                placeholderTextColor="#7C7A7A"
                fontFamily="Poppins"
                keyboardType="email-address"
              />
              {touched.emailOrPhone && errors.emailOrPhone && (
                <Text style={styles.errorText}>{errors.emailOrPhone}</Text>
              )}

              <Text style={[styles.label, styles.passLabel, { fontFamily: 'Poppins' }]}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
                value={values.password}
                secureTextEntry
                placeholderTextColor="#7C7A7A"
                fontFamily="Poppins"
              />
              {touched.password && errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}

              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#E0C55B' }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <Animated.View style={[styles.loadingContainer, { transform: [{ rotate: rotateInterpolate }] }]}>
                    <Image source={require('../assets/tire.png')} style={styles.loadingImage} />
                  </Animated.View>
                ) : (
                  <Text style={styles.buttonText}>Log-in</Text>
                )}
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
    position: 'relative', // Ensure positioning for loading indicator
  },
  buttonText: {
    color: 'black',
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingContainer: {
    position: 'absolute',
  },
  loadingImage: {
    width: 30,
    height: 30,
  },
});

export default LoginScreen;