import { Composition } from 'remotion';
import { TikTokSlideshow, TikTokSlideshowProps } from './TikTokSlideshow';
import { DEFAULT_CONFIG } from '../lib/types';

// TikTok dimensions: 1080x1920 (9:16 aspect ratio)
const TIKTOK_WIDTH = 1080;
const TIKTOK_HEIGHT = 1920;
const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="TikTokSlideshow"
      component={TikTokSlideshow}
      durationInFrames={300} // Will be overridden by calculateMetadata
      fps={FPS}
      width={TIKTOK_WIDTH}
      height={TIKTOK_HEIGHT}
      defaultProps={DEFAULT_CONFIG satisfies TikTokSlideshowProps}
    />
  );
};
