import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const SubscriptionScreen = ({ navigation }) => {
  const [selectedOption, setSelectedOption] = useState('1 month');
  const [modalVisible, setModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [qrCodeModalVisible, setQrCodeModalVisible] = useState(false);
  const [uploadProofModalVisible, setUploadProofModalVisible] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [inputName, setInputName] = useState('');
  const [inputDetail, setInputDetail] = useState('');
  const [proofImage, setProofImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubscription = (option) => {
    setSelectedOption(option);
    setModalVisible(true); // Show the first modal
  };

  const handleProceed = () => {
    setModalVisible(false);
    setPaymentModalVisible(true); // Show the payment modal
  };

  const handlePaymentSelection = (method) => {
    setSelectedPaymentMethod(method);
    setPaymentModalVisible(false);
    setDetailsModalVisible(true); // Show the details input modal
  };

  const handleConfirmPayment = () => {
    if (selectedPaymentMethod === 'GCash') {
      setDetailsModalVisible(false);
      setQrCodeModalVisible(true); // Show the QR code modal
    } else {
      console.log(`Payment Method: ${selectedPaymentMethod}`);
      console.log(`Name: ${inputName}`);
      console.log(`${selectedPaymentMethod === 'GCash' ? 'Mobile Number' : 'Email'}: ${inputDetail}`);
      setDetailsModalVisible(false);
      Alert.alert('Payment processed successfully');
    }
  };

  const getQrCodeImage = () => {
    switch (selectedOption) {
      case '1 month':
        return require('../assets/gcash_99.99.png'); // Replace with your actual image path
      case '6 months':
        return require('../assets/gcash_499.99.png'); // Replace with your actual image path
      case '12 months':
        return require('../assets/gcash_999.99.png'); // Replace with your actual image path
      default:
        return null;
    }
  };

  const pickImage = async () => {
    // Ask for permission to access media library
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permission to access camera roll is required!");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!pickerResult.canceled) {
      setProofImage(pickerResult.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    // Ask for permission to access camera
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permission to access camera is required!");
      return;
    }

    const pickerResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!pickerResult.canceled) {
      setProofImage(pickerResult.assets[0].uri);
    }
  };

  const handleSubmitProof = async () => {
    if (!proofImage) {
      Alert.alert("Please select an image as proof of payment.");
      return;
    }

    try {
      setIsUploading(true);
      // Here, implement the logic to upload the image to your backend or storage service.
      // For demonstration, we'll just simulate a network request with a timeout.

      setTimeout(() => {
        setIsUploading(false);
        setUploadProofModalVisible(false);
        setQrCodeModalVisible(false);
        Alert.alert("Proof of payment uploaded successfully!");
        // Reset the state
        setProofImage(null);
        setInputName('');
        setInputDetail('');
        setSelectedPaymentMethod('');
        setSelectedOption('1 month');
      }, 2000);
    } catch (error) {
      setIsUploading(false);
      Alert.alert("There was an error uploading your proof. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ROADGUARD</Text>
        <FontAwesome name="cog" size={24} color="black" />
      </View>

      <Image 
        source={require('../assets/sub_pic.png')}  // Update this line with the correct path
        style={styles.image}
      />

      <Text style={styles.title}>Upgrade to Premium</Text>
      <Text style={styles.subtitle}>Use Roadguard ad-free</Text>

      <View style={styles.optionsContainer}>
        <TouchableOpacity 
          style={[styles.option, selectedOption === '1 month' && styles.selectedOption]} 
          onPress={() => handleSubscription('1 month')}
        >
          <Text style={styles.optionText}>1 month</Text>
          <Text style={styles.priceText}>₱99.99</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.option, selectedOption === '6 months' && styles.selectedOption]} 
          onPress={() => handleSubscription('6 months')}
        >
          <Text style={styles.optionText}>6 months</Text>
          <Text style={styles.priceText}>₱499.99</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.option, selectedOption === '12 months' && styles.selectedOption]} 
          onPress={() => handleSubscription('12 months')}
        >
          <Text style={styles.optionText}>12 months</Text>
          <Text style={styles.priceText}>₱999.99</Text>
        </TouchableOpacity>
      </View>

      {/* First Modal for Subscription Confirmation */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <TouchableOpacity 
              style={[styles.modalOption, selectedOption === '1 month' && styles.selectedOption]} 
            >
              <Text style={styles.optionText}>{selectedOption}</Text>
              <Text style={styles.priceText}>
                {selectedOption === '1 month' ? '₱99.99' : selectedOption === '6 months' ? '₱499.99' : '₱999.99'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.modalText}>
              Would you like to proceed to a {selectedOption} plan subscription?
            </Text>
            <TouchableOpacity style={styles.proceedButton} onPress={handleProceed}>
              <Text style={styles.proceedButtonText}>Proceed</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Second Modal for Payment Method Selection */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={paymentModalVisible}
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>
              Select your payment method
            </Text>
            <TouchableOpacity style={styles.paymentButton} onPress={() => handlePaymentSelection('PayMaya')}>
              <Text style={styles.paymentButtonText}>PayMaya</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.paymentButton} onPress={() => handlePaymentSelection('GCash')}>
              <Text style={styles.paymentButtonText}>GCash</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setPaymentModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Third Modal for Payment Details Input */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>
              {selectedPaymentMethod === 'GCash' ? 'Enter Mobile Number and Name' : 'Enter PayMaya Email and Name'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={inputName}
              onChangeText={setInputName}
            />
            <TextInput
              style={styles.input}
              placeholder={selectedPaymentMethod === 'GCash' ? 'Mobile Number' : 'PayMaya Email'}
              value={inputDetail}
              onChangeText={setInputDetail}
              keyboardType={selectedPaymentMethod === 'GCash' ? 'phone-pad' : 'email-address'}
            />
            <TouchableOpacity style={styles.proceedButton} onPress={handleConfirmPayment}>
              <Text style={styles.proceedButtonText}>Confirm Payment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setDetailsModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={qrCodeModalVisible}
        onRequestClose={() => setQrCodeModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>
              Scan this QR code with GCash to pay
            </Text>
            <Image 
              source={getQrCodeImage()}
              style={styles.qrCode}
            />
            <TouchableOpacity 
              style={styles.doneButton} 
              onPress={() => setUploadProofModalVisible(true)}
            >
              <Text style={styles.doneButtonText}>IF DONE, click here to upload proof</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setQrCodeModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Upload Proof Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={uploadProofModalVisible}
        onRequestClose={() => setUploadProofModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Upload Proof of Payment</Text>
            {proofImage ? (
              <Image source={{ uri: proofImage }} style={styles.proofImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>No image selected</Text>
              </View>
            )}
            <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
              <Text style={styles.uploadButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
              <Text style={styles.uploadButtonText}>Take a Photo</Text>
            </TouchableOpacity>
            {isUploading ? (
              <ActivityIndicator size="large" color="#FFD700" style={{ marginVertical: 10 }} />
            ) : (
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmitProof}>
                <Text style={styles.submitButtonText}>Submit Proof</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.cancelButton} onPress={() => setUploadProofModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    borderRadius: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#FFD700',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
    marginBottom: 30,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  option: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '30%',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: '#FFD700',
  },
  optionText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  priceText: {
    fontSize: 16,
    color: '#555',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
  },
  modalOption: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 20,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  proceedButton: {
    backgroundColor: '#FFD700',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    width: '80%',
  },
  proceedButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  paymentButton: {
    backgroundColor: '#FFD700',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    width: '80%',
  },
  paymentButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  cancelButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'red',
  },
  input: {
    width: '90%',
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
    backgroundColor: '#FFF',
  },
  qrCode: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  doneButton: {
    backgroundColor: '#FFD700',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    width: '90%',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: '#FFD700',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 5,
    width: '90%',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  proofImage: {
    width: 250,
    height: 250,
    borderRadius: 10,
    marginBottom: 10,
  },
  placeholderImage: {
    width: 250,
    height: 250,
    borderRadius: 10,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  placeholderText: {
    fontSize: 16,
    color: '#555',
  },
  submitButton: {
    backgroundColor: '#32CD32',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
    width: '90%',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
});

export default SubscriptionScreen;
