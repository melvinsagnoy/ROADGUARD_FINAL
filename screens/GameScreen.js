import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Text, ImageBackground, TouchableOpacity } from 'react-native';
import { PanGestureHandler, GestureHandlerRootView, State } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import Matter from 'matter-js';
import { useNavigation } from '@react-navigation/native';
import { auth, firestore } from '../firebaseConfig';
import { doc, updateDoc, arrayUnion, setDoc, getDoc } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

const obstacleImages = [
  require('../assets/obstacle1.png'),
  require('../assets/obstacle2.png'),
  require('../assets/obstacle3.png')
];

const getRandomObstacleImage = () => {
  const randomIndex = Math.floor(Math.random() * obstacleImages.length);
  return obstacleImages[randomIndex];
};

const getRandomXPosition = () => {
  return Math.floor(Math.random() * (width - 50)); // Ensure obstacle is fully within the screen width
};

const RoadFighterGame = () => {
  const [carPosition, setCarPosition] = useState({ x: width / 2 - 25, y: height - 120 });
  const [obstacles, setObstacles] = useState([
    { id: 1, position: { x: getRandomXPosition(), y: 0 }, size: { width: 50, height: 100 }, image: getRandomObstacleImage() },
    { id: 2, position: { x: getRandomXPosition(), y: -200 }, size: { width: 50, height: 100 }, image: getRandomObstacleImage() },
  ]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [userEmail, setUserEmail] = useState(null); // State to hold user email

  const translationX = useSharedValue(0);
  const offsetX = useSharedValue(carPosition.x);
  const engineRef = useRef(null);
  const carRef = useRef(null);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserEmail = () => {
      const user = auth.currentUser;
      if (user) {
        setUserEmail(user.email); // Set user email from Firebase auth
      }
    };
    fetchUserEmail();

    const engine = Matter.Engine.create();
    const world = engine.world;
    engineRef.current = engine;

    const car = Matter.Bodies.rectangle(carPosition.x + 25, carPosition.y + 50, 50, 100, {
      isStatic: true,
      label: 'car'
    });
    carRef.current = car;
    Matter.World.add(world, car);

    const createObstacleBody = (obstacle) =>
      Matter.Bodies.rectangle(obstacle.position.x + obstacle.size.width / 2, obstacle.position.y + obstacle.size.height / 2, obstacle.size.width, obstacle.size.height, { 
        label: 'obstacle'
      });

    const obstacleBodies = obstacles.map(createObstacleBody);
    Matter.World.add(world, obstacleBodies);

    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach(pair => {
        if ((pair.bodyA.label === 'car' && pair.bodyB.label === 'obstacle') ||
          (pair.bodyA.label === 'obstacle' && pair.bodyB.label === 'car')) {
          runOnJS(handleGameOver)();  // Call handleGameOver when collision happens
        }
      });
    });

    const gameLoop = setInterval(() => {
      if (!isGameOver) {
        Matter.Engine.update(engine, 1000 / 60);

        setObstacles(prevObstacles => prevObstacles.map((obstacle, index) => {
          const obstacleBody = obstacleBodies[index];
          let newY = obstacleBody.position.y - obstacle.size.height / 2 + (5 + Math.floor(score / 5) * 3); // Increase speed significantly when score is >= 5
          if (newY > height) {
            runOnJS(setScore)(prevScore => prevScore + 1);
            newY = -100; // Reset position above the screen
            return {
              id: obstacle.id,
              position: { x: getRandomXPosition(), y: newY },
              size: obstacle.size,
              image: getRandomObstacleImage()
            };
          }
          Matter.Body.setPosition(obstacleBody, { x: obstacleBody.position.x, y: newY + obstacle.size.height / 2 });
          return {
            ...obstacle,
            position: { x: obstacleBody.position.x - obstacle.size.width / 2, y: newY }
          };
        }));

        if (score >= 5 && obstacles.length < 3) {
          setObstacles(prevObstacles => [
            ...prevObstacles,
            {
              id: prevObstacles.length + 1,
              position: { x: getRandomXPosition(), y: -200 }, // Start off-screen
              size: { width: 50, height: 100 },
              image: getRandomObstacleImage()
            }
          ]);
        }
      }
    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [obstacles, isGameOver, score]);

  const handleGameOver = async () => {
    setIsGameOver(true);

    // Save the score to Firestore with user email
    try {
      const userDocRef = doc(firestore, 'users', userEmail);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          scores: []
        });
      }

      const newScore = {
        score: score,
        timestamp: new Date() // Use Date() to manually add a timestamp
      };

      await updateDoc(userDocRef, {
        scores: arrayUnion(newScore)
      });
      console.log('Score saved successfully');
    } catch (error) {
      console.error('Error saving score: ', error);
    }
  };

  const onGestureEvent = (event) => {
    translationX.value = event.nativeEvent.translationX;
    const newX = offsetX.value + translationX.value;
    if (newX >= 0 && newX <= width - 50) {
      runOnJS(setCarPosition)({ x: newX, y: carPosition.y });
      Matter.Body.setPosition(carRef.current, { x: newX + 25, y: carPosition.y + 50 });
    }
  };

  const onHandlerStateChange = (event) => {
    if (event.nativeEvent.state === State.END || event.nativeEvent.state === State.CANCELLED) {
      offsetX.value += translationX.value;
      translationX.value = 0;
    }
  };

  useAnimatedReaction(
    () => offsetX.value,
    (newValue) => {
      console.log('Car position updated:', newValue);
    },
    [offsetX]
  );

  const animatedCarStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: offsetX.value + translationX.value }],
    };
  });

  const animatedObstacleStyle = (position) => useAnimatedStyle(() => {
    return {
      transform: [{ translateY: withSpring(position.y) }],
    };
  });

  const restartGame = () => {
    setCarPosition({ x: width / 2 - 25, y: height - 120 });
    offsetX.value = width / 2 - 25;
    setObstacles([
      { id: 1, position: { x: getRandomXPosition(), y: 0 }, size: { width: 50, height: 100 }, image: getRandomObstacleImage() },
      { id: 2, position: { x: getRandomXPosition(), y: -200 }, size: { width: 50, height: 100 }, image: getRandomObstacleImage() },
    ]);
    setIsGameOver(false);
    setScore(0);
  };

  const handleQuit = () => {
    navigation.goBack();
  };

  const Car = ({ position, size }) => (
    <Animated.Image 
      source={require('../assets/car.png')} 
      style={[styles.car, { width: size.width, height: size.height, top: position.y }, animatedCarStyle]} 
    />
  );

  const Road = ({ children }) => (
    <ImageBackground source={require('../assets/road-image.png')} style={styles.road}>
      {children}
    </ImageBackground>
  );

  const Obstacle = ({ position, size, image }) => {
    const animatedStyle = animatedObstacleStyle(position);
    return (
      <Animated.Image
        source={image}
        style={[styles.obstacle, { width: size.width, height: size.height, left: position.x }, animatedStyle]}
        resizeMode="contain"
      />
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <Road />
      {isGameOver && (
        <View style={styles.gameOver}>
          <Text style={styles.gameOverText}>Game Over</Text>
          <TouchableOpacity style={styles.button} onPress={restartGame}>
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleQuit}>
            <Text style={styles.buttonText}>Quit</Text>
          </TouchableOpacity>
        </View>
      )}
      {!isGameOver && (
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
        >
          <Animated.View style={{ flex: 1 }}>
            <Car position={carPosition} size={{ width: 50, height: 100 }} />
          </Animated.View>
        </PanGestureHandler>
      )}
      {!isGameOver && obstacles.map(obstacle => (
        <Obstacle key={obstacle.id} position={obstacle.position} size={obstacle.size} image={obstacle.image} />
      ))}
      <View style={styles.scoreboard}>
        <Text style={styles.scoreText}>Score: {score}</Text>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'white',
  },
  car: {
    position: 'absolute',
  },
  road: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'gray',
  },
  obstacle: {
    position: 'absolute',
  },
  gameOver: {
    position: 'absolute',
    top: height / 2 - 100,
    left: width / 2 - 150,
    width: 300,
    height: 200,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'black',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gameOverText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreboard: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  scoreText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default RoadFighterGame;
