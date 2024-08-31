import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { getDatabase, ref, onValue, push, set, serverTimestamp } from 'firebase/database';
import { auth } from '../firebaseConfig';

const sanitizePath = (path) => path.replace(/[.#$[\]]/g, '_');

const ChatScreen = ({ route, navigation }) => {
  const { recipient } = route.params;
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [scrolling, setScrolling] = useState(true); // Track if user is at the bottom
  const db = getDatabase();
  const scrollViewRef = useRef(null);

  useEffect(() => {
    const userEmail = auth.currentUser.email;
    const sanitizedEmail = sanitizePath(userEmail);
    const sanitizedRecipientId = sanitizePath(recipient.id);
    const chatId = [sanitizedEmail, sanitizedRecipientId].sort().join('_');

    const messagesRef = ref(db, `chats/${chatId}`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setMessages(msgList);
        if (scrolling) {
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [recipient.id, db, scrolling]);

  const handleSend = async () => {
    if (!message.trim()) {
      return;
    }

    setSending(true);

    try {
      const userEmail = auth.currentUser.email;
      const sanitizedEmail = sanitizePath(userEmail);
      const sanitizedRecipientId = sanitizePath(recipient.id);
      const chatId = [sanitizedEmail, sanitizedRecipientId].sort().join('_');
      const messagesRef = ref(db, `chats/${chatId}`);
      
      const newMessageRef = push(messagesRef);
      await set(newMessageRef, {
        senderId: sanitizedEmail,
        content: message,
        timestamp: serverTimestamp()
      });

      setMessage('');
      Keyboard.dismiss();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyboardDismiss = () => {
    Keyboard.dismiss();
  };

  const handleScroll = (event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 50; // Adjust tolerance as needed
    setScrolling(isAtBottom);
  };

  const renderMessageItem = (item) => {
    const isSentByCurrentUser = item.senderId === sanitizePath(auth.currentUser.email);

    return (
      <View
        key={item.id}
        style={[
          styles.messageItem,
          isSentByCurrentUser ? styles.sentMessage : styles.receivedMessage,
        ]}
      >
        <View style={styles.messageBubble}>
          <Text style={styles.messageText}>{item.content}</Text>
          <Text style={styles.messageTimestamp}>
            {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : ''}
          </Text>
        </View>
        {isSentByCurrentUser ? (
          auth.currentUser.photoURL ? (
            <Image source={{ uri: auth.currentUser.photoURL }} style={styles.messagePhoto} />
          ) : null
        ) : (
          recipient.photoURL ? (
            <Image source={{ uri: recipient.photoURL }} style={styles.messagePhoto} />
          ) : null
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={handleKeyboardDismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inner}
        >
          <View style={styles.header}>
            {recipient.photoURL ? (
              <Image
                source={{ uri: recipient.photoURL }}
                style={styles.userPhoto}
              />
            ) : (
              <View style={styles.userPhotoPlaceholder} />
            )}
            <Text style={styles.headerText}>{recipient.displayName || 'Unnamed User'}</Text>
          </View>
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onContentSizeChange={() => {
              if (scrolling) {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }
            }}
          >
            {messages.length === 0 ? (
              <Text style={styles.emptyText}>No messages yet</Text>
            ) : (
              messages.map(renderMessageItem)
            )}
          </ScrollView>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Type a message..."
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, sending && styles.sendingButton]}
              onPress={handleSend}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.sendButtonText}>Send</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E5E5',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
    backgroundColor: '#E5E5E5',
  },
  userPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
  },
  userPhotoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ddd',
    marginRight: 15,
  },
  headerText: {
    fontSize: 18,
    color: '#333',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingBottom: 10,
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 20,
    maxWidth: '75%',
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#E0C55B',
    borderRadius: 20,
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
    borderColor: '#ddd',
    borderRadius: 20,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    color: '#000',
  },
  messageTimestamp: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
    marginTop: 5,
  },
  messagePhoto: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopColor: '#ddd',
    borderTopWidth: 1,
    backgroundColor: '#E5E5E5',
  },
  textInput: {
    flex: 1,
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    backgroundColor: '#FFF',
  },
  sendButton: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: '#E0C55B',
    borderRadius: 20,
  },
  sendingButton: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
});

export default ChatScreen;
