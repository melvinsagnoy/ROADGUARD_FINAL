import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, FlatList, Image } from 'react-native';
import { ref, set, onValue } from 'firebase/database';
import { firestore, auth, database } from '../firebaseConfig'; // Ensure proper exports
import { doc, getDoc } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/FontAwesome'; // Import the Icon component

const CommentModal = ({ visible, onClose, postId }) => {
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // Track which comment is being replied to
  const [showReplyInput, setShowReplyInput] = useState(null); // Manage reply input visibility for each comment
  const [expandedReplies, setExpandedReplies] = useState({}); // Manage expanded replies state

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
          createdAt: data[key].createdAt, // Keep as timestamp
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
          replies: {} // Initialize replies field
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

  const handleReplySubmit = async (parentId) => {
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

        // Use a Unix timestamp as reply ID
        const replyId = Date.now().toString(); // Converts to string to avoid non-numeric characters

        const replyRef = ref(database, `posts/${postId}/comments/${parentId}/replies/${replyId}`);

        await set(replyRef, {
          text: comment,
          createdAt: Date.now(),
          displayName: userData.displayName || 'Anonymous',
          profileImage: userData.photoURL || '',
        });

        console.log('Reply added successfully.');
        setComment('');
        setReplyingTo(null); // Reset replying state
        setShowReplyInput(null); // Hide reply input
        setSuccessMessage('Reply added successfully!');
        onClose();

        setTimeout(() => {
          setSuccessMessage('');
          console.log('Success message cleared.');
        }, 3000);
      } catch (error) {
        console.error('Error adding reply:', error.message || error);
      }
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString(); // Adjust format as needed
  };

  const renderReply = ({ item }) => (
    <View style={styles.replyContainer}>
      <View style={styles.replyHeader}>
        {item.profileImage ? (
          <Image
            source={{ uri: item.profileImage }}
            style={styles.profileImage}
            onError={(error) => console.error('Image Load Error:', error.nativeEvent.error)}
          />
        ) : (
          <View style={styles.profileImagePlaceholder} />
        )}
        <View style={styles.replyContent}>
          <Text style={styles.replyAuthor}>{item.displayName || 'Anonymous'}</Text>
          <Text style={styles.replyText}>{item.text}</Text>
          <Text style={styles.replyTime}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
    </View>
  );

  const renderComment = ({ item }) => {
    // Get replies and limit to 3
    const replies = Object.values(item.replies || {});
    const visibleReplies = expandedReplies[item.id] ? replies : replies.slice(0, 3);

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
          <View style={styles.commentContent}>
            <Text style={styles.commentAuthor}>{item.displayName || 'Anonymous'}</Text>
            <Text style={styles.commentText}>{item.text}</Text>
            <Text style={styles.commentTime}>{formatDate(item.createdAt)}</Text>
            <TouchableOpacity
              style={styles.replyButton}
              onPress={() => {
                if (showReplyInput === item.id) {
                  setShowReplyInput(null); // Hide reply input if already open
                } else {
                  setReplyingTo(item.id);
                  setShowReplyInput(item.id); // Manage reply input visibility for the selected comment
                }
              }}
            >
              <Text style={styles.replyButtonText}>Reply</Text>
            </TouchableOpacity>
            {showReplyInput === item.id && (
              <View style={styles.replyInputContainer}>
                {replyingTo && (
                  <Text style={styles.replyToLabel}>Replying to {item.displayName || 'Anonymous'}</Text>
                )}
                <View style={styles.replyInputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Write a reply..."
                    value={comment}
                    onChangeText={setComment}
                  />
                  <TouchableOpacity
                    style={styles.sendButton}
                    onPress={() => handleReplySubmit(item.id)}
                  >
                    <Icon name="send" size={20} color="#E0C55B" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {item.replies && (
              <>
                <FlatList
                  data={visibleReplies}
                  renderItem={renderReply}
                  keyExtractor={(reply) => reply.createdAt.toString()} // Unique key based on timestamp
                  style={styles.repliesList}
                />
                {replies.length > 3 && (
                  <TouchableOpacity
                    onPress={() => setExpandedReplies(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                    style={styles.viewMoreRepliesButton}
                  >
                    <Text style={styles.viewMoreRepliesText}>
                      {expandedReplies[item.id] ? 'View Less Replies' : 'View More Replies'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return <Text>Loading...</Text>;
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.commentsList}
          />
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Write a comment..."
              value={comment}
              onChangeText={setComment}
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSubmit}
            >
              <Icon name="send" size={20} color="#E0C55B" />
            </TouchableOpacity>
          </View>
          {successMessage ? <Text style={styles.successMessage}>{successMessage}</Text> : null}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Close</Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  commentContainer: {
    marginBottom: 15,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentContent: {
    marginLeft: 10,
    flex: 1,
  },
  commentAuthor: {
    fontWeight: 'bold',
  },
  commentText: {
    marginVertical: 5,
  },
  commentTime: {
    fontSize: 12,
    color: '#888',
  },
  replyButton: {
    marginTop: 5,
    paddingVertical: 5,
  },
  replyButtonText: {
    color: '#007BFF',
  },
  replyContainer: {
    marginLeft: 20,
    marginTop: 10,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  replyContent: {
    marginLeft: 10,
    flex: 1,
  },
  replyAuthor: {
    fontWeight: 'bold',
  },
  replyText: {
    marginVertical: 5,
  },
  replyTime: {
    fontSize: 12,
    color: '#888',
  },
  replyInputContainer: {
    marginTop: 10,
  },
  replyInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyToLabel: {
    fontStyle: 'italic',
    marginBottom: 5,
  },
  textInput: {
    flex: 1,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
  },
  sendButton: {
    padding: 10,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profileImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ddd',
  },
  commentsList: {
    marginBottom: 20,
  },
  viewMoreRepliesButton: {
    marginTop: 10,
  },
  viewMoreRepliesText: {
    color: '#007BFF',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  successMessage: {
    color: 'green',
    marginTop: 10,
  },
  closeButton: {
    marginTop: 20,
  },
  closeButtonText: {
    color: '#007BFF',
  },
});

export default CommentModal;
