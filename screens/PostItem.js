import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Modal, Alert } from 'react-native';
import { getFirestore, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { MaterialIcons } from '@expo/vector-icons'; // Install this package if not already

const PostItem = ({ post, onEdit, onDelete }) => {
  const auth = getAuth();
  const firestore = getFirestore();

  const handleEdit = () => {
    if (auth.currentUser.email === post.authorEmail) {
      onEdit(post.id);
    } else {
      Alert.alert('Error', 'You can only edit your own posts.');
    }
  };

  const handleDelete = async () => {
    if (auth.currentUser.email === post.authorEmail) {
      const confirm = confirm('Are you sure you want to delete this post?');
      if (confirm) {
        await onDelete(post.id);
      }
    } else {
      Alert.alert('Error', 'You can only delete your own posts.');
    }
  };

  return (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <Text style={styles.postTitle}>{post.title}</Text>
        <TouchableOpacity onPress={() => setShowMenu(!showMenu)}>
          <MaterialIcons name="more-vert" size={24} color="black" />
        </TouchableOpacity>
      </View>
      {showMenu && (
        <View style={styles.menu}>
          <TouchableOpacity onPress={handleEdit}>
            <Text>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}>
            <Text>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
      {post.imageURL && <Image source={{ uri: post.imageURL }} style={styles.postImage} />}
      <Text>{post.body}</Text>
      <Text>{post.location ? `${post.location.latitude}, ${post.location.longitude}` : 'No location'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  postContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  postImage: {
    width: '100%',
    height: 200,
    marginVertical: 10,
  },
  menu: {
    position: 'absolute',
    right: 10,
    top: 40,
    backgroundColor: 'white',
    borderRadius: 5,
    elevation: 5,
    padding: 10,
    zIndex: 10,
  },
});

export default PostItem;