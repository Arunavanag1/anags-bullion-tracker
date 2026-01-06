import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useGrades } from '../../hooks/useCoins';

interface GradePickerProps {
  value: string;
  onChange: (grade: string) => void;
  disabled?: boolean;
  isEstimated?: boolean;
}

export function GradePicker({ value, onChange, disabled, isEstimated }: GradePickerProps) {
  const { data: grades, isLoading } = useGrades();

  // Group grades by category for better UX
  const groupedGrades = grades.reduce((acc, grade) => {
    if (!acc[grade.gradeCategory]) {
      acc[grade.gradeCategory] = [];
    }
    acc[grade.gradeCategory].push(grade);
    return acc;
  }, {} as Record<string, typeof grades>);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Grade {isEstimated && <Text style={styles.estimated}>(Estimated)</Text>}
      </Text>

      {isLoading ? (
        <View style={styles.picker}>
          <Text style={styles.loading}>Loading grades...</Text>
        </View>
      ) : (
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={value}
            onValueChange={onChange}
            enabled={!disabled}
            style={styles.picker}
          >
            <Picker.Item label="Select grade..." value="" />
            {Object.entries(groupedGrades).map(([category, categoryGrades]) => (
              <React.Fragment key={category}>
                <Picker.Item
                  label={`── ${category} ──`}
                  value=""
                  enabled={false}
                  style={styles.categoryHeader}
                />
                {categoryGrades
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((grade) => (
                    <Picker.Item
                      key={grade.gradeCode}
                      label={`${grade.gradeCode} (${grade.gradeCategory})`}
                      value={grade.gradeCode}
                    />
                  ))}
              </React.Fragment>
            ))}
          </Picker>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  estimated: {
    color: '#F59E0B',
    fontStyle: 'italic',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  loading: {
    padding: 14,
    color: '#6B7280',
    fontSize: 14,
  },
  categoryHeader: {
    fontWeight: '600',
    color: '#6B7280',
  },
});
