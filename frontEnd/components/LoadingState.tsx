import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const LoadingState: React.FC = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Shimmer animation
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    // Pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    // Rotate animation
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );

    shimmerAnimation.start();
    pulseAnimation.start();
    rotateAnimation.start();

    return () => {
      shimmerAnimation.stop();
      pulseAnimation.stop();
      rotateAnimation.stop();
    };
  }, []);

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const SkeletonCard = ({ delay = 0 }: { delay?: number }) => {
    const cardAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View style={[styles.skeletonCard, { opacity: cardAnim }]}>
        <View style={styles.skeletonCardContent}>
          {/* Provider Logo */}
          <View style={styles.skeletonLogo} />
          
          {/* Content */}
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonSubtitle} />
            <View style={styles.skeletonPrice} />
          </View>
          
          {/* Button */}
          <View style={styles.skeletonButton} />
        </View>
        
        {/* Shimmer overlay */}
        <Animated.View
          style={[
            styles.shimmerOverlay,
            {
              transform: [{ translateX: shimmerTranslateX }],
            },
          ]}
        >
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shimmerGradient}
          />
        </Animated.View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      {/* Background */}
      <LinearGradient
        colors={['#F0F9FF', '#E0F2FE', '#F8FAFC']}
        style={styles.background}
      />

      {/* Header Skeleton */}
      <View style={styles.headerSkeleton}>
        <View style={styles.skeletonBackButton} />
        <View style={styles.skeletonHeaderContent}>
          <View style={styles.skeletonHeaderTitle} />
          <View style={styles.skeletonHeaderSubtitle} />
        </View>
        <View style={styles.skeletonFilterButton} />
      </View>

      {/* Toggle Skeleton */}
      <View style={styles.toggleSkeleton}>
        <View style={styles.skeletonToggleButton} />
        <View style={styles.skeletonToggleButton} />
      </View>

      {/* Loading Indicator */}
      <View style={styles.loadingContainer}>
        <Animated.View
          style={[
            styles.loadingIcon,
            {
              transform: [
                { scale: pulseAnim },
                { rotate: rotateInterpolate },
              ],
            },
          ]}
        >
          <Ionicons name="car-sport" size={40} color="#3B82F6" />
        </Animated.View>
        
        <Text style={styles.loadingText}>Fetching fares…</Text>
        <Text style={styles.loadingSubtext}>Finding the best rides for you</Text>
        
        {/* Loading dots */}
        <View style={styles.loadingDots}>
          {[0, 1, 2].map((index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  opacity: shimmerAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: index === 0 ? [0.3, 1, 0.3] : index === 1 ? [1, 0.3, 1] : [0.3, 1, 0.3],
                  }),
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Skeleton Cards */}
      <View style={styles.skeletonCards}>
        <SkeletonCard delay={0} />
        <SkeletonCard delay={200} />
        <SkeletonCard delay={400} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  skeletonBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  skeletonHeaderContent: {
    flex: 1,
    marginLeft: 16,
  },
  skeletonHeaderTitle: {
    width: 120,
    height: 18,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  skeletonHeaderSubtitle: {
    width: 200,
    height: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginTop: 4,
  },
  skeletonFilterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  toggleSkeleton: {
    flexDirection: 'row',
    margin: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  skeletonToggleButton: {
    flex: 1,
    height: 44,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    marginHorizontal: 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EBF8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    fontFamily: 'Inter_600SemiBold',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Inter_400Regular',
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginHorizontal: 4,
  },
  skeletonCards: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
  },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  skeletonCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  skeletonLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
  },
  skeletonContent: {
    flex: 1,
    marginLeft: 16,
  },
  skeletonTitle: {
    width: 80,
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonSubtitle: {
    width: 120,
    height: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonPrice: {
    width: 60,
    height: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  skeletonButton: {
    width: 80,
    height: 36,
    backgroundColor: '#E5E7EB',
    borderRadius: 18,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shimmerGradient: {
    flex: 1,
    width: 100,
  },
});

export default LoadingState;
