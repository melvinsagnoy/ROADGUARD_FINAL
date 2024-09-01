import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Image, Modal, FlatList, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth, firestore, storage } from '../firebaseConfig';
import { doc, getDoc, updateDoc, setDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import NavBar from './NavBar';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [newName, setNewName] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [newProfileImageUri, setNewProfileImageUri] = useState('');
  const [points, setPoints] = useState(0);
  const [needsNameUpdate, setNeedsNameUpdate] = useState(false);
const [needsImageUpdate, setNeedsImageUpdate] = useState(false);
const [isProfileComplete, setIsProfileComplete] = useState(false);
const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(async (user) => {
    if (user) {
      setUser(user);
      setLoading(true);

      try {
        await AsyncStorage.setItem('userEmail', user.email);
        const userData = await fetchUserData(user.email);
        setUser((prevUser) => ({ ...prevUser, displayName: userData.displayName, photoURL: userData.photoURL }));
        setImageUri(userData.photoURL || 'https://via.placeholder.com/100'); // Default image URL
        setPhoneNumber(userData.phoneNumber || 'Not Provided'); // Set phone number
        setPoints(calculateTotalPoints(userData.scores));

        // Check if initial setup is required
        checkInitialSetup();
      } catch (error) {
        console.error('Error setting user credentials:', error);
      }

      setLoading(false);
    } else {
      setUser(null);
      setLoading(false);
      navigation.navigate('Landing');
    }
  });

  return () => unsubscribe();
}, [navigation]);

  const fetchUserData = async (email) => {
  const userRef = doc(firestore, 'users', email);
  const docSnap = await getDoc(userRef);
  if (docSnap.exists()) {
    console.log('User data fetched:', docSnap.data());
    return docSnap.data();
  } else {
    console.log('No user data found for:', email);
    return {};
  }
};

  const checkInitialSetup = async () => {
  try {
    const userRef = doc(firestore, 'users', auth.currentUser.email);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      const nameComplete = !!userData.displayName;
      const imageComplete = !!userData.photoURL;

      setNeedsNameUpdate(!nameComplete);
      setNeedsImageUpdate(!imageComplete);
      setIsProfileComplete(nameComplete && imageComplete);

      if (!nameComplete || !imageComplete) {
        setEditMode(true); // Show profile update modal
      }
    }
  } catch (error) {
    console.error('Error checking initial setup:', error);
  }
};

  const calculateTotalPoints = (scores) => {
    if (!scores || !Array.isArray(scores)) return 0;
    return scores.reduce((total, scoreEntry) => total + scoreEntry.score, 0);
  };

  const fetchLeaderboardData = async () => {
    try {
      const leaderboardQuery = query(
        collection(firestore, 'users'),
        orderBy('scores', 'desc')
      );

      const leaderboardSnapshot = await getDocs(leaderboardQuery);
      const leaderboard = [];

      leaderboardSnapshot.forEach((doc) => {
        const data = doc.data();
        const highestScore = Math.max(...data.scores.map(score => score.score), 0); // Safeguard in case of empty scores
        leaderboard.push({
          displayName: data.displayName || 'Anonymous',
          score: highestScore,
        });
      });

      leaderboard.sort((a, b) => b.score - a.score); // Sort leaderboard data by score descending
      setLeaderboardData(leaderboard);
      setLeaderboardVisible(true);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userEmail');
      auth.signOut().then(() => {
        navigation.navigate('Login');
      }).catch((error) => {
        console.error('Error logging out:', error);
      });
    } catch (error) {
      console.error('Error clearing user credentials:', error);
    }
  };

  const updateDisplayName = async () => {
    try {
      const email = auth.currentUser.email;
      const userRef = doc(firestore, 'users', email);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        await updateDoc(userRef, {
          displayName: newName,
        });
        setUser({ ...user, displayName: newName });
        Alert.alert('Success', 'Display name updated successfully!');
      } else {
        await setDoc(userRef, {
          displayName: newName,
        });
        setUser({ ...user, displayName: newName });
        Alert.alert('Success', 'Display name added successfully!');
      }
    } catch (error) {
      console.error('Error updating display name:', error);
      Alert.alert('Error', 'Failed to update display name.');
    }
  };

  const pickImage = async () => {
  try {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const pickedImageUri = result.assets[0].uri;
      setNewProfileImageUri(pickedImageUri);

      const downloadURL = await uploadImage(pickedImageUri);
      await updateProfileImage(downloadURL);
    } else {
      console.error('Image picking was cancelled or URI is undefined');
    }
  } catch (error) {
    console.error('Error picking image:', error);
    Alert.alert('Error', 'Failed to pick image.');
  }
};

