import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Modal, Alert, TextInput } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { getDatabase, ref, set, get } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const CreatePostModal = ({ visible, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [location, setLocation] = useState(null);
  const [displayName, setDisplayName] = useState(''); // State for display name
  const [photoURL, setPhotoURL] = useState(''); // State for photo URL

  const auth = getAuth();
  const database = getDatabase();  // Use Realtime Database
  const storage = getStorage();
  const firestore = getFirestore(); // Initialize Firestore

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required to post.');
        return;
      }

      let { coords } = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      const userEmail = auth.currentUser?.email;
      console.log('User email:', userEmail); // Log the email being used

      if (!userEmail) {
        Alert.alert('Error', 'User is not authenticated.');
        return;
      }

      try {
        const userDocRef = doc(firestore, 'users', userEmail); // Get a reference to the user document
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userDoc = userDocSnap.data();
          const name = userDoc.displayName || 'Anonymous';
          setDisplayName(name);
          setPhotoURL(userDoc.photoURL || ''); // Set photoURL
          console.log('Display Name fetched from Firestore:', name); // Log the fetched display name
          console.log('Photo URL fetched from Firestore:', userDoc.photoURL); // Log the fetched photo URL
        } else {
          setDisplayName('Anonymous');
          setPhotoURL(''); // Default photoURL if no document
          console.log('No user document found. Display Name set to Anonymous.');
        }
      } catch (error) {
        console.error('Error fetching display name and photo URL:', error);
        setDisplayName('Anonymous');
        setPhotoURL(''); // Default photoURL on error
        console.log('Error fetching display name and photo URL. Display Name set to Anonymous.');
      }
    })();
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
        setImageUri(result.assets[0].uri);
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
    const imageRef = storageRef(storage, `posts/${Date.now()}`);
    await uploadBytes(imageRef, blob);
    const downloadURL = await getDownloadURL(imageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

  const generatePostId = async () => {
  try {
    const postsRef = ref(database, 'posts');
    const postSnapshot = await get(postsRef); // Use get instead of once
    const posts = postSnapshot.val() || {};
    const postCount = Object.keys(posts).length;
    return `postId${postCount + 1}`; // Generate new ID
  } catch (error) {
    console.error('Error generating post ID:', error);
    throw error;
  }
};

  const handleSubmit = async () => {
  if (!title || !body) {
    Alert.alert('Error', 'Title and body are required.');
    return;
  }

  setUploading(true);

  try {
    let imageURL = '';
    if (imageUri) {
      imageURL = await uploadImage(imageUri);
    }

    // Request location permission and fetch location here
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Location permission is required to post.');
      return;
    }

    let { coords } = await Location.getCurrentPositionAsync({});
    const newLocation = {
      latitude: coords.latitude,
      longitude: coords.longitude,
    };

    const postId = await generatePostId(); // Generate unique post ID
    const postsRef = ref(database, `posts/${postId}`);

    await set(postsRef, {
      title,
      body,
      imageURL,
      location: newLocation, // Use the new location
      createdAt: new Date().toISOString(),
      displayName,
      photoURL,
      email: auth.currentUser.email,
    });

    Alert.alert('Success', 'Post created successfully!');
    setTitle('');
    setBody('');
    setImageUri(null);
    setLocation(null);
    onClose();
    if (onSubmit) onSubmit(); // Optionally call onSubmit if needed
  } catch (error) {
    console.error('Error creating post:', error);
    Alert.alert('Error', 'Failed to create post.');
  } finally {
    setUploading(false);
  }
};

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          )}
          <Picker
            selectedValue={title}
            style={styles.picker}
            onValueChange={(itemValue) => setTitle(itemValue)}
          >
            <Picker.Item label="Select an Issue" value="" />
            <Picker.Item label="Construction" value="Construction" />
            <Picker.Item label="Potholes" value="Potholes" />
            <Picker.Item label="Landslide" value="Landslide" />
            <Picker.Item label="Flooding" value="Flooding" />
            <Picker.Item label="Debris" value="Debris" />
            <Picker.Item label="Broken Glass" value="Broken Glass" />
            <Picker.Item label="Traffic Accidents" value="Traffic Accidents" />
            <Picker.Item label="Roadway Erosion" value="Roadway Erosion" />
            <Picker.Item label="Loose Gravel" value="Loose Gravel" />
            <Picker.Item label="Bridge Damage" value="Bridge Damage" />
          </Picker>
          <TextInput
            style={styles.input}
            placeholder="Body"
            value={body}
            onChangeText={setBody}
            multiline
          />
          <TouchableOpacity onPress={pickImage} style={styles.imageButton}>
            <Text style={styles.imageButtonText}>Select Image</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
            <Text style={styles.submitButtonText}>{uploading ? 'Uploading...' : 'Submit Post'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  picker: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  imageButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  imageButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    marginBottom: 10,
    borderRadius: 5,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginVertical: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#FF6347',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default CreatePostModal;
