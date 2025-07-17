import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Switch,
  Modal,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: {
    cabTypes: string[];
    surgeFreOnly: boolean;
  };
  onFiltersChange: (filters: { cabTypes: string[]; surgeFreOnly: boolean }) => void;
}

const FilterSheet: React.FC<FilterSheetProps> = ({ visible, onClose, filters, onFiltersChange }) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const cabTypeOptions = [
    { id: 'bike', name: 'Bike', icon: 'two-wheeler', color: '#FF6B35' },
    { id: 'mini', name: 'Mini', icon: 'directions-car', color: '#3B82F6' },
    { id: 'sedan', name: 'Sedan', icon: 'directions-car', color: '#10B981' },
    { id: 'suv', name: 'SUV', icon: 'airport-shuttle', color: '#8B5CF6' },
    { id: 'auto', name: 'Auto', icon: 'local-taxi', color: '#F59E0B' },
  ];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const toggleCabType = (cabType: string) => {
    const newCabTypes = filters.cabTypes.includes(cabType)
      ? filters.cabTypes.filter(type => type !== cabType)
      : [...filters.cabTypes, cabType];
    
    onFiltersChange({
      ...filters,
      cabTypes: newCabTypes,
    });
  };

  const toggleSurgeFree = (value: boolean) => {
    onFiltersChange({
      ...filters,
      surgeFreOnly: value,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      cabTypes: ['bike', 'mini', 'sedan', 'suv', 'auto'],
      surgeFreOnly: false,
    });
  };

  const CabTypeButton = ({ option }: { option: typeof cabTypeOptions[0] }) => {
    const isSelected = filters.cabTypes.includes(option.id);
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePress = () => {
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 0.95,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();
      toggleCabType(option.id);
    };

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={handlePress}
          style={[
            styles.cabTypeButton,
            isSelected && { backgroundColor: option.color + '20', borderColor: option.color },
          ]}
        >
          <MaterialIcons
            name={option.icon as any}
            size={24}
            color={isSelected ? option.color : '#6B7280'}
          />
          <Text style={[
            styles.cabTypeText,
            isSelected && { color: option.color, fontWeight: '600' },
          ]}>
            {option.name}
          </Text>
          {isSelected && (
            <View style={[styles.selectedBadge, { backgroundColor: option.color }]}>
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.backdropTouch} onPress={onClose} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Filter & Sort</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Vehicle Types */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vehicle Types</Text>
              <View style={styles.cabTypesGrid}>
                {cabTypeOptions.map((option) => (
                  <CabTypeButton key={option.id} option={option} />
                ))}
              </View>
            </View>

            {/* Surge Filter */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pricing</Text>
              <View style={styles.surgeFilter}>
                <View style={styles.surgeInfo}>
                  <Ionicons name="trending-up" size={20} color="#EF4444" />
                  <View style={styles.surgeTextContainer}>
                    <Text style={styles.surgeTitle}>Surge-free only</Text>
                    <Text style={styles.surgeSubtitle}>Hide rides with surge pricing</Text>
                  </View>
                </View>
                <Switch
                  value={filters.surgeFreOnly}
                  onValueChange={toggleSurgeFree}
                  trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                  thumbColor={filters.surgeFreOnly ? '#FFFFFF' : '#F3F4F6'}
                />
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity onPress={clearAllFilters} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={onClose} style={styles.applyButton}>
                <LinearGradient
                  colors={['#3B82F6', '#06B6D4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.applyButtonGradient}
                >
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropTouch: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    maxHeight: height * 0.8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter_600SemiBold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  cabTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cabTypeButton: {
    width: (width - 72) / 3,
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cabTypeText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontFamily: 'Inter_400Regular',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  surgeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  surgeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  surgeTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  surgeTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    fontFamily: 'Inter_500Medium',
  },
  surgeSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontFamily: 'Inter_400Regular',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Inter_600SemiBold',
  },
  applyButton: {
    flex: 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  applyButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
});

export default FilterSheet;
