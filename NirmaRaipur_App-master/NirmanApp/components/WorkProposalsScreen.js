import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { workAPI } from '../services/api';
import AuthService from '../services/auth';

const WorkProposalsScreen = ({ navigation }) => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  useEffect(() => {
    fetchProposals();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('WorkProposalsScreen focused - refreshing data...');
      setRefreshing(true);
      fetchProposals();
    }, [])
  );

  const fetchProposals = async () => {
    try {
      const data = await workAPI.getWorkProposals();
      console.log('Fetched proposals data:', data);
      console.log('Number of proposals:', Array.isArray(data) ? data.length : data?.data?.length || 0);
      
      // Handle different response structures
      let proposalsList = [];
      if (Array.isArray(data)) {
        proposalsList = data;
      } else if (data?.data && Array.isArray(data.data)) {
        proposalsList = data.data;
      } else if (data?.proposals && Array.isArray(data.proposals)) {
        proposalsList = data.proposals;
      }
      
      console.log('Setting proposals:', proposalsList.length);
      setProposals(proposalsList);
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Fetch proposals error:', error);
      
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
        Alert.alert('Error', 'Failed to fetch work proposals. Please try again.');
      }
      setProposals([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProposals();
  };

  const handleLogout = async () => {
    // Show logout confirmation modal instead of Alert
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      await AuthService.logout();
      setShowLogoutModal(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const renderProposal = ({ item }) => {
    // Backend uses 'currentStatus' field, fallback to 'status'
    const status = item.currentStatus || item.status || 'Pending';
    const statusStyle = getStatusStyle(status);
    
    return (
      <TouchableOpacity
        style={styles.proposalCard}
        onPress={() => navigation.navigate('WorkUpdate', { proposal: item })}
      >
        <View style={styles.proposalHeader}>
          <Text style={styles.proposalTitle} numberOfLines={2}>
            {item.title || item.nameOfWork || item.workName || item.description || 'Work Item'}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.color }]}>
            <Text style={styles.statusText}>
              {status}
            </Text>
          </View>
        </View>

        <Text style={styles.proposalDescription} numberOfLines={2}>
          {typeof item.description === 'string' ? item.description : 
           typeof item.workType === 'object' ? item.workType?.name : item.workType || 
           'No description available'}
        </Text>

        <View style={styles.proposalDetails}>
          <Text style={styles.detailText}>
            📍 {item.location || item.area || 'Location not specified'}
          </Text>
          <Text style={styles.detailText}>
            🏗️ {typeof item.agency === 'object' ? item.agency?.name : item.agency || 
                 typeof item.workAgency === 'object' ? item.workAgency?.name : item.workAgency || 
                 'Agency not specified'}
          </Text>
          {item.workProgress && item.workProgress.length > 0 && (
            <Text style={styles.detailText}>
              📊 {item.workProgress.length} progress report{item.workProgress.length > 1 ? 's' : ''}
            </Text>
          )}
        </View>

        <View style={styles.proposalFooter}>
          <Text style={styles.dateText}>
            {item.lastUpdated || item.updatedAt
              ? `Updated: ${new Date(item.lastUpdated || item.updatedAt).toLocaleDateString()}`
              : item.createdAt 
              ? `Created: ${new Date(item.createdAt).toLocaleDateString()}`
              : 'Date not available'
            }
          </Text>
          <Text style={styles.arrow}>→</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const getStatusStyle = (status) => {
    const statusLower = status?.toLowerCase() || '';
    
    // Completed statuses - Green
    if (statusLower.includes('completed') || statusLower.includes('work completed')) {
      return { color: '#4CAF50' };
    }
    
    // In Progress statuses - Orange
    if (statusLower.includes('progress') || statusLower.includes('tender in progress')) {
      return { color: '#FF9800' };
    }
    
    // Approved statuses - Blue
    if (statusLower.includes('approved') || statusLower.includes('work order created')) {
      return { color: '#2196F3' };
    }
    
    // Rejected/Cancelled/Stopped statuses - Red
    if (statusLower.includes('rejected') || statusLower.includes('cancelled') || 
        statusLower.includes('stopped') || statusLower.includes('not started')) {
      return { color: '#f44336' };
    }
    
    // Pending statuses - Gray/Blue
    if (statusLower.includes('pending')) {
      return { color: '#9E9E9E' };
    }
    
    // Default - Gray
    return { color: '#666' };
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>
          Loading work proposals...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>
            Work Proposals
          </Text>
          {lastRefreshed && (
            <Text style={styles.lastRefreshedText}>
              Updated: {lastRefreshed.toLocaleTimeString()}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={proposals}
        renderItem={renderProposal}
        keyExtractor={(item) => item._id || item.id || Math.random().toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2196F3']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No work proposals found
            </Text>
            <TouchableOpacity onPress={fetchProposals} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={proposals.length === 0 ? styles.emptyListContent : undefined}
      />

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalIcon}>🚪</Text>
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to logout?
            </Text>
            
            <TouchableOpacity
              style={styles.modalButtonDanger}
              onPress={confirmLogout}
            >
              <Text style={styles.modalButtonTextDanger}>Yes, Logout</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButtonCancel}
              onPress={() => setShowLogoutModal(false)}
            >
              <Text style={styles.modalButtonTextCancel}>Cancel</Text>
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
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  lastRefreshedText: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f44336',
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  proposalCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  proposalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  proposalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  proposalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  proposalDetails: {
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  proposalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  arrow: {
    fontSize: 18,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  emptyListContent: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#2196F3',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
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
    fontSize: 64,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtonDanger: {
    backgroundColor: '#f44336',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#f44336',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  modalButtonTextDanger: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtonCancel: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalButtonTextCancel: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WorkProposalsScreen;