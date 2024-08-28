import React, { useRef } from 'react';
import { Modal, View, Text, Button, StyleSheet, ScrollView } from 'react-native';

const PrivacyModal = ({ visible, onClose, onAgree }) => {
  const scrollViewRef = useRef(null);

  const handleScroll = (event) => {
    if (event.nativeEvent.contentOffset.y > 100) { // Adjust scroll distance as needed
      onAgree();
    }
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <ScrollView
            ref={scrollViewRef}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            <Text style={styles.modalTitle}>Privacy Policy</Text>
            <Text style={styles.modalText}>
              **Privacy Policy for RoadGuard**{'\n\n'}
              **Effective Date:** [Date]{'\n\n'}
              **1. Introduction**{'\n'}
              Welcome to RoadGuard! We value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our mobile application.{'\n\n'}
              **2. Information We Collect**{'\n'}
              We may collect the following types of information:{'\n'}
              - **Personal Information:** Such as your name, email address, phone number, and other details you provide during registration.{'\n'}
              - **Usage Data:** Including your interactions with the app, such as posts you make, upvotes, downvotes, and your location data.{'\n'}
              - **Device Information:** Such as device type, operating system, and app version.{'\n\n'}
              **3. How We Use Your Information**{'\n'}
              We use the information we collect for the following purposes:{'\n'}
              - **To Provide and Improve Our Services:** To offer features like posting hazards, and to enhance the functionality of our app.{'\n'}
              - **To Personalize Your Experience:** Including showing relevant posts and hazards based on your interactions and location.{'\n'}
              - **To Communicate with You:** About your account, updates, and any issues with our app.{'\n'}
              - **For Analytics:** To understand how users interact with our app and to improve its performance.{'\n\n'}
              **4. Hazard Pinning on the Map**{'\n'}
              RoadGuard uses the information you provide in your posts to pin hazards on the map. The placement of these pins is influenced by user interactions such as upvotes and downvotes. This helps us highlight the most relevant and significant hazards based on community feedback.{'\n\n'}
              **5. Data Sharing and Disclosure**{'\n'}
              We do not sell or rent your personal information. We may share your data in the following situations:{'\n'}
              - **With Service Providers:** Who perform services on our behalf, such as analytics or customer support.{'\n'}
              - **For Legal Requirements:** If required by law or to protect our rights and safety.{'\n'}
              - **With Your Consent:** When you explicitly agree to share your data.{'\n\n'}
              **6. Security**{'\n'}
              We take reasonable measures to protect your personal information from unauthorized access, use, or disclosure. However, no method of transmission over the internet or electronic storage is 100% secure, so we cannot guarantee absolute security.{'\n\n'}
              **7. Your Rights**{'\n'}
              You have the right to access, update, or delete your personal information. You can also opt out of receiving marketing communications from us. If you have any concerns about your data, please contact us.{'\n\n'}
              **8. Changes to This Policy**{'\n'}
              We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the updated policy in the app and updating the effective date.{'\n\n'}
              **9. Contact Us**{'\n'}
              If you have any questions or concerns about this Privacy Policy, please contact us at:{'\n'}
              **RoadGuard Support**{'\n'}
              Email: support@roadguardapp.com{'\n'}
              Address: [Your Company Address]{'\n'}
            </Text>
          </ScrollView>
          <Button title="Close" onPress={onClose} />
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
  },
});

export default PrivacyModal;