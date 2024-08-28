import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Dimensions, Animated, Image } from 'react-native';
import MapView, { Marker, Polyline, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import NavBar from './NavBar';
import { getDatabase, ref, child, get } from 'firebase/database'; // Importing Realtime Database

const AddScreen = ({ route, navigation }) => {
  const [location, setLocation] = useState(null);
  const [heading, setHeading] = useState(0);
  const [destination, setDestination] = useState('');
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [pathCoordinates, setPathCoordinates] = useState([]);
  const [currentAddress, setCurrentAddress] = useState('');
  const [mapLocation, setMapLocation] = useState(null);
  const [posts, setPosts] = useState([]); // To store posts with 2 or more upvotes
  const [fontsLoaded] = useFonts({
    Poppins: require('../assets/fonts/Poppins-Regular.ttf'),
  });
  const [loading, setLoading] = useState(true);
  const spinValue = new Animated.Value(0);

  // Function to fetch posts from Realtime Database
 const fetchPosts = async () => {
  console.log('Attempting to fetch posts from Realtime Database...');
  try {
    const db = getDatabase(); // Get a reference to the database
    const postsRef = ref(db, 'posts'); // Reference to the 'posts' node
    const snapshot = await get(postsRef); // Fetch the data
    
    if (snapshot.exists()) {
      const postsData = snapshot.val(); // Get the data as an object
      const filteredPosts = Object.values(postsData).filter(post => post.upvotes >= 2); // Convert to array and filter
      setPosts(filteredPosts);
      console.log('Filtered posts:', filteredPosts); // Log the filtered posts
    } else {
      console.log('No data available');
    }
  } catch (error) {
    console.error('Error fetching posts from Realtime Database:', error);
  }
};

  useEffect(() => {
    const fetchLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location.coords);
      fetchAddress(location.coords.latitude, location.coords.longitude);

      Location.watchHeadingAsync((headingObj) => {
        setHeading(headingObj.trueHeading || 0);
      });
    };

    fetchLocation();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  useEffect(() => {
    if (route.params?.location) {
      setMapLocation(route.params.location);
    }
  }, [route.params?.location]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchAddress = async (latitude, longitude) => {
    try {
      let addressResponse = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (addressResponse && addressResponse.length > 0) {
        let address = `${addressResponse[0].name}, ${addressResponse[0].city}, ${addressResponse[0].region}, ${addressResponse[0].country}`;
        setCurrentAddress(address);
      }
    } catch (error) {
      console.error('Error fetching address:', error);
    }
  };

  const handleDestinationChange = (text) => {
    setDestination(text);
  };

  const navigateToDestination = async () => {
    try {
      let geoLocation = await Location.geocodeAsync(destination);
      if (geoLocation && geoLocation.length > 0) {
        setDestinationLocation(geoLocation[0]);
        const { latitude, longitude } = location;
        setPathCoordinates([
          { latitude, longitude },
          { latitude: geoLocation[0].latitude, longitude: geoLocation[0].longitude },
        ]);
      } else {
        console.log('No geocode results found');
      }
    } catch (error) {
      console.error('Error finding destination:', error);
    }
  };

  const calculateDistance = () => {
    if (location && destinationLocation) {
      const { latitude, longitude } = location;
      const { latitude: destLat, longitude: destLng } = destinationLocation;
      const distance = haversineDistance(latitude, longitude, destLat, destLng);
      return `${distance.toFixed(2)} km`;
    } else if (location && destination === 'Current Location') {
      return '0.00 km';
    }
    return '';
  };

  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRadians = (angle) => angle * (Math.PI / 180);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!fontsLoaded || loading || !location) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.Image
          source={require('../assets/tire.png')}
          style={[styles.loadingIcon, { transform: [{ rotate: spin }] }]}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {mapLocation && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: mapLocation.latitude,
            longitude: mapLocation.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          <Marker coordinate={mapLocation} />
        </MapView>
      )}

      <MapView
  style={styles.map}
  initialRegion={{
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  }}
>
  {posts.map(post => (
    <Marker
      key={post.email} // Ensure unique key
      coordinate={{
        latitude: post.location.latitude,
        longitude: post.location.longitude,
      }}
      title={post.title}
      description={`Upvotes: ${post.upvotes}`}
    >
      <Callout>
        <View style={styles.calloutContainer}>
          <Text style={styles.postTitle}>{post.title}</Text>
          <Image
            source={{ uri: post.imageURL || 'https://via.placeholder.com/40' }} // Use imageURL instead of photoURL
            style={styles.profileImage}
            onLoad={() => console.log('Profile image loaded successfully:', post.imageURL)}
            onError={(e) => console.log('Profile image load error:', e.nativeEvent.error)}
          />
          <Text>{post.body}</Text>
        </View>
      </Callout>
    </Marker>
  ))}
</MapView>

      <View style={styles.addressContainer}>
        <View style={styles.currentLocationContainer}>
          <Text style={styles.currentLocationLabel}>Current Location:</Text>
          <Text style={styles.currentLocationText}>{currentAddress}</Text>
        </View>

        <View style={styles.destinationContainer}>
          {destinationLocation && (
            <View>
              <Text style={styles.currentLocationLabel}>Where to GO?</Text>
              <Text style={styles.addressText}>{destination}</Text>
              <Text style={styles.distanceText}>{calculateDistance()}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter destination..."
          onChangeText={handleDestinationChange}
          value={destination}
        />
        <TouchableOpacity style={styles.searchButton} onPress={navigateToDestination}>
          <Text style={styles.searchButtonText}>Go</Text>
        </TouchableOpacity>
      </View>
      <NavBar navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  addressContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
  },
  currentLocationContainer: {
    marginBottom: 10,
  },
  currentLocationLabel: {
    fontWeight: 'bold',
  },
  currentLocationText: {
    fontSize: 14,
  },
  destinationContainer: {
    marginBottom: 10,
  },
  addressText: {
    fontSize: 14,
  },
  distanceText: {
    fontSize: 12,
    color: '#1976D2',
  },
  inputContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    elevation: 2,
  },
  searchButton: {
    padding: 10,
    backgroundColor: '#1976D2',
    borderRadius: 5,
    marginLeft: 10,
    elevation: 2,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: {
    width: 80,
    height: 80,
  },
  calloutContainer: {
    width: 150,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    alignItems: 'center',
  },
  postTitle: {
    fontWeight: 'bold',
    color: '#FF0000', // Red color for hazard-like title
    marginBottom: 5,
  },
});

export default AddScreen;
