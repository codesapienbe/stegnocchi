import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/Navigation';
import { PlatformAPI } from '@/platform';
import { pickMultipleFiles as pickMultipleFilesWeb } from '@/web/utils/filePicker';
import { BatchProcessor, BatchJob } from '@/utils/batchProcessor';

type BatchScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Batch'>;

export const BatchScreen: React.FC = () => {
  const navigation = useNavigation<BatchScreenNavigationProp>();
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState<{ total: number; completed: number; failed: number } | null>(null);

  const handleBack = (): void => {
    navigation.goBack();
  };

  const handlePickAndProcess = async (): Promise<void> => {
    if (isRunning) return;
    setSummary(null);
    let result: { cancelled: boolean; files: File[] };
    if (Platform.OS === 'web') {
      const webRes = await pickMultipleFilesWeb({ mediaTypes: 'images', maxFiles: 10 });
      result = { cancelled: webRes.cancelled, files: webRes.files };
    } else {
      const pickFiles = PlatformAPI.useFilePicker();
      const first = await pickFiles({ mediaTypes: 'images', allowsMultipleSelection: true, maxFiles: 10 });
      result = { cancelled: first.cancelled, files: first.file ? [first.file] as unknown as File[] : [] };
    }
    if (result.cancelled || result.files.length === 0) return;

    setIsRunning(true);

    const bp = new BatchProcessor({ maxConcurrent: 3 });
    bp.addFiles(result.files);

    const processFn = async (file: File) => {
      // Placeholder: simulate brief work with the file without core calls
      await new Promise((r) => setTimeout(r, 150));
      return { ok: true, fileName: (file as any).name };
    };

    const res = await bp.startProcessing(processFn);
    setSummary({ total: res.totalJobs, completed: res.completedJobs, failed: res.failedJobs });
    setIsRunning(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Batch Processing</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.primaryButton} onPress={handlePickAndProcess} disabled={isRunning}>
          <Ionicons name="images" size={20} color="white" />
          <Text style={styles.primaryButtonText}>{isRunning ? 'Processing…' : 'Select Images & Process'}</Text>
        </TouchableOpacity>

        {summary && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Summary</Text>
            <View style={styles.row}><Text style={styles.label}>Total</Text><Text style={styles.value}>{summary.total}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Completed</Text><Text style={styles.value}>{summary.completed}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Failed</Text><Text style={styles.value}>{summary.failed}</Text></View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },
  headerSpacer: { width: 32 },
  content: { flex: 1, padding: 20 },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: { color: 'white', fontWeight: '600', marginLeft: 8 },
  card: {
    marginTop: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  label: { fontSize: 14, color: '#374151' },
  value: { fontSize: 14, color: '#111827', fontWeight: '600' },
}); 