'use client';

import { useState, useMemo } from 'react';

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

type ExportPopoverProps = {
  slides: SlideWithLayers[];
  onClose: () => void;
};

const DEFAULT_DURATION = 3;

export const ExportModal: React.FC<ExportPopoverProps> = ({ slides, onClose }) => {
  const [selectedSlides, setSelectedSlides] = useState<Set<string>>(
    () => new Set(slides.map(s => s.id))
  );
  const [exportFormat, setExportFormat] = useState<'images' | 'video'>('images');
  const [imageFormat, setImageFormat] = useState<'png' | 'jpg'>('png');
  const [globalDuration, setGlobalDuration] = useState(DEFAULT_DURATION);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const allSelected = selectedSlides.size === slides.length;
  const noneSelected = selectedSlides.size === 0;

  const toggleSlide = (id: string) => {
    const newSet = new Set(selectedSlides);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedSlides(newSet);
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedSlides(new Set());
    } else {
      setSelectedSlides(new Set(slides.map(s => s.id)));
    }
  };

  const selectedSlidesData = useMemo(() => {
    return slides
      .filter(s => selectedSlides.has(s.id))
      .map(s => ({ ...s, duration: globalDuration }));
  }, [slides, selectedSlides, globalDuration]);

  const totalDuration = useMemo(() => {
    return selectedSlidesData.length * globalDuration;
  }, [selectedSlidesData.length, globalDuration]);

  const handleExport = async () => {
    if (noneSelected) return;
    setIsExporting(true);
    setExportProgress(0);

    try {
      if (exportFormat === 'images') {
        await exportImages();
      } else {
        await exportVideo();
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const exportImages = async () => {
    const selectedArray = Array.from(selectedSlides);

    if (selectedArray.length === 1) {
      const slide = slides.find(s => s.id === selectedArray[0]);
      if (!slide) return;

      setExportProgress(50);
      const response = await fetch('/api/render-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slide, format: imageFormat }),
      });

      if (!response.ok) throw new Error('Failed to render image');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `slide-1.${imageFormat}`;
      a.click();
      URL.revokeObjectURL(url);
      setExportProgress(100);
    } else {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      let completed = 0;
      for (const slideId of selectedArray) {
        const slideIndex = slides.findIndex(s => s.id === slideId);
        const slide = slides[slideIndex];
        if (!slide) continue;

        const response = await fetch('/api/render-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slide, format: imageFormat }),
        });

        if (!response.ok) throw new Error(`Failed to render slide ${slideIndex + 1}`);

        const blob = await response.blob();
        zip.file(`slide-${slideIndex + 1}.${imageFormat}`, blob);

        completed++;
        setExportProgress(Math.round((completed / selectedArray.length) * 90));
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'slides.zip';
      a.click();
      URL.revokeObjectURL(url);
      setExportProgress(100);
    }
  };

  const exportVideo = async () => {
    setExportProgress(10);

    const config = {
      slides: selectedSlidesData,
      transition: 'fade' as const,
      transitionDuration: 0.3,
      backgroundColor: '#000000',
      textColor: '#ffffff',
      highlightColor: '#ff0050',
      fontSize: 64,
      fontStyle: 'bold' as const,
    };

    const durationInFrames = Math.round(totalDuration * 30);

    const response = await fetch('/api/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config, durationInFrames }),
    });

    setExportProgress(80);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || 'Failed to render video');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tiktok-video.mp4';
    a.click();
    URL.revokeObjectURL(url);
    setExportProgress(100);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Popover */}
      <div className="absolute top-14 right-4 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 w-[420px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Export</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Format Selection */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex bg-gray-100 rounded-lg p-0.5 w-fit">
            <button
              onClick={() => setExportFormat('images')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                exportFormat === 'images'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Images
            </button>
            <button
              onClick={() => setExportFormat('video')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                exportFormat === 'video'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Video
            </button>
          </div>
        </div>

        {/* Select All */}
        <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="w-4 h-4 rounded border-gray-300 text-[#fe2c55] focus:ring-[#fe2c55]"
            />
            <span className="text-sm font-medium text-gray-700">Select All</span>
            <span className="text-xs text-gray-400">
              ({selectedSlides.size}/{slides.length})
            </span>
          </label>
        </div>

        {/* Slides Grid */}
        <div className="max-h-[240px] overflow-y-auto px-4 py-3">
          <div className="grid grid-cols-5 gap-2">
            {slides.map((slide, index) => {
              const isSelected = selectedSlides.has(slide.id);
              return (
                <button
                  key={slide.id}
                  onClick={() => toggleSlide(slide.id)}
                  className={`relative aspect-[4/5] rounded-lg overflow-hidden border-2 transition ${
                    isSelected ? 'border-[#fe2c55]' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {slide.imageUrl && (
                    <img
                      src={slide.imageUrl}
                      alt={`Slide ${index + 1}`}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  {/* Checkbox overlay */}
                  <div className="absolute top-1 left-1">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      isSelected
                        ? 'bg-[#fe2c55] border-[#fe2c55]'
                        : 'bg-white/80 border-gray-300'
                    }`}>
                      {isSelected && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  {/* Slide number */}
                  <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1 py-0.5 rounded">
                    {index + 1}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Format Options */}
        <div className="px-4 py-3 border-t border-gray-100">
          {exportFormat === 'images' && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Format:</span>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setImageFormat('png')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                    imageFormat === 'png'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  PNG
                </button>
                <button
                  onClick={() => setImageFormat('jpg')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                    imageFormat === 'jpg'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  JPG
                </button>
              </div>
            </div>
          )}

          {exportFormat === 'video' && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Duration:</span>
              <input
                type="number"
                min="0.5"
                max="30"
                step="0.5"
                value={globalDuration}
                onChange={(e) => setGlobalDuration(parseFloat(e.target.value) || DEFAULT_DURATION)}
                className="w-16 px-2 py-1 text-sm text-center border border-gray-300 rounded-md"
              />
              <span className="text-sm text-gray-500">seconds per slide</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {exportFormat === 'video' && selectedSlides.size > 0 && (
                <span>{selectedSlides.size} slides · {totalDuration.toFixed(1)}s total</span>
              )}
              {exportFormat === 'images' && selectedSlides.size > 0 && (
                <span>{selectedSlides.size} image{selectedSlides.size > 1 ? 's' : ''}</span>
              )}
              {noneSelected && <span className="text-gray-400">Select slides to export</span>}
            </div>
            <button
              onClick={handleExport}
              disabled={noneSelected || isExporting}
              className="px-5 py-1.5 bg-[#fe2c55] text-white text-sm font-medium rounded-full hover:bg-[#e91e45] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>{exportProgress}%</span>
                </>
              ) : (
                'Export'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
