import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from 'react-native-paper';
import { format } from 'date-fns';
import { ref, onValue, update, get, push, set } from 'firebase/database';
import { database } from '../firebaseConfig';

const PostDetailsScreen = ({ route, navigation }) => {
  const { colors } = useTheme();
  const [post, setPost] = useState(route.params.post || {});
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [user, setUser] = useState(null); // You'll need to get the current user
  const [userData, setUserData] = useState({}); // Fetch user data as needed

  useEffect(() => {
    fetchPostDetails();
    fetchComments();
  }, []);

  const fetchPostDetails = async () => {
    const postRef = ref(database, `posts/${post.id}`);
    const snapshot = await get(postRef);
    if (snapshot.exists()) {
      setPost({ id: snapshot.key, ...snapshot.val() });
    }
  };

  const fetchComments = () => {
    const commentsRef = ref(database, `posts/${post.id}/comments`);
    onValue(commentsRef, (snapshot) => {
      const data = snapshot.val() || [];
      setComments(Object.values(data));
    });
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;

    const commentRef = push(ref(database, `posts/${post.id}/comments`));
    await set(commentRef, {
      text: commentText,
      userId: user?.email,
      displayName: userData.displayName || 'Anonymous',
      createdAt: Date.now(),
    });

    setCommentText('');
  };

  const formatDate = (timestamp) => {
    return format(new Date(timestamp), 'PPpp');
  };

  if (!post || !post.id) {
    return (
      <View style={styles.container}>
        <Text>Loading post details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.feedItem}>
        <View style={styles.feedHeader}>
          <Image
            source={{ uri: post.photoURL || 'https://via.placeholder.com/50' }}
            style={styles.profileIcon}
          />
          <View style={styles.feedHeaderText}>
            <Text style={[styles.feedAuthor, { color: colors.text }]}>
              {post.displayName || 'Unknown User'}
            </Text>
            {post.location ? (
              <Text style={[styles.feedLocation, { color: colors.text }]}>
                Location: {post.location.latitude}, {post.location.longitude}
              </Text>
            ) : (
              <Text style={[styles.feedLocation, { color: colors.text }]}>
                Location: Not available
              </Text>
            )}
          </View>
        </View>

        <View style={styles.feedContent}>
          {post.imageURL ? (
            <Image source={{ uri: post.imageURL }} style={styles.feedImage} />
          ) : null}
          <Text style={[styles.feedTitle, { color: colors.text }]}>
            {post.title || 'No title'}
          </Text>
          <Text style={[styles.feedBody, { color: colors.text }]}>
            {post.body || 'No content available.'}
          </Text>
          <Text style={styles.postDate}>
            {formatDate(post.createdAt || Date.now())}
          </Text>
        </View>

        {/* Render comments */}
        {comments.map((comment, index) => (
          <View key={index} style={styles.commentItem}>
            <Image
              source={{ uri: comment.photoURL || 'https://via.placeholder.com/30' }}
              style={styles.commentProfileIcon}
            />
            <View style={styles.commentTextContainer}>
              <Text style={styles.commentUserName}>
                {comment.displayName || 'Anonymous'}
              </Text>
              <Text style={styles.commentText}>{comment.text}</Text>
              <Text style={styles.commentDate}>
                {formatDate(comment.createdAt)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Comment input */}
      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Write a comment..."
          value={commentText}
          onChangeText={setCommentText}
        />
        <TouchableOpacity onPress={submitComment} style={styles.sendButton}>
          <MaterialIcons name="send" size={24} color="blue" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  feedItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  feedHeaderText: {
    flex: 1,
  },
  feedAuthor: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  feedLocation: {
    fontSize: 14,
    color: '#888',
  },
  feedContent: {
    marginTop: 10,
  },
  feedImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  feedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  feedBody: {
    fontSize: 16,
    marginTop: 5,
  },
  postDate: {
    marginTop: 10,
    fontSize: 12,
    color: '#888',
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  commentProfileIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  commentTextContainer: {
    flex: 1,
  },
  commentUserName: {
    fontWeight: 'bold',
  },
  commentText: {
    marginTop: 2,
    fontSize: 14,
  },
  commentDate: {
    marginTop: 2,
    fontSize: 12,
    color: '#888',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  commentInput: {
    flex: 1,
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#f1f1f1',
    marginRight: 10,
  },
  sendButton: {
    padding: 5,
  },
});

export default PostDetailsScreen;  