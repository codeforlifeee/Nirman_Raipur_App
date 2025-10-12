import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { workAPI } from '../services/api';

const WorkProgressScreen = ({ route, navigation }) => {
  const { proposal } = route.params;
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [location, setLocation] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({
    desc: '',
    sanctionedAmount: '',
    totalAmountReleasedSoFar: '',
    remainingBalance: '',
    expenditureAmount: '',
    mbStageMeasurementBookStag: '',
  });

  useEffect(() => {
    requestPermissions();
    getCurrentLocation();
    
    // Auto-launch camera when screen opens
    const launchCamera = async () => {
      // Small delay to let permissions settle
      setTimeout(() => {
        captureImage();
      }, 500);
    };
    
    launchCamera();
  }, []);

  const requestPermissions = async () => {
    // Request camera permission
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraStatus !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required to capture images');
    }

    // Request location permission
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    if (locationStatus !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required');
    }
  };

  const getCurrentLocation = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Failed to get current location. Please try again.');
    }
  };

  const captureImage = async () => {
    try {
      // Launch camera directly (no alert dialog)
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setImages([...images, result.assets[0]]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (images.length === 0) {
      Alert.alert('Error', 'Please add at least one image');
      return false;
    }

    if (!location) {
      Alert.alert('Error', 'Location is required. Please enable location services.');
      return false;
    }

    if (!formData.desc) {
      Alert.alert('Error', 'Please provide a description');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const progressData = {
        ...formData,
        images: images.map(img => ({
          uri: img.uri,
          type: 'image/jpeg',
          name: img.fileName || `image_${Date.now()}.jpg`,
        })),
        latitude: location.latitude,
        longitude: location.longitude,
      };

      await workAPI.submitProgress(proposal._id || proposal.id, progressData);

      // Show success modal
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Submit error:', error);
      
      // Check if it's an authentication error
      if (error.message && error.message.includes('token')) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [
            {
              text: 'OK',
              onPress: () => navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              }),
            },
          ]
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to submit progress');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={[styles.scrollView, Platform.OS === 'web' && { overflow: 'scroll', WebkitOverflowScrolling: 'touch' }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={true}
        alwaysBounceVertical={false}
        persistentScrollbar={true}
      >
        <View style={styles.content}>
        {/* Scroll Hint for Small Screens */}
        <View style={styles.scrollHint}>
          <Text style={styles.scrollHintText}>⬇️ Scroll down to see all fields and Submit button</Text>
        </View>
        
        <View style={styles.proposalInfo}>
          <Text style={styles.proposalTitle}>
            {proposal.nameOfWork || proposal.title || 'Work Proposal'}
          </Text>
          <Text style={styles.proposalId}>ID: {proposal._id || proposal.id}</Text>
        </View>

        {/* Location Status */}
        <View style={styles.locationContainer}>
          <Text style={styles.label}>📍 GPS Location</Text>
          {location ? (
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>
                Lat: {location.latitude.toFixed(6)}
              </Text>
              <Text style={styles.locationText}>
                Lng: {location.longitude.toFixed(6)}
              </Text>
            </View>
          ) : (
            <TouchableOpacity onPress={getCurrentLocation} style={styles.refreshButton}>
              <Text style={styles.refreshButtonText}>Get Location</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Images */}
        <View style={styles.section}>
          <Text style={styles.label}>📸 Images (Required) *</Text>
          
          {images.length === 0 && (
            <TouchableOpacity style={styles.bigCameraButton} onPress={captureImage}>
              <Text style={styles.bigCameraIcon}>📷</Text>
              <Text style={styles.bigCameraText}>Tap to Capture Photo</Text>
            </TouchableOpacity>
          )}
          
          <ScrollView horizontal style={styles.imageScroll} showsHorizontalScrollIndicator={true}>
            {images.map((img, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: img.uri }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeImage(index)}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {images.length > 0 && images.length < 5 && (
              <TouchableOpacity style={styles.addImageButton} onPress={captureImage}>
                <Text style={styles.addImageText}>📸 Take Another</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description (Required) *</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Enter progress description..."
            value={formData.desc}
            onChangeText={(value) => updateField('desc', value)}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Financial Fields */}
        <View style={styles.section}>
          <Text style={styles.label}>Sanctioned Amount</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter amount"
            value={formData.sanctionedAmount}
            onChangeText={(value) => updateField('sanctionedAmount', value)}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Total Amount Released So Far</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter amount"
            value={formData.totalAmountReleasedSoFar}
            onChangeText={(value) => updateField('totalAmountReleasedSoFar', value)}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Remaining Balance</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter amount"
            value={formData.remainingBalance}
            onChangeText={(value) => updateField('remainingBalance', value)}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Expenditure Amount</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter amount"
            value={formData.expenditureAmount}
            onChangeText={(value) => updateField('expenditureAmount', value)}
            keyboardType="numeric"
          />
        </View>

        {/* MB Stage */}
        <View style={styles.section}>
          <Text style={styles.label}>MB Stage (Measurement Book Stage)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter MB stage"
            value={formData.mbStageMeasurementBookStag}
            onChangeText={(value) => updateField('mbStageMeasurementBookStag', value)}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Progress</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalIcon}>✅</Text>
            <Text style={styles.modalTitle}>Success!</Text>
            <Text style={styles.modalMessage}>
              Progress report submitted successfully!
            </Text>
            <Text style={styles.modalSubMessage}>
              Your work progress has been recorded and uploaded.
            </Text>
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowSuccessModal(false);
                // Navigate to WorkProposals screen to refresh the list
                navigation.navigate('WorkProposals');
              }}
            >
              <Text style={styles.modalButtonText}>← Back to Proposals</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    height: '100%',
  },
  scrollView: {
    flex: 1,
    height: '100%',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  content: {
    padding: 16,
    paddingBottom: 20,
  },
  scrollHint: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  scrollHintText: {
    color: '#E65100',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  proposalInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  proposalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  proposalId: {
    fontSize: 12,
    color: '#666',
  },
  locationContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  locationInfo: {
    marginTop: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  refreshButton: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  bigCameraButton: {
    backgroundColor: '#2196F3',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#1976D2',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  bigCameraIcon: {
    fontSize: 60,
    marginBottom: 8,
  },
  bigCameraText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  imageScroll: {
    flexDirection: 'row',
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addImageButton: {
    width: 120,
    height: 120,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
  },
  addImageText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  modalIcon: {
    fontSize: 72,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  modalSubMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default WorkProgressScreen;
