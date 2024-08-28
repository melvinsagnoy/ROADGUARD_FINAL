import React, { useState } from 'react';
import { View, TouchableOpacity, Animated, Easing, StyleSheet, Image } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const NavBar = ({ navigation }) => {
  const [iconScales, setIconScales] = useState({
    home: new Animated.Value(1),
    search: new Animated.Value(1),
    add: new Animated.Value(1),
    bell: new Animated.Value(1),
    user: new Animated.Value(1),
  });

  const animateIcon = (iconName) => {
    Animated.sequence([
      Animated.timing(iconScales[iconName], {
        toValue: 0.8,
        duration: 100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(iconScales[iconName], {
        toValue: 1.2,
        duration: 100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(iconScales[iconName], {
        toValue: 1,
        duration: 100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = (screenName, iconName) => {
    animateIcon(iconName);
    navigation.navigate(screenName);
  };

  return (
    <View style={styles.navbar}>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => handlePress('Home', 'home')}>
        <Animated.View style={{ transform: [{ scale: iconScales.home }] }}>
          <MaterialIcons name="home" size={30} color="#000" />
        </Animated.View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => handlePress('Search', 'search')}>
        <Animated.View style={{ transform: [{ scale: iconScales.search }] }}>
          <Image source={require('../assets/joystick.png')} style={styles.navIcon} />
        </Animated.View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.addButtonContainer}
        onPress={() => handlePress('Add', 'add')}>
        <Animated.View style={{ transform: [{ scale: iconScales.add }] }}>
          <Image source={require('../assets/mapIcon.png')} style={styles.addButtonIcon} />
        </Animated.View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => handlePress('Notifications', 'bell')}>
        <Animated.View style={{ transform: [{ scale: iconScales.bell }] }}>
          <MaterialIcons name="notifications" size={30} color="#000" />
        </Animated.View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => handlePress('Profile', 'user')}>
        <Animated.View style={{ transform: [{ scale: iconScales.user }] }}>
          <MaterialIcons name="account-circle" size={30} color="#000" />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 70,
    backgroundColor: '#E0C55B',
    borderRadius: 25,
    borderColor: '#ccc',
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  addButtonContainer: {
    position: 'absolute',
    right: 100,
    top: -35,
    left: '50%',
    transform: [{ translateX: -10 }],
    width: 60,
    height: 60,
    borderRadius: 35,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
    zIndex: 1,
  },
  navIcon: {
    width: 30,
    height: 30,
  },
  addButtonIcon: {
    width: 50,
    height: 50,
  },
});

export default NavBar;
