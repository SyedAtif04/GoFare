import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Pressable,
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
  const [isSelecting, setIsSelecting] = useState(false);

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

  // Handle suggestion selection with multiple fallback mechanisms
  const handleSuggestionPress = (suggestion: LocationSuggestion) => {
    console.log('🎯 Suggestion pressed:', suggestion.description);

    // Prevent multiple rapid selections
    if (isProcessingSelection.current) {
      console.log('⏳ Already processing selection, ignoring...');
      return;
    }

    isProcessingSelection.current = true;
    setIsSelecting(true);

    try {
      // Step 1: Hide suggestions immediately
      setShowSuggestions(false);
      suggestionHeight.value = withTiming(0, { duration: 150 });
      setSuggestions([]);

      // Step 2: Update text state with multiple attempts
      console.log('📝 Setting text to:', suggestion.description);

      // Primary text update
      onTextChange(suggestion.description);

      // Fallback text update after a tiny delay
      setTimeout(() => {
        onTextChange(suggestion.description);
        console.log('🔄 Fallback text update executed');
      }, 10);

      // Step 3: Call the location selection handler
      console.log('📍 Calling location handler...');
      onLocationSelect(suggestion);

      // Step 4: Dismiss keyboard
      Keyboard.dismiss();

      console.log('✅ Selection process completed successfully');
    } catch (error) {
      console.error('❌ Error in suggestion selection:', error);
      // Emergency fallback - try again
      setTimeout(() => {
        onTextChange(suggestion.description);
        onLocationSelect(suggestion);
        console.log('🚨 Emergency fallback executed');
      }, 50);
    } finally {
      // Reset processing flag
      setTimeout(() => {
        isProcessingSelection.current = false;
        setIsSelecting(false);
        console.log('🔄 Processing flag reset');
      }, 300);
    }
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
        {(isLoading || isSelecting) && (
          <ActivityIndicator size="small" color="#3B82F6" style={styles.loadingIndicator} />
        )}

        {/* Selection status indicator */}
        {isSelecting && (
          <Text style={styles.selectingText}>Selecting...</Text>
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
              <Pressable
                key={item.place_id}
                style={({ pressed }) => [
                  styles.suggestionItem,
                  pressed && { backgroundColor: '#F3F4F6' }
                ]}
                onPress={() => {
                  console.log('🔥 Pressable onPress triggered for:', item.main_text);
                  handleSuggestionPress(item);
                }}
                onPressIn={() => {
                  console.log('🔥 Pressable onPressIn triggered for:', item.main_text);
                }}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                android_ripple={{ color: '#E5E7EB' }}
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
              </Pressable>
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
  selectingText: {
    fontSize: 12,
    color: '#3B82F6',
    marginLeft: 8,
    fontWeight: '500',
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
