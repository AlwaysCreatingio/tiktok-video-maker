'use client';

import { Player } from '@remotion/player';
import { TikTokSlideshow } from '../remotion/TikTokSlideshow';
import type { SlideshowConfig } from '../lib/types';

type VideoPreviewProps = {
  config: SlideshowConfig;
  durationInFrames: number;
};

export const VideoPreview: React.FC<VideoPreviewProps> = ({ config, durationInFrames }) => {
  return (
    <Player
      component={TikTokSlideshow}
      inputProps={config}
      durationInFrames={Math.max(durationInFrames, 30)}
      fps={30}
      compositionWidth={1080}
      compositionHeight={1920}
      style={{
        width: '100%',
        aspectRatio: '9/16',
      }}
      controls
      autoPlay={false}
      loop
    />
  );
};
