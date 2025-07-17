import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { apiService, LocationSuggestion } from '../services/apiService';

interface LocationAutocompleteProps {
  placeholder: string;
  value: string;
  onLocationSelect: (location: LocationSuggestion) => void;
  onTextChange: (text: string) => void;
  icon: string;
  style?: any;
  onFocus?: () => void;
  onBlur?: () => void;
  showCurrentLocationButton?: boolean;
  onCurrentLocationPress?: () => void;
}

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  placeholder,
  value,
  onLocationSelect,
  onTextChange,
  icon,
  style,
  onFocus,
  onBlur,
  showCurrentLocationButton = false,
  onCurrentLocationPress
}) => {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const isProcessingSelection = useRef(false);
  const suggestionHeight = useSharedValue(0);

  // Animation for suggestions dropdown
  const suggestionStyle = useAnimatedStyle(() => {
    return {
      height: suggestionHeight.value,
      opacity: suggestionHeight.value > 0 ? 1 : 0,
    };
  });

  // Fetch autocomplete suggestions from backend using apiService
  const fetchSuggestions = async (input: string) => {
    if (input.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      suggestionHeight.value = withTiming(0, { duration: 200 });
      return;
    }

    setIsLoading(true);
    
    try {
      const suggestions = await apiService.getAutocompleteSuggestions(input);
      
      setSuggestions(suggestions);
      setShowSuggestions(true);
      
      // Animate suggestions dropdown
      const height = Math.min(suggestions.length * 60, 240); // Max 4 items visible
      suggestionHeight.value = withTiming(height, { duration: 300 });
    } catch (error) {
      console.error('Autocomplete API error:', error);
      setSuggestions([]);
      setShowSuggestions(false);
      suggestionHeight.value = withTiming(0, { duration: 200 });
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  const handleTextChange = (text: string) => {
    onTextChange(text);
    
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Set new timer
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(text);
    }, 300); // 300ms delay
  };

  // Handle suggestion selection
  const handleSuggestionPress = (suggestion: LocationSuggestion) => {
    if (isProcessingSelection.current) {
      console.log('⏳ Already processing selection, ignoring...');
      return;
    }

    isProcessingSelection.current = true;
    console.log('🎯 Suggestion pressed:', suggestion.description);

    // Immediately hide suggestions to prevent multiple selections
    setShowSuggestions(false);
    suggestionHeight.value = withTiming(0, { duration: 200 });
    setSuggestions([]);

    // Update text immediately and synchronously
    onTextChange(suggestion.description);

    // Call location selection handler immediately
    onLocationSelect(suggestion);

    // Dismiss keyboard
    Keyboard.dismiss();

    // Reset processing flag after a delay
    setTimeout(() => {
      isProcessingSelection.current = false;
    }, 500);

    console.log('✅ Suggestion selection completed');
  };

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
    
    // Show suggestions if we have them
    if (suggestions.length > 0) {
      setShowSuggestions(true);
      const height = Math.min(suggestions.length * 60, 240);
      suggestionHeight.value = withTiming(height, { duration: 300 });
    }
  };

  // Handle blur
  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();

    // Hide suggestions after a delay to allow for suggestion selection
    setTimeout(() => {
      if (!isProcessingSelection.current) {
        setShowSuggestions(false);
        suggestionHeight.value = withTiming(0, { duration: 200 });
      }
    }, 300);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);



  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputContainer}>
        <Ionicons name={icon as any} size={20} color="#6B7280" style={styles.inputIcon} />
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        
        {/* Loading indicator */}
        {isLoading && (
          <ActivityIndicator size="small" color="#3B82F6" style={styles.loadingIndicator} />
        )}
        
        {/* Current location button */}
        {showCurrentLocationButton && (
          <TouchableOpacity onPress={onCurrentLocationPress} style={styles.locationButton}>
            <Text style={styles.locationButtonText}>Use My Location</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Suggestions dropdown */}
      <Animated.View style={[styles.suggestionsContainer, suggestionStyle]}>
        {showSuggestions && (
          <ScrollView
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {suggestions.map((item) => (
              <TouchableOpacity
                key={item.place_id}
                style={styles.suggestionItem}
                onPress={() => {
                  console.log('🎯 Suggestion selected:', item.main_text);
                  handleSuggestionPress(item);
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="location-outline" size={16} color="#6B7280" style={styles.suggestionIcon} />
                <View style={styles.suggestionText} pointerEvents="none">
                  <Text style={styles.suggestionMainText} numberOfLines={1}>
                    {item.main_text}
                  </Text>
                  <Text style={styles.suggestionSecondaryText} numberOfLines={1}>
                    {item.secondary_text}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 10000,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontFamily: 'System',
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  locationButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  locationButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 1000,
    overflow: 'hidden',
    zIndex: 10000,
  },
  suggestionsList: {
    maxHeight: 240,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionText: {
    flex: 1,
  },
  suggestionMainText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  suggestionSecondaryText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
});

export default LocationAutocomplete;
