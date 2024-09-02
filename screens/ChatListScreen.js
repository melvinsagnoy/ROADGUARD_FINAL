import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Image, Alert, TouchableWithoutFeedback } from 'react-native';
import { ref, onValue, get, set, update, remove } from 'firebase/database';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { database, firestore } from '../firebaseConfig'; // Adjust path as needed
import { useNavigation } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

const sanitizeId = (id) => id.replace(/[.#$[\]]/g, '_');

const ChatListScreen = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [chats, setChats] = useState([]);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        setCurrentUserEmail(user.email);
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = collection(firestore, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const usersList = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        console.log('All Users:', usersList);
        setUsers(usersList);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchFilteredUsers = async () => {
      if (searchTerm.length > 0) {
        try {
          const usersRef = collection(firestore, 'users');
          const q = query(
            usersRef,
            where('displayName', '>=', searchTerm),
            where('displayName', '<=', searchTerm + '\uf8ff')
          );
          const querySnapshot = await getDocs(q);

          const userList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          console.log('Filtered Users:', userList);
          setFilteredUsers(userList);
          setIsDropdownVisible(true);
        } catch (error) {
          console.error('Error fetching filtered users:', error);
        }
      } else {
        setFilteredUsers([]);
        setIsDropdownVisible(false);
      }
    };

    fetchFilteredUsers();
  }, [searchTerm]);

  useEffect(() => {
    const chatsRef = ref(database, 'chats');

    const unsubscribe = onValue(chatsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const chatList = Object.entries(data)
          .map(([id, chat]) => ({ id, ...chat }))
          .filter(chat => chat.users.includes(currentUserEmail));
        console.log('Chats Data:', chatList);
        setChats(chatList);
      } else {
        setChats([]);
      }
    });

    return () => unsubscribe();
  }, [currentUserEmail]);

  const handleStartChat = async (user) => {
    try {
      const chatId = [user.id, currentUserEmail].sort().join('_');
      const sanitizedChatId = sanitizeId(chatId);
      const chatRef = ref(database, `chats/${sanitizedChatId}`);

      const chatSnapshot = await get(chatRef);

      if (!chatSnapshot.exists()) {
        await set(chatRef, {
          users: [currentUserEmail, user.id],
          name: user.displayName,
          photoURL: user.photoURL || 'default_photo_url',
          lastMessage: {
            text: '',
            senderEmail: '',
            timestamp: '',
          },
          lastReadMessageId: '',
        });
      }

      navigation.navigate('ChatScreen', { chatId: sanitizedChatId });
      setSearchTerm('');
      setIsDropdownVisible(false);
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const handleSearchChange = (text) => {
    setSearchTerm(text);
  };

  const handleChatPress = async (chatId) => {
    await update(ref(database, `chats/${chatId}`), {
      lastReadMessageId: '',
    });
    navigation.navigate('ChatScreen', { chatId });
  };

  const handleDeleteChat = async (chatId) => {
    Alert.alert(
      'Confirm Deletion',
      'This chat will be removed from your chat list but will remain in the database.',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              // Update local state to remove the chat
              const updatedChats = chats.filter(chat => chat.id !== chatId);
              setChats(updatedChats);

              // Store the deleted chat ID in AsyncStorage
              const deletedChats = JSON.parse(await AsyncStorage.getItem('deletedChats')) || [];
              if (!deletedChats.includes(chatId)) {
                deletedChats.push(chatId);
                await AsyncStorage.setItem('deletedChats', JSON.stringify(deletedChats));
              }

              console.log('Chat removed from chat list successfully');
            } catch (error) {
              console.error('Error removing chat from chat list:', error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleOutsidePress = () => {
    if (isDropdownVisible) {
      setIsDropdownVisible(false);
    }
  };

  const renderRightActions = (chatId) => {
    return (
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteChat(chatId)}
      >
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    );
  };

  const renderChatItem = ({ item }) => {
    const chatPartnerEmail = item.users.find(email => email !== currentUserEmail);
    const chatPartner = users.find(user => user.id === chatPartnerEmail);
    const photoURL = chatPartner?.photoURL || 'default_photo_url';
    const displayName = chatPartner?.displayName || 'Unknown';

    const hasNewMessages = item.lastMessage?.senderEmail !== currentUserEmail && item.lastReadMessageId !== item.lastMessage?.id;

    // Determine the message text
    let messageText = 'No messages yet';
    if (item.lastMessage?.text) {
      messageText = item.lastMessage.text;
    }
    if (item.lastMessage?.type === 'image') {
      if (item.lastMessage.senderEmail === currentUserEmail) {
        messageText = 'You Sent a Photo';
      } else {
        messageText = `${displayName} Sent a Photo`;
      }
    }

    return (
      <Swipeable renderRightActions={() => renderRightActions(item.id)}>
        <TouchableOpacity
          onPress={() => handleChatPress(item.id)}
          style={[styles.chatItem, hasNewMessages && styles.newMessageBackground]}
        >
          <Image source={{ uri: photoURL }} style={styles.userImage} />
          <View style={styles.chatInfo}>
            <Text style={styles.chatName}>{displayName}</Text>
            <Text style={styles.chatMessage}>{messageText}</Text>
          </View>
          {hasNewMessages && <View style={styles.redDot} />}
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={handleOutsidePress}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chat</Text>
        </View>
        <TextInput
          style={styles.input}
          value={searchTerm}
          onChangeText={handleSearchChange}
          placeholder="Search for users"
        />
        {isDropdownVisible && (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleStartChat(item)}
                style={styles.userItem}
              >
                <Image source={{ uri: item.photoURL || 'default_photo_url' }} style={styles.userImage} />
                <Text style={styles.userText}>{item.displayName || 'Unknown'}</Text>
              </TouchableOpacity>
            )}
            style={styles.dropdown}
          />
        )}
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginTop: 40
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
    marginLeft: -60,
    flex: 1,
    textAlign: 'center',
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 30,
    padding: 10,
    margin: 10,
    backgroundColor: '#FFF',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#FFF',
    borderRadius: 60,
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userText: {
    fontSize: 18,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#FFF',
    borderRadius: 50,
    position: 'relative',
  },
  chatInfo: {
    flex: 1,
    marginLeft: 10,
  },
  chatName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatMessage: {
    color: '#888',
  },
  dropdown: {
    position: 'absolute',
    top: 180,
    left: 10,
    right: 10,
    backgroundColor: '#FFF',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    zIndex: 1,
  },
  newMessageBackground: {
    backgroundColor: '#e0e0e0',
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'red',
    position: 'absolute',
    top: 15,
    right: 15,
  },
  deleteButton: {
    backgroundColor: '#FF4D4D',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: 50,
  },
  deleteText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default ChatListScreen;
