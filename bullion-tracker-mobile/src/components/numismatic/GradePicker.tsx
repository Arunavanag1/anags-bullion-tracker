import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
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
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Group grades by category for picker
  const groupedGrades = grades.reduce((acc, grade) => {
    if (!acc[grade.gradeCategory]) {
      acc[grade.gradeCategory] = [];
    }
    acc[grade.gradeCategory].push(grade);
    return acc;
  }, {} as Record<string, typeof grades>);

  // Filter grades for suggestions based on input
  const suggestions = useMemo(() => {
    if (!value || value.length < 1) return [];
    const searchLower = value.toLowerCase();
    return grades
      .filter(g => g.gradeCode.toLowerCase().includes(searchLower))
      .slice(0, 10);
  }, [value, grades]);

  // For RAW coins (isEstimated is defined), show text input with suggestions
  if (isEstimated !== undefined) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>
          Grade {isEstimated && <Text style={styles.estimated}>(Estimated)</Text>}
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={(text) => {
              onChange(text);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="e.g., MS65, VF30, AU58"
            placeholderTextColor="#9CA3AF"
            editable={!disabled}
            autoCapitalize="characters"
          />
        </View>
        <Text style={styles.helperText}>Type any grade or select from suggestions</Text>

        {showSuggestions && suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <ScrollView
              style={styles.suggestionsList}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {suggestions.map((item, index) => (
                <TouchableOpacity
                  key={item.gradeCode}
                  style={[styles.suggestionItem, index !== suggestions.length - 1 && styles.suggestionBorder]}
                  onPress={() => {
                    onChange(item.gradeCode);
                    setShowSuggestions(false);
                  }}
                >
                  <Text style={styles.suggestionText}>{item.gradeCode}</Text>
                  <Text style={styles.suggestionCategory}>{item.gradeCategory}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  }

  // For slabbed coins (PCGS/NGC), use picker dropdown
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Grade</Text>

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
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
  helperText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 6,
  },
  suggestionsContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    maxHeight: 200,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  suggestionCategory: {
    fontSize: 12,
    color: '#6B7280',
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