const uploadImage = async (uri) => {
  try {
    console.log('Starting image upload...');
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `images/${auth.currentUser.email}`);
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    console.log('Image uploaded successfully. Download URL:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

const updateProfileImage = async (downloadURL) => {
  const email = auth.currentUser.email;
  const userRef = doc(firestore, 'users', email);

  try {
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      await updateDoc(userRef, {
        photoURL: downloadURL,
      });
      console.log('Profile image URL updated in Firestore:', downloadURL);
    } else {
      await setDoc(userRef, {
        photoURL: downloadURL,
      });
      console.log('Profile image URL set in new Firestore document:', downloadURL);
    }
    setImageUri(downloadURL);
  } catch (error) {
    console.error('Error updating profile image:', error);
  }
};
  const handleNavigation = (screen) => {
  if (isProfileComplete) {
    navigation.navigate(screen);
  } else {
    Alert.alert(
      'Profile Incomplete',
      'Please complete your profile before proceeding.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Complete Profile',
          onPress: () => setEditMode(true),
        },
      ],
      { cancelable: false }
    );
  }
};

  const saveProfileChanges = async () => {
  try {
    if (newName) {
      await updateDisplayName();
    }

    if (newProfileImageUri) {
      const downloadURL = await uploadImage(newProfileImageUri);
      await updateProfileImage(downloadURL);
    }

    // Check if profile is complete
    const userData = await fetchUserData(auth.currentUser.email);
    const nameComplete = !!userData.displayName;
    const imageComplete = !!userData.photoURL;
    if (nameComplete && imageComplete) {
      setEditMode(false);
      setIsProfileComplete(true);
      Alert.alert('Success', 'Profile updated successfully!');
    } else {
      setIsProfileComplete(false);
      Alert.alert('Error', 'Please complete all profile fields.');
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    Alert.alert('Error', 'Failed to update profile.');
  }
};

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>ROADGUARD</Text>
        <TouchableOpacity onPress={handleLogout}>
          <FontAwesome name="cog" size={24} color="black" />
        </TouchableOpacity>
      </View>
      <View style={styles.profileCard}>
        <TouchableOpacity onPress={pickImage}>
          <Image source={{ uri: newProfileImageUri || imageUri }} style={styles.profileImage} />
        </TouchableOpacity>
        <Text style={styles.name}>{user.displayName || 'No Name'}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <Text style={styles.phoneNumber}>{phoneNumber}</Text>
        <Text style={styles.points}>{points} points</Text>
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleNavigation('RewardsScreen')}
        >
          <Text style={styles.buttonText}>Redeem Rewards</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => handleNavigation('SubscriptionScreen')}>
          <Text style={styles.buttonText}>Subscribe</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.options}>
        <TouchableOpacity style={styles.option} onPress={() => setEditMode(true)}>
          <FontAwesome name="user" size={24} color="black" />
          <Text style={styles.optionText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={fetchLeaderboardData}>
          <FontAwesome name="star" size={24} color="black" />
          <Text style={styles.optionText}>Leaderboards</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.option}
          onPress={() => navigation.navigate('ChatList')} // Use 'ChatList' not 'ChatListScreen'
        >
          <FontAwesome name="comments" size={24} color="black" />
          <Text style={styles.optionText}>Chats</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.option}
          onPress={handleLogout}
        >
          <FontAwesome name="sign-out" size={24} color="black" />
          <Text style={styles.optionText}>Log out</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={leaderboardVisible}
        onRequestClose={() => setLeaderboardVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.leaderboardModal}>
            <Text style={styles.modalTitle}>Leaderboard</Text>
            <FlatList
              data={leaderboardData}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => (
                <View style={styles.leaderboardItem}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                  <Text style={styles.leaderboardText}>{item.displayName}</Text>
                  <Text style={styles.leaderboardText}>{item.score}</Text>
                </View>
              )}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setLeaderboardVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
  animationType="slide"
  transparent={true}
  visible={editMode}
  onRequestClose={() => setEditMode(false)}
>
  <View style={styles.editProfileContainer}>
    <TextInput
      style={styles.input}
      placeholder="Enter new display name"
      value={newName}
      onChangeText={setNewName}
    />
    <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
      <Text style={styles.imageButtonText}>Change Profile Image</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.saveButton} onPress={saveProfileChanges}>
      <Text style={styles.saveButtonText}>Save</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[
        styles.cancelButton,
        { opacity: needsNameUpdate || needsImageUpdate ? 0.5 : 1 } // Adjust opacity based on profile completion
      ]}
      onPress={() => {
        if (!(needsNameUpdate || needsImageUpdate)) {
          setEditMode(false);
        }
      }}
      disabled={needsNameUpdate || needsImageUpdate} // Disable button based on profile completion
    >
      <Text style={styles.cancelButtonText}>Cancel</Text>
    </TouchableOpacity>
  </View>
</Modal>

      <NavBar navigation={navigation} isProfileComplete={isProfileComplete} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileCard: {
    backgroundColor: '#FFD700',
    alignItems: 'center',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  points: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  options: {
    width: '90%',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  optionText: {
    marginLeft: 10,
    fontSize: 16,
  },
  editProfileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  input: {
    width: '80%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#FFF',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
    width: '80%',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#FF6347',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
    width: '80%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  leaderboardModal: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  leaderboardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  leaderboardText: {
    fontSize: 18,
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#FF6347',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
  imageButton: {
  backgroundColor: '#4CAF50',
  paddingVertical: 10,
  paddingHorizontal: 20,
  borderRadius: 5,
  marginTop: 10,
  width: '80%',
  alignItems: 'center',
},
imageButtonText: {
  color: '#FFF',
  fontSize: 16,
},
phoneNumber: {
  fontSize: 16,
  color: '#555',
  marginBottom: 5,
},
sendMessageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  sendMessageText: {
    marginLeft: 10,
    fontSize: 16,
  },
});



export default ProfileScreen;
