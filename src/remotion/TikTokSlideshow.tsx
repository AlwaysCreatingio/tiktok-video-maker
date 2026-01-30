import React from 'react';
import { AbsoluteFill, Sequence, useVideoConfig } from 'remotion';
import { SlideComponent } from './SlideComponent';
import type { SlideshowConfig } from '../lib/types';

export type TikTokSlideshowProps = SlideshowConfig;

export const TikTokSlideshow: React.FC<TikTokSlideshowProps> = ({
  slides,
  transition,
  transitionDuration,
  backgroundColor,
  textColor,
  highlightColor,
  fontSize,
  fontStyle,
}) => {
  const { fps } = useVideoConfig();

  if (slides.length === 0) {
    return (
      <AbsoluteFill style={{ backgroundColor, justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: '#666', fontSize: 28, textAlign: 'center', padding: 40 }}>
          Enter your script and click Generate
        </div>
      </AbsoluteFill>
    );
  }

  const transitionFrames = Math.round(transitionDuration * fps);
  let currentFrame = 0;

  const slidePositions = slides.map((slide, index) => {
    const startFrame = currentFrame;
    const durationFrames = Math.round(slide.duration * fps);
    if (index > 0 && transition !== 'none') {
      currentFrame += durationFrames - transitionFrames;
    } else {
      currentFrame += durationFrames;
    }
    return { startFrame, durationFrames };
  });

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {slides.map((slideData, index) => {
        const { startFrame, durationFrames } = slidePositions[index];
        return (
          <Sequence key={slideData.id} from={startFrame} durationInFrames={durationFrames}>
            <SlideComponent
              slide={slideData}
              textColor={textColor}
              highlightColor={highlightColor}
              fontSize={fontSize}
              fontStyle={fontStyle}
              backgroundColor={backgroundColor}
              transitionType={transition}
              transitionDuration={transitionDuration}
              isFirst={index === 0}
              isLast={index === slides.length - 1}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
