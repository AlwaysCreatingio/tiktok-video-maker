import { NextRequest, NextResponse } from 'next/server';

type TextLayer = {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  color: string;
  textAlign: 'left' | 'center' | 'right';
  outline: 'none' | 'black' | 'white' | 'custom';
  outlineColor: string;
  scale: number;
  width: number;
  height: number;
};

type SlideWithLayers = {
  id: string;
  imageUrl: string;
  text: string;
  duration: number;
  textLayers: TextLayer[];
};

export async function POST(request: NextRequest) {
  try {
    const { slide, format } = await request.json() as {
      slide: SlideWithLayers;
      format: 'png' | 'jpg';
    };

    // Match editor preview aspect ratio (4:5)
    const width = 1080;
    const height = 1350;

    const sharp = (await import('sharp')).default;

    // Get base image
    let baseImage: Buffer;

    if (slide.imageUrl) {
      if (slide.imageUrl.startsWith('data:')) {
        // Base64 data URL
        const base64Data = slide.imageUrl.split(',')[1];
        baseImage = Buffer.from(base64Data, 'base64');
      } else {
        // Remote URL - fetch it
        const response = await fetch(slide.imageUrl);
        const arrayBuffer = await response.arrayBuffer();
        baseImage = Buffer.from(arrayBuffer);
      }

      // Resize and crop to fit TikTok dimensions
      baseImage = await sharp(baseImage)
        .resize(width, height, { fit: 'cover', position: 'center' })
        .toBuffer();
    } else {
      // No image - create black background
      baseImage = await sharp({
        create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 1 } }
      }).png().toBuffer();
    }

    // Create text overlay SVG
    const textSvg = createTextOverlaySvg(slide.textLayers, width, height);

    // Composite text over image
    const result = await sharp(baseImage)
      .composite([{
        input: Buffer.from(textSvg),
        top: 0,
        left: 0,
      }])
      [format === 'jpg' ? 'jpeg' : 'png']({ quality: 95 })
      .toBuffer();

    return new NextResponse(result, {
      headers: {
        'Content-Type': format === 'jpg' ? 'image/jpeg' : 'image/png',
        'Content-Disposition': `attachment; filename="slide.${format}"`,
      },
    });
  } catch (error) {
    console.error('Render image error:', error);
    return NextResponse.json(
      { error: 'Failed to render image', details: String(error) },
      { status: 500 }
    );
  }
}

function createTextOverlaySvg(textLayers: TextLayer[], width: number, height: number): string {
  const textElements = textLayers.map(layer => {
    const x = (layer.x / 100) * width;
    const y = (layer.y / 100) * height;
    const lines = layer.text.split('\n');

    // Calculate text shadow/outline
    let textShadow = '';
    if (layer.outline !== 'none') {
      const color = layer.outline === 'black' ? '#000000' :
                    layer.outline === 'white' ? '#ffffff' : layer.outlineColor;
      // Create stroke effect using multiple offset shadows
      const offsets = [
        [-2, -2], [-2, 0], [-2, 2],
        [0, -2], [0, 2],
        [2, -2], [2, 0], [2, 2]
      ];
      textShadow = offsets.map(([dx, dy]) =>
        `<tspan dx="${dx}" dy="${dy}" fill="${color}">${lines.map(l => escapeXml(l)).join(' ')}</tspan>`
      ).join('');
    }

    const textAnchor = layer.textAlign === 'left' ? 'start' :
                       layer.textAlign === 'right' ? 'end' : 'middle';

    // Clean font family name
    const fontFamily = layer.fontFamily
      .replace(/'/g, '')
      .split(',')[0]
      .trim();

    // Map generic fonts to system fonts
    const getFontFamily = (font: string) => {
      if (font.includes('TikTok') || font.includes('sans-serif')) return 'Arial, Helvetica, sans-serif';
      if (font.includes('serif')) return 'Georgia, Times, serif';
      if (font.includes('mono')) return 'Courier, monospace';
      return font;
    };

    const safeFont = getFontFamily(fontFamily);

    return `
      <text
        x="${x}"
        y="${y}"
        fill="${layer.color}"
        font-size="${layer.fontSize * 1.8}"
        font-family="${safeFont}"
        font-weight="${layer.fontWeight === '700' ? 'bold' : 'normal'}"
        text-anchor="${textAnchor}"
        dominant-baseline="middle"
        style="white-space: pre;"
      >${layer.outline !== 'none' ? `
        <tspan fill="${layer.outline === 'black' ? '#000' : layer.outline === 'white' ? '#fff' : layer.outlineColor}" stroke="${layer.outline === 'black' ? '#000' : layer.outline === 'white' ? '#fff' : layer.outlineColor}" stroke-width="4">${lines.map((line, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : layer.fontSize * 2.2}">${escapeXml(line)}</tspan>`).join('')}</tspan>` : ''}${lines.map((line, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : layer.fontSize * 2.2}">${escapeXml(line)}</tspan>`).join('')}
      </text>
    `;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    ${textElements}
  </svg>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
