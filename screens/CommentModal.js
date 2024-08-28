import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, FlatList, Image } from 'react-native';
import { ref, set, onValue } from 'firebase/database';
import { firestore, auth, database } from '../firebaseConfig'; // Ensure proper exports
import { doc, getDoc } from 'firebase/firestore';

const CommentModal = ({ visible, onClose, postId }) => {
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!postId) {
      console.log('No Post ID provided, exiting useEffect.');
      setComments([]);
      setLoading(false);
      return;
    }

    const commentsRef = ref(database, `posts/${postId}/comments`);

    const handleValueChange = (snapshot) => {
      const data = snapshot.val();
      console.log('Snapshot data:', data);

      if (data) {
        const commentsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
          createdAt: new Date(data[key].createdAt).toLocaleString() // Optionally format the date
        }));

        // Filter out comments with empty displayName
        const filteredComments = commentsArray.filter(comment => comment.displayName.trim() !== '');
        console.log('Filtered comments:', filteredComments);
        setComments(filteredComments);
      } else {
        console.log('No comments data found.');
        setComments([]);
      }

      setLoading(false); // Update loading state
    };

    // Attach the listener
    const unsubscribe = onValue(commentsRef, handleValueChange, (error) => {
      console.error('Error reading comments:', error.message);
      setLoading(false); // Stop loading on error
    });

    // Cleanup listener on unmount
    return () => {
      console.log('Unsubscribing from comments listener.');
      unsubscribe(); // This will remove the listener
    };
  }, [postId]);

  const handleSubmit = async () => {
  if (comment.trim()) {
    try {
      const currentUser = auth.currentUser;
      console.log('Current user:', currentUser);

      if (!currentUser) {
        console.error('No user is currently logged in.');
        return;
      }

      const userEmail = currentUser.email;
      console.log('Current user email:', userEmail);

      const userDocRef = doc(firestore, `users/${userEmail}`);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        console.error('User profile does not exist:', userEmail);
        return;
      }

      const userData = userDoc.data();
      console.log('Fetched user data:', userData);

      const newCommentRef = ref(database, `posts/${postId}/comments/${Date.now()}`);

      await set(newCommentRef, {
        text: comment,
        createdAt: Date.now(),
        displayName: userData.displayName || 'Anonymous',
        profileImage: userData.photoURL || '',
      });

      console.log('Comment added successfully.');
      setComment('');
      setSuccessMessage('Comment added successfully!');
      onClose();

      setTimeout(() => {
        setSuccessMessage('');
        console.log('Success message cleared.');
      }, 3000);
    } catch (error) {
      console.error('Error adding comment:', error.message || error);
    }
  }
};

  const renderComment = ({ item }) => {
  console.log('Rendering comment:', item);
  return (
    <View style={styles.commentContainer}>
      <View style={styles.commentHeader}>
        {item.profileImage ? (
          <Image
            source={{ uri: item.profileImage }}
            style={styles.profileImage}
            onError={(error) => console.error('Image Load Error:', error.nativeEvent.error)}
          />
        ) : (
          <View style={styles.profileImagePlaceholder} />
        )}
        <Text style={styles.commentAuthor}>{item.displayName || 'Anonymous'}</Text>
      </View>
      <Text style={styles.commentText}>{item.text}</Text>
      <Text style={styles.commentTime}>{item.createdAt}</Text>
    </View>
  );
};

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      {successMessage ? (
        <Text style={styles.successMessage}>{successMessage}</Text>
      ) : null}
          {loading ? (
            <Text>Loading comments...</Text>
          ) : (
            <FlatList
              data={comments}
              renderItem={renderComment}
              keyExtractor={(item) => item.id}
              style={styles.commentList}
            />
          )}
          <TextInput
            style={styles.textInput}
            placeholder="Add a comment..."
            value={comment}
            onChangeText={setComment}
          />
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitText}>Submit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  textInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: '#E0C55B',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  submitText: {
    color: '#000',
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 10,
    alignItems: 'center',
  },
  closeText: {
    color: '#007BFF',
  },
  commentList: {
    maxHeight: 300,
  },
  commentContainer: {
    marginBottom: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  profileImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccc',
    marginRight: 10,
  },
  commentAuthor: {
    fontWeight: 'bold',
  },
  commentText: {
    marginTop: 5,
  },
  commentTime: {
    marginTop: 5,
    color: '#888',
    fontSize: 12,
  },
  successMessage: {
    color: 'green',
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default CommentModal;