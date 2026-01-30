import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Slide, TransitionType } from '../lib/types';

type SlideComponentProps = {
  slide: Slide;
  textColor: string;
  highlightColor: string;
  fontSize: number;
  fontStyle: 'bold' | 'outline' | 'shadow';
  backgroundColor: string;
  transitionType?: TransitionType;
  transitionDuration?: number;
  isFirst?: boolean;
  isLast?: boolean;
};

export const SlideComponent: React.FC<SlideComponentProps> = ({
  slide,
  textColor,
  highlightColor,
  fontSize,
  fontStyle,
  backgroundColor,
  transitionType = 'fade',
  transitionDuration = 0.3,
  isFirst = true,
  isLast = true,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const transitionFrames = Math.round(transitionDuration * fps);

  // Ken Burns effect
  const scale = interpolate(frame, [0, durationInFrames], [1, 1.08], {
    extrapolateRight: 'clamp',
  });

  // Text animation
  const textOpacity = interpolate(frame, [0, fps * 0.2], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const textY = interpolate(frame, [0, fps * 0.2], [20, 0], {
    extrapolateRight: 'clamp',
  });

  // Entry/exit animations
  const entryOpacity = isFirst ? 1 : interpolate(frame, [0, transitionFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const exitOpacity = isLast ? 1 : interpolate(
    frame,
    [durationInFrames - transitionFrames, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const opacity = transitionType === 'none' ? 1 : Math.min(entryOpacity, exitOpacity);

  // Render text with highlight
  const renderText = () => {
    if (!slide.text) return null;

    const words = slide.text.split(' ');
    const highlightWord = slide.highlightWord;

    const getTextStyle = (): React.CSSProperties => {
      const base: React.CSSProperties = {
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '-0.02em',
        lineHeight: 1.1,
      };

      switch (fontStyle) {
        case 'outline':
          return {
            ...base,
            color: 'transparent',
            WebkitTextStroke: `3px ${textColor}`,
          };
        case 'shadow':
          return {
            ...base,
            color: textColor,
            textShadow: '4px 4px 0px rgba(0,0,0,0.3), 8px 8px 0px rgba(0,0,0,0.1)',
          };
        default:
          return {
            ...base,
            color: textColor,
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          };
      }
    };

    return (
      <div
        style={{
          position: 'absolute',
          bottom: 200,
          left: 60,
          right: 60,
          textAlign: 'center',
          fontSize,
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
          ...getTextStyle(),
        }}
      >
        {words.map((word, i) => (
          <span
            key={i}
            style={{
              color: word.toLowerCase() === highlightWord?.toLowerCase() ? highlightColor : undefined,
              WebkitTextStroke: fontStyle === 'outline' && word.toLowerCase() === highlightWord?.toLowerCase()
                ? `3px ${highlightColor}`
                : undefined,
            }}
          >
            {word}{' '}
          </span>
        ))}
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ backgroundColor, opacity }}>
      {slide.imageUrl && (
        <AbsoluteFill>
          <Img
            src={slide.imageUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${scale})`,
            }}
          />
          {/* Gradient overlay for text readability */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '50%',
              background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
            }}
          />
        </AbsoluteFill>
      )}
      {renderText()}
    </AbsoluteFill>
  );
};
