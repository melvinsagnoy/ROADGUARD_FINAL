import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
  Text,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { getAuth, updateProfile, onAuthStateChanged } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'react-native-image-picker';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const auth = getAuth();
  const storage = getStorage();
  const [user, setUser] = useState(null);
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [isChangePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [imageUri, setImageUri] = useState(null); // State to store selected image URI
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setLoading(false);
      } else {
        setUser(null);
        navigation.navigate('Login');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, navigation]);

  const handleEditProfile = async () => {
    if (user) {
      try {
        await updateProfile(user, {
          displayName: newName,
          email: newEmail,
        });
        Alert.alert('Success', 'Profile updated successfully');
        setEditModalVisible(false);
      } catch (error) {
        Alert.alert('Error', error.message);
      }
    }
  };

  const handleLogout = () => {
    auth.signOut().then(() => {
      navigation.navigate('Login');
    }).catch((error) => {
      console.error('Error logging out:', error);
    });
  };

  const handleImageUpdate = async (imageUrl) => {
    try {
      await updateProfile(user, { photoURL: imageUrl });
      Alert.alert('Success', 'Profile image updated successfully');
    } catch (error) {
      console.error('Error updating image:', error);
      Alert.alert('Error', 'Failed to update image.');
    }
  };

  const pickImage = async () => {
    try {
      const options = {
        mediaType: 'photo',
        quality: 1,
      };

      ImagePicker.launchImageLibrary(options, async (response) => {
        if (response.didCancel) {
          console.log('User canceled image picker');
          return;
        }

        if (response.error) {
          throw new Error(`Image Picker Error: ${response.error}`);
        }

        if (response.assets && response.assets.length > 0) {
          const imageUri = response.assets[0].uri;
          setImageUri(imageUri); // Update state with the picked image URI
          await uploadImageToFirebase(imageUri);
        } else {
          throw new Error("No assets found in response");
        }
      });
    } catch (error) {
      console.error('Error picking image:', error.message);
      Alert.alert('Error', `Failed to pick image. Reason: ${error.message}`);
    }
  };

  const uploadImageToFirebase = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const imageRef = ref(storage, `profileImages/${auth.currentUser.uid}`);
      await uploadBytes(imageRef, blob);

      const downloadURL = await getDownloadURL(imageRef);
      handleImageUpdate(downloadURL);
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.card}>
          <View style={styles.infoContainer}>
            <View style={styles.titleContainer}>
              <Text style={styles.titleText}>PROFILE INFORMATION</Text>
            </View>
            <View style={styles.infoRow}>
              <FontAwesome name="user" size={24} color="#E0C55B" />
              <Text style={styles.text}> {user.displayName}</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(true)}>
                <Text style={styles.editProfileText}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.infoRow}>
              <FontAwesome name="envelope" size={24} color="#E0C55B" />
              <Text style={styles.text}> {user.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <FontAwesome name="lock" size={24} color="#E0C55B" />
              <Text style={styles.text}> {'********'}</Text>
              <TouchableOpacity onPress={() => setChangePasswordModalVisible(true)}>
                <Text style={styles.changePasswordText}>Change</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
              <Text style={styles.uploadButtonText}>Upload Image</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={isEditModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TextInput
              style={styles.input}
              placeholder="New Name"
              value={newName}
              onChangeText={setNewName}
            />
            <TextInput
              style={styles.input}
              placeholder="New Email"
              value={newEmail}
              onChangeText={setNewEmail}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleEditProfile}
              >
                <Text style={styles.modalButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isChangePasswordModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setChangePasswordModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Current Password"
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder="New Password"
              secureTextEntry
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setChangePasswordModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                // onPress={handleChangePassword} // Add your password change logic here
              >
                <Text style={styles.modalButtonText}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20, // Adjust padding as needed
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginBottom: 20,
    padding: 15,
    width: width * 0.9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  titleContainer: {
    marginBottom: 10,
    alignSelf: 'center',
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    marginLeft: 10,
  },
  editProfileText: {
    marginLeft: 10,
    color: '#007BFF',
  },
  changePasswordText: {
    marginLeft: 10,
    color: '#007BFF',
  },
  logoutButton: {
    backgroundColor: '#FF6347',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
  uploadButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 20,
  },
  uploadButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#CCC',
    marginBottom: 15,
    padding: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileScreen;
