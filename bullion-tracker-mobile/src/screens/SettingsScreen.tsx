import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
  TextInput,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../lib/api';
import { Colors } from '../lib/colors';
import * as SecureStore from 'expo-secure-store';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const CONFIRMATION_TEXT = 'DELETE MY ACCOUNT';
const TOKEN_KEY = 'auth_token';

export function SettingsScreen({ navigation }: Props) {
  const { user, signOut } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmationText !== CONFIRMATION_TEXT) {
      setError('Please type "DELETE MY ACCOUNT" to confirm');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);

      const response = await fetch(`${API_URL}/api/auth/delete-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          password: password || undefined,
          confirmationText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to delete account');
        setLoading(false);
        return;
      }

      // Close modal and sign out
      setShowDeleteModal(false);
      await signOut();

      Alert.alert(
        'Account Deleted',
        'Your account has been permanently deleted.',
        [{ text: 'OK' }]
      );
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowDeleteModal(false);
    setPassword('');
    setConfirmationText('');
    setError('');
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://bullion-tracker-plum.vercel.app/privacy');
  };

  const openContactSupport = () => {
    Linking.openURL('https://bullion-tracker-plum.vercel.app/contact');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Account Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT INFORMATION</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{user?.name || 'Not set'}</Text>
            </View>
            <View style={[styles.infoRow, styles.lastRow]}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LEGAL</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.linkRow} onPress={openPrivacyPolicy}>
              <Text style={styles.linkText}>Privacy Policy</Text>
              <Text style={styles.linkArrow}>&rarr;</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.linkRow, styles.lastRow]} onPress={openContactSupport}>
              <Text style={styles.linkText}>Contact & Support</Text>
              <Text style={styles.linkArrow}>&rarr;</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>DANGER ZONE</Text>
          <View style={[styles.card, styles.dangerCard]}>
            <Text style={styles.dangerDescription}>
              Once you delete your account, there is no going back. All your data including your collection items, portfolio history, and account information will be permanently deleted.
            </Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => setShowDeleteModal(true)}
            >
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <Text style={styles.modalDescription}>
              This action cannot be undone. This will permanently delete your account and all associated data.
            </Text>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Enter your password to confirm</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="Your password"
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Type <Text style={styles.confirmationHighlight}>{CONFIRMATION_TEXT}</Text> to confirm
              </Text>
              <TextInput
                style={styles.input}
                value={confirmationText}
                onChangeText={setConfirmationText}
                placeholder="DELETE MY ACCOUNT"
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeModal}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.confirmDeleteButton,
                  (loading || confirmationText !== CONFIRMATION_TEXT) && styles.disabledButton,
                ]}
                onPress={handleDeleteAccount}
                disabled={loading || confirmationText !== CONFIRMATION_TEXT}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.confirmDeleteButtonText}>Delete Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  dangerTitle: {
    color: '#DC2626',
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  infoRow: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  linkText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  linkArrow: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  dangerDescription: {
    padding: 16,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  deleteButton: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#DC2626',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  confirmationHighlight: {
    fontFamily: 'monospace',
    backgroundColor: Colors.bgSecondary,
    paddingHorizontal: 4,
  },
  input: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.bgSecondary,
  },
  cancelButtonText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmDeleteButton: {
    backgroundColor: '#DC2626',
  },
  confirmDeleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
