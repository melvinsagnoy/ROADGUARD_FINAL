import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, FlatList, SafeAreaView, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { firestore } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

const SendMessageScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, 'users'));
        const userList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(userList);
      } catch (error) {
        console.error('Error fetching users:', error);
        Alert.alert('Error', 'Failed to fetch users.');
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (search.trim()) {
      const results = users.filter(user =>
        user.displayName && user.displayName.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredUsers(results.slice(0, 3)); // Limit to 3 users
    } else {
      setFilteredUsers([]); // Clear filtered users when search is empty
    }
  }, [search, users]);

  const handleUserSelect = (user) => {
    navigation.navigate('ChatScreen', { recipient: user });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <TextInput
          style={styles.searchBar}
          placeholder="Search users..."
          value={search}
          onChangeText={setSearch}
        />
        {search.trim() ? (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.userItem}
                onPress={() => handleUserSelect(item)}
              >
                {item.photoURL ? (
                  <Image source={{ uri: item.photoURL }} style={styles.userPhoto} />
                ) : (
                  <View style={styles.userPhotoPlaceholder} />
                )}
                <Text style={styles.userName}>{item.displayName || 'Unnamed User'}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No users found</Text>}
          />
        ) : (
          <Text style={styles.emptyText}>Start typing to search for users</Text>
        )}
      </KeyboardAvoidingView>
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
  },
  searchBar: {
    width: '100%',
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    marginBottom: 10,
    fontSize: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
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
  userName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
});

export default SendMessageScreen;
