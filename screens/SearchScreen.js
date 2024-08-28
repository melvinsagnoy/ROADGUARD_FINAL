import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, Switch, ScrollView } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import NavBar from './NavBar';
import { auth, firestore } from '../firebaseConfig';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

const SearchScreen = ({ navigation, toggleTheme, isDarkTheme }) => {
  const [isMenuModalVisible, setMenuModalVisible] = useState(false);
  const [isSettingsModalVisible, setSettingsModalVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isLeaderboardModalVisible, setLeaderboardModalVisible] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPoints, setUserPoints] = useState(0);
  const [userRank, setUserRank] = useState(0);
  const [rankDescription, setRankDescription] = useState('');
  const [allUsers, setAllUsers] = useState([]);

  const fetchUserData = useCallback(async () => {
    const user = auth.currentUser;
    if (user) {
      const email = user.email;
      setUserEmail(email);

      const userDocRef = doc(firestore, 'users', email);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserName(userData.displayName || 'User');
        
        const totalPoints = userData.scores ? userData.scores.reduce((sum, score) => sum + score.score, 0) : 0;
        setUserPoints(totalPoints);
      }
    }
  }, []);

  const fetchAllUsersData = useCallback(async () => {
    const usersCollectionRef = collection(firestore, 'users');
    const usersSnapshot = await getDocs(usersCollectionRef);
    const usersData = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      const totalPoints = data.scores ? data.scores.reduce((sum, score) => sum + score.score, 0) : 0;
      return { email: doc.id, displayName: data.displayName, totalPoints };
    });
    return usersData;
  }, []);

  const refreshData = useCallback(async () => {
    await fetchUserData();
    const usersData = await fetchAllUsersData();

    // Sort users by totalPoints in descending order
    const sortedUsers = usersData.sort((a, b) => b.totalPoints - a.totalPoints);
    setAllUsers(sortedUsers);

    // Find the current user's rank
    const currentUserRank = sortedUsers.findIndex(user => user.email === userEmail) + 1;
    setUserRank(currentUserRank);
    setRankDescription(`You rank ${currentUserRank}`);
  }, [fetchUserData, fetchAllUsersData, userEmail]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const toggleMenuModal = () => {
    setMenuModalVisible(prev => !prev);
  };

  const handleSettings = () => {
    setMenuModalVisible(false);
    setSettingsModalVisible(true);
  };

  const handleLogout = () => {
    auth.signOut().then(() => {
      setMenuModalVisible(false);
      navigation.navigate('Login');
    });
  };

  const handleViewLeaderboards = () => {
    setLeaderboardModalVisible(true);
  };

  const handleCloseLeaderboards = () => {
    setLeaderboardModalVisible(false);
  };

  const refreshScores = async () => {
    await refreshData();
  };

  return (
    <View style={styles.container}>
      <Modal
        visible={isMenuModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={toggleMenuModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#FFFFFF' }]}>
            <TouchableOpacity onPress={handleSettings}>
              <Text style={styles.modalText1}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout}>
              <Text style={styles.modalText2}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isSettingsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#FFFFFF' }]}>
            <View style={styles.settingOption}>
              <Text style={styles.settingText}>Dark Mode</Text>
              <Switch value={isDarkTheme} onValueChange={toggleTheme} />
            </View>
            <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
              <Text style={styles.modalText2}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isLeaderboardModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseLeaderboards}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.leaderboardModalContent}>
            <Text style={styles.leaderboardTitle}>Leaderboards</Text>
            <ScrollView style={styles.leaderboardContainer}>
              {allUsers.map((user, index) => (
                <View key={user.email} style={styles.leaderboardItem}>
                  {index + 1 === 1 && <Image source={require('../assets/gold_crown.png')} style={styles.crownImage} />}
                  {index + 1 === 2 && <Image source={require('../assets/silver_crown.png')} style={styles.crownImage} />}
                  {index + 1 === 3 && <Image source={require('../assets/bronze_crown.png')} style={styles.crownImage} />}
                  <Text style={styles.leaderboardScore}>{user.totalPoints} points</Text>
                  <Text style={styles.leaderboardName}>{user.displayName || 'Unknown'}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={handleCloseLeaderboards}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <Image source={require('../assets/icon.png')} style={styles.logo} />
        <Text style={styles.headerTitle}>RoadGuard</Text>
        <TouchableOpacity onPress={toggleMenuModal}>
          <MaterialIcons name="menu" size={30} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.rankContainer}>
        <View style={styles.rankInfo}>
          <Text style={styles.rankText}>
            {userRank === 1 && <Image source={require('../assets/gold_crown.png')} style={styles.crownImageSmall} />}
            {userRank === 2 && <Image source={require('../assets/silver_crown.png')} style={styles.crownImageSmall} />}
            {userRank === 3 && <Image source={require('../assets/bronze_crown.png')} style={styles.crownImageSmall} />}
            {userRank > 3 && <Text style={styles.rankText}>#{userRank}</Text>}
            {userName}
          </Text>
          <TouchableOpacity onPress={refreshScores} style={styles.refreshIcon}>
            <MaterialIcons name="refresh" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <View style={styles.rankBadgeContainer}>
          <View style={styles.rankBadge}>
            <Text style={styles.rankBadgeText}>{userRank}</Text>
          </View>
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsText}>{userPoints} points</Text>
            <Text style={styles.rankDescription}>{rankDescription}</Text>
            <TouchableOpacity onPress={handleViewLeaderboards}>
              <Text style={styles.viewLeaderboard}>View leaderboards →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.gameContainer}>
        <Image source={require('../assets/thumbnail.png')} style={styles.thumbnail} />
        <Text style={styles.title}>RoadGuard Racer</Text>
        <Text style={styles.description}>
          Mechanics:
          {"\n"}- Swipe to move the car left or right.
          {"\n"}- Avoid obstacles on the road.
          {"\n"}- Collect points by passing through gaps.
        </Text>
        <TouchableOpacity
          style={[styles.playButton, isHovered && styles.playButtonHover]}
          onPress={() => navigation.navigate('GameScreen')}
          onPressIn={() => setIsHovered(true)}
          onPressOut={() => setIsHovered(false)}
        >
          <Text style={[styles.playButtonText, isHovered && styles.playButtonTextHover]}>Play</Text>
        </TouchableOpacity>
      </View>

      <NavBar navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    top: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 30,
    width: '100%',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  logo: {
    width: 50,
    height: 50,
    borderWidth: 1,
  },
  headerTitle: {
    left: -50,
    fontSize: 25,
    fontWeight: 'bold',
    color: '#333333',
  },
  rankContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    marginVertical: 20,
    width: '90%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  rankInfo: {
    alignItems: 'flex-start',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  subRankText: {
    fontSize: 14,
    color: '#777777',
  },
  rankBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankBadge: {
    backgroundColor: '#FFD700',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  rankBadgeText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#333333',
  },
  pointsContainer: {
    alignItems: 'flex-start',
  },
  pointsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  rankDescription: {
    fontSize: 16,
    color: '#333333',
    marginTop: 5,
  },
  viewLeaderboard: {
    fontSize: 14,
    color: '#FFD700',
    marginTop: 5,
    textDecorationLine: 'underline',
  },
  leaderboardContainer: {
    paddingHorizontal: 10,
  },
  leaderboardItem: {
    flexDirection: 'row', // Changed back to 'row'
    justifyContent: 'space-between',
    alignItems: 'center', // Center align the content horizontally
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
  },
  leaderboardRank: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  leaderboardName: {
    fontSize: 16,
    marginTop: 5, // Add some space above the name
  },
  leaderboardScore: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  leaderboardModalContent: {
    padding: 30,
    borderRadius: 10,
    width: '80%',
    textAlign: 'center',
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'left',
    backgroundColor: '#FFFFFF',
  },
  leaderboardTitle: {
    alignItems: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  crownImage: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  crownImageSmall: {
    width: 18,
    height: 18,
    marginRight: 5,
  },
  closeButton: {
    backgroundColor: '#E0C55B',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    width: 80,
    marginTop: 20,
  },
  closeButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  refreshIcon: {
    padding: 5,
  },
  gameContainer: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    marginBottom: 20,
    width: '90%',
    alignSelf: 'center',
  },
  thumbnail: {
    width: 150,
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    color: '#333',
    marginBottom: 10,
  },
  playButton: {
    backgroundColor: '#E0C55B',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    width: 80,
    marginVertical: 10,
  },
  playButtonHover: {
    backgroundColor: '#C0A346',
  },
  playButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  playButtonTextHover: {
    color: '#FFF',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  modalContent: {
    padding: 50,
    borderRadius: 10,
    width: '80%',
    textAlign: 'center',
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
  },
  modalText1: {
    backgroundColor: '#E0C55B',
    padding: 20,
    width: 200,
    borderRadius: 50,
    fontSize: 18,
    margin: 20,
    color: '#000',
  },
  modalText2: {
    backgroundColor: '#545151',
    padding: 20,
    width: 200,
    borderRadius: 50,
    fontSize: 18,
    margin: 20,
    color: '#fff',
  },
  settingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 10,
  },
  settingText: {
    fontSize: 18,
  },
});

export default SearchScreen;
