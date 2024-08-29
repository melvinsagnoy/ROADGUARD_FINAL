import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, firestore, storage } from '../firebaseConfig';
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';

const ProfileUpdateScreen = ({ navigation }) => {
  const [displayName, setDisplayName] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [newProfileImageUri, setNewProfileImageUri] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      const userEmail = auth.currentUser.email;
      const userRef = doc(firestore, 'users', userEmail);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        setDisplayName(userData.displayName || '');
        setImageUri(userData.photoURL || '');
      } else {
        // Document doesn't exist, handle accordingly
        console.log('No such document!');
      }
    };

    fetchUserData();
  }, []);

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
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `images/${auth.currentUser.email}`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleUpdateProfile = async () => {
  try {
    const userEmail = auth.currentUser.email;
    const userRef = doc(firestore, 'users', userEmail);
    const docSnap = await getDoc(userRef);

    // Check if the document exists
    if (!docSnap.exists()) {
      // If the document doesn't exist, create it with initial values
      await setDoc(userRef, {
        displayName: displayName || '',
        photoURL: imageUri || '',
      });
    } else {
      // Update existing document
      if (displayName) {
        await updateDoc(userRef, { displayName: displayName });
      }
      if (newProfileImageUri) {
        const downloadURL = await uploadImage(newProfileImageUri);
        await updateDoc(userRef, { photoURL: downloadURL });
        setImageUri(downloadURL); // Update state to reflect the new profile image
      }
    }

    Alert.alert('Success', 'Profile updated successfully!');
    navigation.navigate('Home'); // Navigate to Home screen
  } catch (error) {
    console.error('Error updating profile:', error);
    Alert.alert('Error', 'Failed to update profile.');
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Update Profile</Text>

      <View style={styles.imageContainer}>
        {newProfileImageUri ? (
          <Image source={{ uri: newProfileImageUri }} style={styles.imagePreview} />
        ) : (
          <Image
            source={{ uri: imageUri || 'https://via.placeholder.com/100' }}
            style={styles.imagePreview}
          />
        )}
      </View>
      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>Pick an Image</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Enter new display name"
        value={displayName}
        onChangeText={setDisplayName}
      />

      <TouchableOpacity style={styles.button} onPress={handleUpdateProfile}>
        <Text style={styles.buttonText}>Update Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#545151', // Assuming this is your background color
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF', // Assuming this is your text color
    marginBottom: 20,
  },
  imageContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#dcdcdc', // Placeholder background color
    borderWidth: 2,
    borderColor: '#ccc', // Assuming this is your border color
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd', // Assuming this is your input border color
    borderRadius: 5,
    marginBottom: 20,
    backgroundColor: '#fff', // Assuming this is your input background color
  },
  button: {
    backgroundColor: '#E0C55B', // Assuming this is your button color
    padding: 15,
    borderRadius: 5,
    marginVertical: 10,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
  },
});

export default ProfileUpdateScreen;
