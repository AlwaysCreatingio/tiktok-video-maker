import { NextRequest, NextResponse } from 'next/server';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import os from 'os';

export async function POST(request: NextRequest) {
  const { config, durationInFrames } = await request.json();

  const tempDir = os.tmpdir();
  const outputPath = path.join(tempDir, `tiktok-video-${Date.now()}.mp4`);

  try {
    // Bundle the Remotion project
    const bundleLocation = await bundle({
      entryPoint: path.join(process.cwd(), 'src/remotion/index.ts'),
      webpackOverride: (config) => config,
    });

    // Select the composition
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'TikTokSlideshow',
      inputProps: config,
    });

    // Override duration
    composition.durationInFrames = durationInFrames;

    // Render the video
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: config,
    });

    // Read the file and return it
    const videoBuffer = fs.readFileSync(outputPath);

    // Cleanup
    fs.unlinkSync(outputPath);

    return new NextResponse(videoBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="tiktok-video.mp4"`,
      },
    });
  } catch (error) {
    console.error('Render error:', error);
    return NextResponse.json(
      { error: 'Failed to render video', details: String(error) },
      { status: 500 }
    );
  }
}
