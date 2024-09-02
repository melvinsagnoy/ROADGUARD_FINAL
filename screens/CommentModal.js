import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, FlatList, Image, ActivityIndicator } from 'react-native';
import { ref, set, onValue } from 'firebase/database';
import { firestore, auth, database } from '../firebaseConfig'; // Ensure proper exports
import { doc, getDoc } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/FontAwesome';

const CommentModal = ({ visible, onClose, postId }) => {
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // Track which comment is being replied to
  const [showReplyInput, setShowReplyInput] = useState(null); // Manage reply input visibility for each comment
  const [expandedReplies, setExpandedReplies] = useState({}); // Manage expanded replies state
  const [commentLoading, setCommentLoading] = useState(false); // Loading state for submitting a comment
  const [replyLoading, setReplyLoading] = useState({}); // Loading state for submitting a reply (per comment)

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
      setCommentLoading(true); // Start loading

      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.error('No user is currently logged in.');
          setCommentLoading(false); // Stop loading
          return;
        }

        const userEmail = currentUser.email;
        const userDocRef = doc(firestore, `users/${userEmail}`);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          console.error('User profile does not exist:', userEmail);
          setCommentLoading(false); // Stop loading
          return;
        }

        const userData = userDoc.data();
        const newCommentRef = ref(database, `posts/${postId}/comments/${Date.now()}`);

        await set(newCommentRef, {
          text: comment,
          createdAt: Date.now(),
          displayName: userData.displayName || 'Anonymous',
          profileImage: userData.photoURL || '',
          replies: {} // Initialize replies field
        });

        setComment('');
        setSuccessMessage('Comment added successfully!');
        onClose();

        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } catch (error) {
        console.error('Error adding comment:', error.message || error);
      } finally {
        setCommentLoading(false); // Stop loading
      }
    }
  };

  const handleReplySubmit = async (parentId) => {
    if (comment.trim()) {
      setReplyLoading(prev => ({ ...prev, [parentId]: true })); // Start loading for this reply

      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.error('No user is currently logged in.');
          setReplyLoading(prev => ({ ...prev, [parentId]: false })); // Stop loading
          return;
        }

        const userEmail = currentUser.email;
        const userDocRef = doc(firestore, `users/${userEmail}`);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          console.error('User profile does not exist:', userEmail);
          setReplyLoading(prev => ({ ...prev, [parentId]: false })); // Stop loading
          return;
        }

        const userData = userDoc.data();
        const replyId = Date.now().toString(); // Use a Unix timestamp as reply ID

        const replyRef = ref(database, `posts/${postId}/comments/${parentId}/replies/${replyId}`);

        await set(replyRef, {
          text: comment,
          createdAt: Date.now(),
          displayName: userData.displayName || 'Anonymous',
          profileImage: userData.photoURL || '',
        });

        setComment('');
        setReplyingTo(null); // Reset replying state
        setShowReplyInput(null); // Hide reply input
        setSuccessMessage('Reply added successfully!');
        onClose();

        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } catch (error) {
        console.error('Error adding reply:', error.message || error);
      } finally {
        setReplyLoading(prev => ({ ...prev, [parentId]: false })); // Stop loading
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
                    disabled={replyLoading[item.id]} // Disable button when loading
                  >
                    {replyLoading[item.id] ? (
                      <ActivityIndicator size="small" color="#007AFF" />
                    ) : (
                      <Icon name="send" size={20} color="#007AFF" />
                    )}
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
                    style={styles.viewMoreButton}
                    onPress={() => {
                      setExpandedReplies(prevState => ({
                        ...prevState,
                        [item.id]: !prevState[item.id], // Toggle expansion state for the selected comment
                      }));
                    }}
                  >
                    <Text style={styles.viewMoreText}>
                      {expandedReplies[item.id] ? 'View Less' : `View ${replies.length - 3} More Replies`}
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

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
    >
      <View style={styles.container}>
        <Text style={styles.title}>Comments</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : (
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<Text style={styles.noCommentsText}>No comments yet.</Text>}
          />
        )}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Write a comment..."
            value={comment}
            onChangeText={setComment}
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSubmit}
            disabled={commentLoading} // Disable button when loading
          >
            {commentLoading ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Icon name="send" size={20} color="#007AFF" />
            )}
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 20,
  },
  commentContainer: {
    marginBottom: 15,
    backgroundColor: '#f2f2f2',
    padding: 10,
    borderRadius: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  commentContent: {
    flex: 1,
  },
  commentAuthor: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  commentText: {
    color: '#000000',
    marginTop: 5,
  },
  commentTime: {
    fontSize: 12,
    color: '#666666',
    marginTop: 5,
  },
  replyButton: {
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  replyButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
  replyContainer: {
    marginTop: 10,
    paddingLeft: 50,
    borderLeftWidth: 2,
    borderLeftColor: '#007AFF',
    paddingVertical: 5,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  replyContent: {
    flex: 1,
  },
  replyAuthor: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  replyText: {
    color: '#000000',
    marginTop: 5,
  },
  replyTime: {
    fontSize: 12,
    color: '#666666',
    marginTop: 5,
  },
  replyInputContainer: {
    marginTop: 10,
  },
  replyToLabel: {
    color: '#666666',
    marginBottom: 5,
  },
  replyInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#f2f2f2',
    color: '#000000',
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  sendButton: {
    marginLeft: 10,
  },
  repliesList: {
    marginTop: 10,
  },
  viewMoreButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  viewMoreText: {
    color: '#007AFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  closeButton: {
    marginTop: 20,
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#007AFF',
    fontSize: 18,
  },
  noCommentsText: {
    textAlign: 'center',
    color: '#666666',
    marginTop: 20,
  },
});

export default CommentModal;
