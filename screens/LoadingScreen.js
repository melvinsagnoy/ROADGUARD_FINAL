import React, { useEffect, useState } from 'react';
import { View, Animated, Image, ImageBackground, StyleSheet, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import { BlurView } from 'expo-blur';

const LoadingScreen = () => {
  const [fontsLoaded] = useFonts({
    Poppins: require('../assets/fonts/Poppins-Regular.ttf'), // Ensure this matches your font path
  });

  const [loading, setLoading] = useState(true); // Manage loading state
  const spinValue = new Animated.Value(0); // Animation value for rotation

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

  useEffect(() => {
    // Simulate loading delay (replace this with real logic as needed)
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 3000); // Adjust the timeout duration as needed

    return () => clearTimeout(timeout);
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
            <ActivityIndicator size="large" color="#E0C55B" />
          </View>
        </BlurView>
      </ImageBackground>
    );
  }

  // Render an empty view or placeholder while fonts are loading
  return null;
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  blurContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Adjust to match your design
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: {
    width: 80, // Adjust the width and height as needed
    height: 80,
    marginBottom: 20,
  },
});

export default LoadingScreen;   