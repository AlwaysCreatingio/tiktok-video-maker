export type TransitionType = 'fade' | 'slide' | 'wipe' | 'none';

export type Slide = {
  id: string;
  imageUrl: string;
  text: string;
  highlightWord?: string;
  duration: number;
};

export type SlideshowConfig = {
  slides: Slide[];
  transition: TransitionType;
  transitionDuration: number;
  backgroundColor: string;
  textColor: string;
  highlightColor: string;
  fontSize: number;
  fontStyle: 'bold' | 'outline' | 'shadow';
};

export const DEFAULT_CONFIG: SlideshowConfig = {
  slides: [],
  transition: 'fade',
  transitionDuration: 0.3,
  backgroundColor: '#000000',
  textColor: '#ffffff',
  highlightColor: '#ff0050',
  fontSize: 64,
  fontStyle: 'bold',
};

export const HOOK_TEMPLATES = [
  "5 things you didn't know about {topic}",
  "Why {topic} is changing everything",
  "The truth about {topic} no one talks about",
  "Stop scrolling if you care about {topic}",
  "{topic} explained in 30 seconds",
  "I wish I knew this about {topic} sooner",
  "The #1 mistake people make with {topic}",
  "How {topic} actually works",
];

export const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1080&h=1350&fit=crop',
  'https://images.unsplash.com/photo-1501436513145-30f24e19fcc8?w=1080&h=1350&fit=crop',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1080&h=1350&fit=crop',
  'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=1080&h=1350&fit=crop',
  'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=1080&h=1350&fit=crop',
];
