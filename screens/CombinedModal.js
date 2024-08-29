import React, { useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const CombinedModal = ({ visible, onClose, onAgree }) => {
  const scrollViewRef = useRef(null);

  const handleScroll = (event) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const contentHeight = contentSize.height;
    const viewportHeight = layoutMeasurement.height;
    const scrollPosition = contentOffset.y;

    if (scrollPosition + viewportHeight >= contentHeight - 50) {
      onAgree();
    }
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      animationType="fade"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <ScrollView
            ref={scrollViewRef}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            <Text style={styles.modalTitle}>Terms and Conditions</Text>
            <Text style={styles.modalText}>
              Welcome to RoadGuard! {'\n'}
              {'\n'}
              These Terms and Conditions ("Terms") govern your use of our application. By accessing or using RoadGuard, you agree to be bound by these Terms. If you do not agree with any part of these Terms, you must not use our app. {'\n'}
              {'\n'}
              1. **Eligibility** {'\n'}
              You must be at least 18 years old to use this app. By using the app, you represent and warrant that you meet this requirement. {'\n'}
              {'\n'}
              2. **Account Responsibility** {'\n'}
              You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account or any other breach of security. {'\n'}
              {'\n'}
              3. **Prohibited Uses** {'\n'}
              You may not use the app for any illegal or unauthorized purpose. You agree not to: {'\n'}
              - Violate any applicable law or regulation. {'\n'}
              - Engage in any activity that interferes with or disrupts the app. {'\n'}
              {'\n'}
              4. **Intellectual Property** {'\n'}
              All content, trademarks, and other intellectual property rights in the app are owned by us or our licensors. You may not use any of our intellectual property without our prior written consent. {'\n'}
              {'\n'}
              5. **Limitation of Liability** {'\n'}
              We are not liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the app. {'\n'}
              {'\n'}
              6. **Changes to Terms** {'\n'}
              We may update these Terms from time to time. We will notify you of any changes by posting the new Terms on the app. Your continued use of the app after any changes indicates your acceptance of the new Terms. {'\n'}
              {'\n'}
              7. **Governing Law** {'\n'}
              These Terms are governed by and construed in accordance with the laws of your jurisdiction. Any disputes arising from these Terms will be subject to the exclusive jurisdiction of the courts in your jurisdiction. {'\n'}
              {'\n'}
              **Contact Us** {'\n'}
              If you have any questions about these Terms, please contact us at [Your Contact Information].
            </Text>
            <Text style={styles.modalTitle}>Privacy Policy</Text>
            <Text style={styles.modalText}>
              Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application. Please read it carefully. {'\n'}
              {'\n'}
              1. **Information We Collect** {'\n'}
              We may collect information about you, including your name, email address, phone number, and other relevant details. {'\n'}
              {'\n'}
              2. **How We Use Your Information** {'\n'}
              We use your information to provide and improve our services, communicate with you, and for other purposes described in this Privacy Policy. {'\n'}
              {'\n'}
              3. **How We Share Your Information** {'\n'}
              We may share your information with third parties in accordance with this Privacy Policy. {'\n'}
              {'\n'}
              4. **Security** {'\n'}
              We implement appropriate security measures to protect your information from unauthorized access, use, or disclosure. {'\n'}
              {'\n'}
              5. **Changes to Privacy Policy** {'\n'}
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on the app. Your continued use of the app after any changes indicates your acceptance of the new Privacy Policy. {'\n'}
              {'\n'}
              **Contact Us** {'\n'}
              If you have any questions about this Privacy Policy, please contact us at [Your Contact Information].
            </Text>
          </ScrollView>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Darkened the overlay color slightly
  },
  modalContent: {
    width: '85%',
    maxHeight: '70%',
    backgroundColor: '#2b2b2b', // Darker background for the modal content
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e5e5e5', // Light gray for the title text
    marginBottom: 10,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#c7c7c7', // Slightly darker gray for the body text
    lineHeight: 24,
    marginBottom: 15,
    textAlign: 'justify',
  },
  closeButton: {
    backgroundColor: '#007BFF',
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CombinedModal;
