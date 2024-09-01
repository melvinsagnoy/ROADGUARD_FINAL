import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Image, Alert, Modal, Button } from 'react-native';
import { ref, onValue, push, set, get } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { database } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons'; // Import icons

const getCurrentUserEmail = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  return user ? user.email : null;
};

const uploadImageToStorage = async (uri) => {
  const storage = getStorage();
  const response = await fetch(uri);
  const blob = await response.blob();
  const imageRef = storageRef(storage, `chat-images/${Date.now()}`);
  await uploadBytes(imageRef, blob);
  const imageUrl = await getDownloadURL(imageRef);
  return imageUrl;
};

const ChatScreen = ({ route }) => {
  const { chatId } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserEmail, setCurrentUserEmail] = useState(getCurrentUserEmail());
  const [chatDetails, setChatDetails] = useState({});
  const [replyTo, setReplyTo] = useState(null);
  const [imagePreviewUri, setImagePreviewUri] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const messagesRef = ref(database, `chats/${chatId}/messages`);

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messageList = Object.entries(data).map(([id, message]) => ({ id, ...message }));
        messageList.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setMessages(messageList);
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    const chatRef = ref(database, `chats/${chatId}`);
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      setChatDetails(data || {});
    });

    return () => unsubscribe();
  }, [chatId]);

  const handleSend = async () => {
  if (newMessage.trim() || imagePreviewUri) {
    try {
      let imageUrl = null;
      if (imagePreviewUri) {
        imageUrl = await uploadImageToStorage(imagePreviewUri);
      }

      // Set the message text to 'Sent a Photo' if an image is included
      const messageText = imagePreviewUri ? 'Sent a Photo' : newMessage;

      const messageData = {
        text: messageText,
        image: imageUrl,
        senderEmail: currentUserEmail,
        timestamp: new Date().toISOString(),
        replyTo: replyTo ? replyTo.id : null,
      };

      const messagesRef = ref(database, `chats/${chatId}/messages`);
      const newMessageRef = push(messagesRef);
      await set(newMessageRef, messageData);

      const chatRef = ref(database, `chats/${chatId}`);
      const chatSnapshot = await get(chatRef);
      const chatData = chatSnapshot.val();

      await set(chatRef, {
        ...chatData,
        lastMessage: {
          ...messageData,
          timestamp: new Date().toISOString(),
        },
      });

      setNewMessage('');
      setImagePreviewUri(null);
      setReplyTo(null);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
};

  const handleReply = (message) => {
    setNewMessage(`Replying to: ${message.text}`);
    setReplyTo(message);
  };

  const handleSelectImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need access to your media library to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const { uri } = result.assets[0];
      setImagePreviewUri(uri);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need access to your camera to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const { uri } = result.assets[0];
      setImagePreviewUri(uri);
    }
  };

  const formatTime = (timestamp) => {
    return formatDistanceToNow(parseISO(timestamp), { addSuffix: true });
  };

  const openImageModal = (uri) => {
    setSelectedImageUri(uri);
    setModalVisible(true);
  };

  const saveImage = async () => {
    if (selectedImageUri) {
      try {
        const fileUri = FileSystem.documentDirectory + `chat-image-${Date.now()}.jpg`;
        const response = await fetch(selectedImageUri);
        const blob = await response.blob();
        await FileSystem.writeAsStringAsync(fileUri, blob, { encoding: FileSystem.EncodingType.Base64 });
        Alert.alert('Image saved', 'The image has been saved to your device.');
      } catch (error) {
        console.error('Error saving image:', error);
        Alert.alert('Error', 'Unable to save the image.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{chatDetails.name || 'Chat'}</Text>
        <Image source={{ uri: chatDetails.photoURL || 'default_photo_url' }} style={styles.headerImage} />
      </View>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View>
            {item.replyTo && (
              <View style={styles.replyContainer}>
                <Text style={styles.replyText}>Replying to: {messages.find(msg => msg.id === item.replyTo)?.text}</Text>
              </View>
            )}
            <TouchableOpacity
              onLongPress={() => handleReply(item)}
              onPress={() => item.image && openImageModal(item.image)}
            >
              <View
                style={[
                  styles.message,
                  {
                    alignSelf: item.senderEmail === currentUserEmail ? 'flex-end' : 'flex-start',
                    backgroundColor: item.image ? 'transparent' : (item.senderEmail === currentUserEmail ? '#E0C55B' : '#FFF'),
                  },
                ]}
              >
                {item.text && <Text style={[
                  styles.messageText,
                  { color: item.senderEmail === currentUserEmail ? '#000' : '#000' }
                ]}>{item.text}</Text>}
                {item.image && <Image source={{ uri: item.image }} style={styles.messageImage} />}
                <Text style={styles.messageTimestamp}>{formatTime(item.timestamp)}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      />
      <View style={styles.inputContainer}>
        {replyTo && (
          <View style={styles.replyPreview}>
            <Text style={styles.replyPreviewText}>Replying to: {replyTo.text}</Text>
          </View>
        )}
        {imagePreviewUri && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: imagePreviewUri }} style={styles.imagePreview} />
            <TouchableOpacity onPress={() => setImagePreviewUri(null)} style={styles.removeImageButton}>
              <Text style={styles.removeImageButtonText}>❌</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity onPress={handleTakePhoto} style={styles.imageButton}>
          <Text style={styles.imageButtonText}>📸</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSelectImage} style={styles.imageButton}>
          <Text style={styles.imageButtonText}>🖼️</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message"
        />
        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
      {/* Image preview modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Image source={{ uri: selectedImageUri }} style={styles.modalImage} />
          <TouchableOpacity onPress={saveImage} style={styles.saveButton}>
            <FontAwesome name="save" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 18,
    color: '#007BFF',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 10,
  },
  message: {
    padding: 10,
    borderRadius: 25,
    margin: 5,
    maxWidth: '80%',
  },
  messageText: {
    fontSize: 13,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginTop: 5,
  },
  messageTimestamp: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#F5F5F5',
  },
  input: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 24,
    padding: 10,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#007BFF',
    borderRadius: 15,
    marginLeft: 10,
  },
  sendButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
  replyContainer: {
    padding: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    margin: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#007BFF',
  },
  replyText: {
    fontSize: 12,
    color: '#555',
  },
  replyPreview: {
    padding: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    marginBottom: 5,
  },
  replyPreviewText: {
    fontSize: 12,
    color: '#000',
  },
  imageButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  imageButtonText: {
    fontSize: 24,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  removeImageButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 5,
  },
  removeImageButtonText: {
    fontSize: 18,
    color: '#FF0000',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 20,
  },
  modalImage: {
    width: '100%',
    height: '80%',
    resizeMode: 'contain',
  },
  saveButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: '#007BFF',
    borderRadius: 50,
    padding: 10,
  },
  closeButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#FF0000',
    borderRadius: 50,
    padding: 10,
  },
});

export default ChatScreen;