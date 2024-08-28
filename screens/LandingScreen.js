import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ImageBackground, Animated } from 'react-native';
import { useFonts } from 'expo-font';
import { BlurView } from 'expo-blur';

const LandingScreen = ({ navigation }) => {
  const [fontsLoaded] = useFonts({
    Poppins: require('../assets/fonts/Poppins-Regular.ttf'), // Replace with your font file path
  });

  const [loading, setLoading] = useState(true); // State to manage loading animation
  const spinValue = new Animated.Value(0); // Animation value for rotation

  useEffect(() => {
    // Simulate font loading delay, remove this in production
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 3000); // Adjust the timeout duration as needed

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    // Rotate animation for tire image
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!fontsLoaded || loading) {
    return (
      <ImageBackground source={require('../assets/background.jpg')} style={styles.background}>
        <BlurView intensity={50} style={styles.blurContainer}>
          <View style={styles.container}>
            <Animated.Image
              source={require('../assets/tire.png')} // Replace with your tire image source
              style={[styles.loadingIcon, { transform: [{ rotate: spin }] }]}
            />
          </View>
        </BlurView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={require('../assets/background.jpg')} style={styles.background}>
      <BlurView intensity={50} style={styles.blurContainer}>
        <View style={styles.container}>
          <View style={styles.logoContainer}>
            <Image source={require('../assets/icon.png')} style={styles.logo} />
          </View>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.buttonText}>Sign-in</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.signUpButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.buttonText}>Sign-up</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  blurContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Layer color dodge effect simulation
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 50,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  signInButton: {
    width: 200,
    height: 50,
    backgroundColor: '#E0C55B',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  signUpButton: {
    width: 200,
    height: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
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
    fontFamily: 'Poppins',
  },
  loadingIcon: {
    width: 80, // Adjust the width and height as needed
    height: 80,
    marginBottom: 20,
  },
});

export default LandingScreen;
