import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';
import { workAPI } from '../services/api';

const WorkUpdateScreen = ({ route, navigation }) => {
  const { proposal } = route.params;
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [status, setStatus] = useState(proposal.currentStatus || proposal.status || 'Pending');
  const [location, setLocation] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    requestLocationPermission();
    getCurrentLocation();
  }, []);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required to update work status');
    }
  };

  const getCurrentLocation = async () => {
    setLocationLoading(true);
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
    } finally {
      setLocationLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!location) {
      Alert.alert('Error', 'Location is required to update work status. Please enable location services.');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        currentStatus: status,
        latitude: location.latitude,
        longitude: location.longitude,
        lastUpdated: new Date().toISOString(),
      };

      await workAPI.updateWorkProposal(proposal._id || proposal.id, updateData);

      // Show success modal instead of Alert
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Update error:', error);
      
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
        Alert.alert('Error', error.message || 'Failed to update work status');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Update Work Status</Text>
        <Text style={styles.headerSubtitle}>
          {proposal.nameOfWork || proposal.title || 'Work Proposal'}
        </Text>
      </View>

      <View style={styles.content}>
        {/* Proposal Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Proposal ID</Text>
          <Text style={styles.infoValue}>{proposal._id || proposal.id}</Text>
          
          <Text style={styles.infoLabel}>Current Status</Text>
          <Text style={[styles.infoValue, styles.statusText]}>
            {proposal.currentStatus || proposal.status || 'Pending'}
          </Text>
        </View>

        {/* GPS Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 GPS Location</Text>
          {locationLoading ? (
            <View style={styles.locationLoading}>
              <ActivityIndicator color="#2196F3" />
              <Text style={styles.locationLoadingText}>Getting location...</Text>
            </View>
          ) : location ? (
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>
                Latitude: {location.latitude.toFixed(6)}
              </Text>
              <Text style={styles.locationText}>
                Longitude: {location.longitude.toFixed(6)}
              </Text>
              <TouchableOpacity 
                style={styles.refreshLocationButton} 
                onPress={getCurrentLocation}
              >
                <Text style={styles.refreshLocationText}>🔄 Refresh Location</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.getLocationButton} 
              onPress={getCurrentLocation}
            >
              <Text style={styles.getLocationText}>Get Location</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Status Update */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Update Status</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={status}
              onValueChange={(value) => setStatus(value)}
              style={styles.picker}
            >
              <Picker.Item label="Pending Technical Approval" value="Pending Technical Approval" />
              <Picker.Item label="Rejected Technical Approval" value="Rejected Technical Approval" />
              <Picker.Item label="Pending Administrative Approval" value="Pending Administrative Approval" />
              <Picker.Item label="Rejected Administrative Approval" value="Rejected Administrative Approval" />
              <Picker.Item label="Pending Tender" value="Pending Tender" />
              <Picker.Item label="Tender In Progress" value="Tender In Progress" />
              <Picker.Item label="Pending Work Order" value="Pending Work Order" />
              <Picker.Item label="Work Order Created" value="Work Order Created" />
              <Picker.Item label="Work In Progress" value="Work In Progress" />
              <Picker.Item label="Work Completed" value="Work Completed" />
              <Picker.Item label="Work Cancelled" value="Work Cancelled" />
              <Picker.Item label="Work Stopped" value="Work Stopped" />
              <Picker.Item label="Work Not Started" value="Work Not Started" />
            </Picker>
          </View>
        </View>

        {/* Important Note */}
        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>ℹ️ Note</Text>
          <Text style={styles.noteText}>
            After updating the status, you'll be prompted to submit a progress report with photos.
          </Text>
        </View>

        {/* Update Button */}
        <TouchableOpacity
          style={[styles.updateButton, (loading || !location) && styles.updateButtonDisabled]}
          onPress={handleUpdate}
          disabled={loading || !location}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.updateButtonText}>
              {location ? 'Update Status' : 'Waiting for location...'}
            </Text>
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
            <Text style={styles.modalTitle}>✅ Success!</Text>
            <Text style={styles.modalMessage}>
              Work status updated successfully!
            </Text>
            <Text style={styles.modalSubMessage}>
              Would you like to submit a progress report with photos?
            </Text>
            
            <TouchableOpacity
              style={styles.modalButtonPrimary}
              onPress={() => {
                setShowSuccessModal(false);
                setLoading(false);
                navigation.navigate('WorkProgress', { 
                  proposal: { ...proposal, currentStatus: status, status: status } 
                });
              }}
            >
              <Text style={styles.modalButtonTextPrimary}>📸 Submit Progress</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButtonSecondary}
              onPress={() => {
                setShowSuccessModal(false);
                setLoading(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.modalButtonTextSecondary}>← Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E3F2FD',
  },
  content: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    marginTop: 8,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  statusText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  locationLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  locationLoadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
  },
  locationInfo: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  refreshLocationButton: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshLocationText: {
    color: '#2196F3',
    fontWeight: '600',
    fontSize: 14,
  },
  getLocationButton: {
    padding: 16,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    alignItems: 'center',
  },
  getLocationText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  noteCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 14,
    color: '#E65100',
    lineHeight: 20,
  },
  updateButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  updateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  modalSubMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButtonPrimary: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  modalButtonTextPrimary: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtonSecondary: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalButtonTextSecondary: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WorkUpdateScreen;
