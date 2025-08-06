/**
 * Animation Provider Component
 * Abstracts all animation logic into reusable components
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { Platform } from 'react-native';
import { AnimationVariant, AnimationConfig, AnimationState } from '@/types';

// Animation configurations
const ANIMATION_CONFIGS: Record<string, AnimationConfig> = {
  entrance: {
    entrance: {
      name: 'fadeIn',
      duration: 300,
      easing: 'ease-out',
      properties: {
        opacity: [0, 1],
        transform: [{ scale: [0.9, 1] }]
      }
    },
    exit: {
      name: 'fadeOut',
      duration: 200,
      easing: 'ease-in',
      properties: {
        opacity: [1, 0],
        transform: [{ scale: [1, 0.9] }]
      }
    },
    transition: {
      name: 'smooth',
      duration: 250,
      easing: 'ease-in-out',
      properties: {
        opacity: [1, 1],
        transform: [{ translateY: [0, 0] }]
      }
    }
  },
  slideUp: {
    entrance: {
      name: 'slideUp',
      duration: 400,
      easing: 'ease-out',
      properties: {
        opacity: [0, 1],
        transform: [{ translateY: [50, 0] }]
      }
    },
    exit: {
      name: 'slideDown',
      duration: 300,
      easing: 'ease-in',
      properties: {
        opacity: [1, 0],
        transform: [{ translateY: [0, 50] }]
      }
    },
    transition: {
      name: 'slide',
      duration: 300,
      easing: 'ease-in-out',
      properties: {
        opacity: [1, 1],
        transform: [{ translateY: [0, 0] }]
      }
    }
  },
  bounce: {
    entrance: {
      name: 'bounceIn',
      duration: 600,
      easing: 'ease-out',
      properties: {
        opacity: [0, 1],
        transform: [{ scale: [0.3, 1.1, 0.9, 1] }]
      }
    },
    exit: {
      name: 'bounceOut',
      duration: 400,
      easing: 'ease-in',
      properties: {
        opacity: [1, 0],
        transform: [{ scale: [1, 0.9, 1.1, 0.3] }]
      }
    },
    transition: {
      name: 'bounce',
      duration: 500,
      easing: 'ease-in-out',
      properties: {
        opacity: [1, 1],
        transform: [{ scale: [1, 1] }]
      }
    }
  },
  elastic: {
    entrance: {
      name: 'elasticIn',
      duration: 800,
      easing: 'ease-out',
      properties: {
        opacity: [0, 1],
        transform: [{ scale: [0, 1.2, 0.8, 1.1, 1] }]
      }
    },
    exit: {
      name: 'elasticOut',
      duration: 600,
      easing: 'ease-in',
      properties: {
        opacity: [1, 0],
        transform: [{ scale: [1, 1.1, 0.8, 1.2, 0] }]
      }
    },
    transition: {
      name: 'elastic',
      duration: 700,
      easing: 'ease-in-out',
      properties: {
        opacity: [1, 1],
        transform: [{ scale: [1, 1] }]
      }
    }
  }
};

// Animation context type
interface AnimationContextType {
  isAnimating: boolean;
  reducedMotion: boolean;
  playAnimation: (variant: string, type: 'entrance' | 'exit' | 'transition') => Promise<void>;
  getAnimationConfig: (variant: string) => AnimationConfig | null;
  supportsReducedMotion: () => boolean;
}

// Create context
const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

// Provider component
interface AnimationProviderProps {
  children: ReactNode;
}

export const AnimationProvider: React.FC<AnimationProviderProps> = ({ children }) => {
  const [animationState, setAnimationState] = React.useState<AnimationState>({
    isAnimating: false,
    currentAnimation: null,
    reducedMotion: false
  });

  // Check for reduced motion preference
  React.useEffect(() => {
    const checkReducedMotion = async () => {
      try {
        // In a real implementation, this would check platform-specific accessibility settings
        const prefersReducedMotion = false; // Placeholder
        setAnimationState(prev => ({ ...prev, reducedMotion: prefersReducedMotion }));
      } catch (error) {
        console.warn('Failed to check reduced motion preference:', error);
      }
    };

    checkReducedMotion();
  }, []);

  const playAnimation = async (
    variant: string, 
    type: 'entrance' | 'exit' | 'transition'
  ): Promise<void> => {
    // Skip animations if reduced motion is enabled
    if (animationState.reducedMotion) {
      return;
    }

    const config = ANIMATION_CONFIGS[variant];
    if (!config) {
      console.warn(`Animation variant '${variant}' not found`);
      return;
    }

    const animation = config[type];
    if (!animation) {
      console.warn(`Animation type '${type}' not found for variant '${variant}'`);
      return;
    }

    setAnimationState(prev => ({
      ...prev,
      isAnimating: true,
      currentAnimation: `${variant}_${type}`
    }));

    // Simulate animation duration
    await new Promise(resolve => setTimeout(resolve, animation.duration));

    setAnimationState(prev => ({
      ...prev,
      isAnimating: false,
      currentAnimation: null
    }));
  };

  const getAnimationConfig = (variant: string): AnimationConfig | null => {
    return ANIMATION_CONFIGS[variant] || null;
  };

  const supportsReducedMotion = (): boolean => {
    return Platform.OS === 'ios' || Platform.OS === 'android';
  };

  const value: AnimationContextType = {
    isAnimating: animationState.isAnimating,
    reducedMotion: animationState.reducedMotion,
    playAnimation,
    getAnimationConfig,
    supportsReducedMotion
  };

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
};

// Custom hook
export const useAnimation = (): AnimationContextType => {
  const context = useContext(AnimationContext);
  
  if (context === undefined) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  
  return context;
}; 