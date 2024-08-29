import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Picker } from '@react-native-picker/picker'; 

const EditPostModal = ({ visible, onClose, onSubmit, currentPostContent }) => {
  const [title, setTitle] = useState(currentPostContent.title);
  const [body, setBody] = useState(currentPostContent.body);

  const handleSave = () => {
    onSubmit({ title, body });
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit Post</Text>
          
          <Picker
            selectedValue={title}
            style={styles.picker}
            onValueChange={(itemValue) => setTitle(itemValue)}
          >
            <Picker.Item label="Select an Issue" value="" />
            <Picker.Item label="Construction" value="Construction" />
            <Picker.Item label="Potholes" value="Potholes" />
            <Picker.Item label="Landslide" value="Landslide" />
            <Picker.Item label="Flooding" value="Flooding" />
            <Picker.Item label="Debris" value="Debris" />
            <Picker.Item label="Broken Glass" value="Broken Glass" />
            <Picker.Item label="Traffic Accidents" value="Traffic Accidents" />
            <Picker.Item label="Roadway Erosion" value="Roadway Erosion" />
            <Picker.Item label="Loose Gravel" value="Loose Gravel" />
            <Picker.Item label="Bridge Damage" value="Bridge Damage" />
          </Picker>

          <TextInput
            style={styles.input}
            value={body}
            onChangeText={setBody}
            placeholder="Body"
            multiline
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={onClose} style={styles.button}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={styles.button}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  picker: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
  },
  input: {
    height: 100, // Increased height for multiline input
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 15,
    paddingLeft: 10,
    borderRadius: 5,
    textAlignVertical: 'top', // Ensures text starts from the top
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    backgroundColor: '#E0C55B',
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
  },
});

export default EditPostModal;
