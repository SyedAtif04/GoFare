import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';

// Animation configurations
const EASE_OUT = Easing.out(Easing.cubic);

// Fade In Animation Hook
export const useFadeIn = (delay: number = 0) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 500, easing: EASE_OUT })
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: 500, easing: EASE_OUT })
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return animatedStyle;
};

// Slide Up Animation Hook
export const useSlideUp = (delay: number = 0) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 400, easing: EASE_OUT })
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: 400, easing: EASE_OUT })
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return animatedStyle;
};

// Scale In Animation Hook
export const useScaleIn = (delay: number = 0) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 300, easing: EASE_OUT })
    );
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 15, stiffness: 150 })
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  return animatedStyle;
};

// Stagger Animation Hook - for animating multiple children with delays
export const useStagger = (itemCount: number, baseDelay: number = 0, staggerDelay: number = 100) => {
  const animations = [];
  
  for (let i = 0; i < itemCount; i++) {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(20);
    const delay = baseDelay + (i * staggerDelay);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      opacity.value = withDelay(
        delay,
        withTiming(1, { duration: 400, easing: EASE_OUT })
      );
      translateY.value = withDelay(
        delay,
        withTiming(0, { duration: 400, easing: EASE_OUT })
      );
    }, [delay]);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const animatedStyle = useAnimatedStyle(() => {
      return {
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
      };
    });

    animations.push(animatedStyle);
  }

  return animations;
};

// Preset animation configurations for direct use
export const fadeIn = {
  duration: 500,
  easing: EASE_OUT,
  initialOpacity: 0,
  initialTranslateY: 20,
};

export const slideUp = {
  duration: 400,
  easing: EASE_OUT,
  initialOpacity: 0,
  initialTranslateY: 30,
};

export const scaleIn = {
  duration: 300,
  easing: EASE_OUT,
  initialOpacity: 0,
  initialScale: 0.9,
};

// Helper function to create custom animations
export const createAnimation = (
  opacity: any,
  transform: any,
  duration: number = 400,
  delay: number = 0
) => {
  'worklet';
  
  return {
    opacity: withDelay(delay, withTiming(opacity, { duration, easing: EASE_OUT })),
    transform: transform.map((t: any) => {
      if (t.translateY !== undefined) {
        return { translateY: withDelay(delay, withTiming(t.translateY, { duration, easing: EASE_OUT })) };
      }
      if (t.translateX !== undefined) {
        return { translateX: withDelay(delay, withTiming(t.translateX, { duration, easing: EASE_OUT })) };
      }
      if (t.scale !== undefined) {
        return { scale: withDelay(delay, withSpring(t.scale, { damping: 15, stiffness: 150 })) };
      }
      return t;
    }),
  };
};
