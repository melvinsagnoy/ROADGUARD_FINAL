import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, RefreshControl, TouchableOpacity } from 'react-native';
import { database, firestore } from '../firebaseConfig'; // Import Realtime Database and Firestore
import { ref, onValue } from 'firebase/database';
import { collection, query, getDocs, Timestamp } from 'firebase/firestore'; // Import Timestamp
import NavBar from './NavBar'; // Adjust the path according to your project structure
import Icon from 'react-native-vector-icons/MaterialIcons'; // or any other icon library

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationType, setNotificationType] = useState('hazard'); // Default to hazard notifications

  const fetchNotifications = useCallback(async () => {
  setRefreshing(true);
  if (notificationType === 'hazard') {
    // Fetch hazard notifications from Realtime Database
    const postsRef = ref(database, 'posts'); // Adjust path as needed
    onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const postsArray = Object.keys(data).map(key => {
          const post = data[key];
          // Use 'createdAt' for hazard notifications
          const timestamp = typeof post.createdAt === 'string' ? new Date(post.createdAt).getTime() : null;
          return {
            id: key,
            ...post,
            type: 'hazard', // Add type to distinguish notifications
            timestamp: !isNaN(timestamp) ? timestamp : null, // Set timestamp to null if invalid
            imageURL: post.imageURL || 'https://via.placeholder.com/50', // Default placeholder
          };
        }).filter(post => post.timestamp !== null); // Filter out invalid timestamps
        console.log('Parsed hazard posts array:', postsArray); // Add logging for debugging
        setNotifications(postsArray);
      }
      setRefreshing(false);
    }, {
      onlyOnce: true
    });
  } else if (notificationType === 'game') {
    // Fetch game notifications from Firestore
    const usersCollection = collection(firestore, 'users');
    const q = query(usersCollection);
    const querySnapshot = await getDocs(q);
    const gameNotifications = querySnapshot.docs.flatMap(doc => {
      const scores = doc.data().scores || [];
      return Object.keys(scores).map(scoreKey => {
        const scoreData = scores[scoreKey];
        // Convert Firestore Timestamp to JavaScript Date
        const timestamp = scoreData.timestamp instanceof Timestamp
          ? scoreData.timestamp.toDate().getTime()
          : new Date(scoreData.timestamp).getTime();

        return {
          id: `${doc.id}-${scoreKey}`,
          score: scoreData.score, // Extract the score from the sub-field
          timestamp,
          displayName: doc.data().displayName,
          photoURL: doc.data().photoURL || 'https://via.placeholder.com/50', // Default placeholder
          type: 'game' // Add type to distinguish notifications
        };
      });
    });
    setNotifications(gameNotifications);
    setRefreshing(false);
  }
}, [notificationType]);




  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Function to calculate time ago for hazard notifications
  const calculateHazardTimeAgo = (timestamp) => {
    if (!timestamp) {
      console.log('Hazard timestamp is missing or invalid:', timestamp);
      return 'Unknown time';
    }

    const postTime = new Date(timestamp);

    if (isNaN(postTime.getTime())) {
      console.log('Invalid hazard date format:', timestamp);
      return 'Invalid time';
    }

    const now = new Date();
    const diff = now - postTime;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return days === 1 ? '1 day ago' : `${days} days ago`;
    } 
    if (hours > 0) {
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    } 
    if (minutes > 0) {
      return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
    } 
    return seconds === 1 ? '1 second ago' : `${seconds} seconds ago`;
  };

  // Function to calculate time ago for game notifications
  const calculateGameTimeAgo = (timestamp) => {
    if (!timestamp) {
      console.log('Game timestamp is missing or invalid:', timestamp);
      return 'Unknown time';
    }

    const postTime = new Date(timestamp);

    if (isNaN(postTime.getTime())) {
      console.log('Invalid game date format:', timestamp);
      return 'Invalid time';
    }

    const now = new Date();
    const diff = now - postTime;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return days === 1 ? '1 day ago' : `${days} days ago`;
    } 
    if (hours > 0) {
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    } 
    if (minutes > 0) {
      return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
    } 
    return seconds === 1 ? '1 second ago' : `${seconds} seconds ago`;
  };

  const renderNotification = ({ item }) => (
  <View style={styles.notification}>
    <Icon
      name={item.type === 'hazard' ? 'warning' : 'gamepad'}
      size={30}
      color={item.type === 'hazard' ? 'red' : 'green'}
      style={styles.icon}
    />
    <Image
      source={{ uri: item.type === 'hazard' ? item.imageURL : item.photoURL || 'https://via.placeholder.com/50' }}
      style={styles.profileImage}
    />
    <View style={styles.textContainer}>
      <Text style={styles.title}>{item.displayName || 'System'}</Text>
      {item.type === 'game' && <Text style={styles.body}>Scores {item.score} playing RoadGuard Racer</Text>}
      {item.type === 'hazard' && <Text style={styles.body}>{item.body}</Text>}
      <Text style={styles.time}>
        {item.type === 'hazard'
          ? calculateHazardTimeAgo(item.timestamp)
          : calculateGameTimeAgo(item.timestamp)}
      </Text>
    </View>
  </View>
);


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.button, notificationType === 'hazard' && styles.activeButton]}
          onPress={() => setNotificationType('hazard')}
        >
          <Icon name="warning" size={30} color={notificationType === 'hazard' ? '#FFF' : '#000'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, notificationType === 'game' && styles.activeButton]}
          onPress={() => setNotificationType('game')}
        >
          <Icon name="gamepad" size={30} color={notificationType === 'game' ? '#FFF' : '#000'} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchNotifications}
          />
        }
      />
      <NavBar navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    padding: 10,
  },
  activeButton: {
    backgroundColor: '#E0C55B',
    borderRadius: 50,
    padding: 10,
  },
  icon: {
    alignSelf: 'center',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  notification: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
    backgroundColor: '#FFF',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: 15,
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  body: {
    fontSize: 14,
    color: '#333',
  },
  time: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
  listContent: {
    paddingBottom: 80,
  },
});

export default NotificationsScreen;
