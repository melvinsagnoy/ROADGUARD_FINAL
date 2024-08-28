import React, { useRef } from 'react';
import { Modal, View, Text, Button, StyleSheet, ScrollView } from 'react-native';

const TermsModal = ({ visible, onClose, onAgree }) => {
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
            <Text style={styles.modalTitle}>Terms and Conditions</Text>
            <Text style={styles.modalText}>
              Welcome to [Your App Name]! {'\n'}
              {'\n'}
              These Terms and Conditions ("Terms") govern your use of our application. By accessing or using [Your App Name], you agree to be bound by these Terms. If you do not agree with any part of these Terms, you must not use our app. {'\n'}
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
              These Terms are governed by and construed in accordance with the laws of [Your Jurisdiction]. Any disputes arising from these Terms will be subject to the exclusive jurisdiction of the courts in [Your Jurisdiction]. {'\n'}
              {'\n'}
              **Contact Us** {'\n'}
              If you have any questions about these Terms, please contact us at [Your Contact Information].
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

export default TermsModal;