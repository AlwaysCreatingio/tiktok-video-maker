'use client';

import { useState, useMemo, useRef } from 'react';
import { DEFAULT_CONFIG, SAMPLE_IMAGES, type SlideshowConfig, type Slide } from '../lib/types';

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

type SlideWithLayers = Slide & {
  textLayers: TextLayer[];
};

const FONTS = [
  { name: 'TikTok Sans', value: "'TikTok Sans', sans-serif" },
  { name: 'System', value: '-apple-system, BlinkMacSystemFont, sans-serif' },
  { name: 'Serif', value: 'Georgia, serif' },
  { name: 'Mono', value: 'ui-monospace, monospace' },
];

const FONT_SIZES = [20, 24, 28, 32, 36, 40, 48, 56, 64];

export default function Home() {
  const [config, setConfig] = useState<SlideshowConfig>(DEFAULT_CONFIG);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<string[]>(SAMPLE_IMAGES);
  const [showSettings, setShowSettings] = useState(false);
  const [slides, setSlides] = useState<SlideWithLayers[]>(() => {
    // Example slideshow on load
    const exampleTexts = [
      'things you didn\'t\nknow about sleep',
      'your phone\'s blue light\nisn\'t the problem',
      'it\'s the dopamine\nhits keeping you awake',
      'try leaving your phone\nin another room',
      'follow for more tips',
    ];
    return exampleTexts.map((text, i) => ({
      id: `slide-${i}`,
      imageUrl: SAMPLE_IMAGES[i % SAMPLE_IMAGES.length],
      text: '',
      duration: i === 0 ? 2.5 : i === exampleTexts.length - 1 ? 3 : 3,
      textLayers: [{
        id: `text-${i}`,
        text,
        x: 50,
        y: 50,
        fontSize: 32,
        fontFamily: "'TikTok Sans', sans-serif",
        fontWeight: '400',
        color: '#ffffff',
        textAlign: 'center' as const,
        outline: 'none' as const,
        outlineColor: '#000000',
        scale: 1,
        width: 230,
        height: 60,
      }],
    }));
  });
  const [selectedSlideIndex, setSelectedSlideIndex] = useState<number | null>(0);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredSlideIndex, setHoveredSlideIndex] = useState<number | null>(null);
  const [snapGuides, setSnapGuides] = useState<{ horizontal: boolean; vertical: boolean }>({ horizontal: false, vertical: false });
  const [draggedSlideIndex, setDraggedSlideIndex] = useState<number | null>(null);
  const [slideMenu, setSlideMenu] = useState<{ index: number; x: number; y: number } | null>(null);
  const [isOverTrash, setIsOverTrash] = useState(false);
  const [draggingLayerId, setDraggingLayerId] = useState<string | null>(null);
  const [activeToolbarMenu, setActiveToolbarMenu] = useState<'font' | 'align' | 'color' | 'stroke' | null>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const trashRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedSlide = selectedSlideIndex !== null ? slides[selectedSlideIndex] : null;
  const selectedLayer = selectedSlide?.textLayers.find(l => l.id === selectedTextId);

  const generateSlidesWithAI = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);

    setTimeout(() => {
      const slideCountMatch = prompt.match(/(\d+)\s*slides?/i);
      const slideCount = slideCountMatch ? parseInt(slideCountMatch[1]) : 5;

      const newSlides: SlideWithLayers[] = [];

      for (let i = 0; i < slideCount; i++) {
        const isFirst = i === 0;
        const isLast = i === slideCount - 1;

        let text = '';
        if (isFirst) {
          text = 'how to play with\nsomeone\'s mind';
        } else if (isLast) {
          text = 'follow for more';
        } else {
          const tactics = [
            'make them wait.\nuncertainty creates\nobsession.',
            'mirror their\nwords back.',
            'give less than\nexpected.',
            'change the subject\nsuddenly.',
            'agree, then do\nwhat you want.',
          ];
          text = tactics[(i - 1) % tactics.length];
        }

        newSlides.push({
          id: `slide-${Date.now()}-${i}`,
          imageUrl: images[i % images.length],
          text: '',
          duration: isFirst ? 3 : isLast ? 4 : 3.5,
          textLayers: [{
            id: `text-${Date.now()}-${i}`,
            text,
            x: 50,
            y: 50,
            fontSize: 32,
            fontFamily: "'TikTok Sans', sans-serif",
            fontWeight: '400',
            color: '#ffffff',
            textAlign: 'center',
            outline: 'none',
            outlineColor: '#000000',
            scale: 1,
            width: 230,
            height: 60,
          }],
        });
      }

      setSlides(newSlides);
      setSelectedSlideIndex(0);
      setIsGenerating(false);
    }, 1500);
  };

  const updateSlide = (index: number, updates: Partial<SlideWithLayers>) => {
    const newSlides = [...slides];
    newSlides[index] = { ...newSlides[index], ...updates };
    setSlides(newSlides);
  };

  const updateTextLayer = (slideIndex: number, layerId: string, updates: Partial<TextLayer>) => {
    const slide = slides[slideIndex];
    if (!slide) return;
    const newLayers = slide.textLayers.map(layer =>
      layer.id === layerId ? { ...layer, ...updates } : layer
    );
    updateSlide(slideIndex, { textLayers: newLayers });
  };

  const addTextLayer = (slideIndex: number) => {
    const slide = slides[slideIndex];
    if (!slide) return;
    const newLayer: TextLayer = {
      id: `text-${Date.now()}`,
      text: 'new text',
      x: 50,
      y: 50,
      fontSize: 32,
      fontFamily: "'TikTok Sans', sans-serif",
      fontWeight: '400',
      color: '#ffffff',
      textAlign: 'center',
      outline: 'none',
      outlineColor: '#000000',
      scale: 1,
      width: 230,
      height: 60,
    };
    updateSlide(slideIndex, {
      textLayers: [...slide.textLayers, newLayer],
    });
    setSelectedSlideIndex(slideIndex);
    setSelectedTextId(newLayer.id);
    setEditingTextId(newLayer.id);
  };

  const deleteTextLayer = (slideIndex: number, layerId: string) => {
    const slide = slides[slideIndex];
    if (!slide) return;
    const newLayers = slide.textLayers.filter(l => l.id !== layerId);
    updateSlide(slideIndex, { textLayers: newLayers });
    setSelectedTextId(null);
  };

  const removeSlide = (index: number) => {
    setSlides(prev => prev.filter((_, i) => i !== index));
    setSelectedSlideIndex(null);
    setSelectedTextId(null);
  };

  const addSlide = () => {
    const newSlide: SlideWithLayers = {
      id: `slide-${Date.now()}`,
      imageUrl: images[slides.length % images.length],
      text: '',
      duration: 3,
      textLayers: [],
    };
    setSlides(prev => [...prev, newSlide]);
    setSelectedSlideIndex(slides.length);
  };

  const reorderSlides = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const newSlides = [...slides];
    const [removed] = newSlides.splice(fromIndex, 1);
    newSlides.splice(toIndex, 0, removed);
    setSlides(newSlides);
    setSelectedSlideIndex(toIndex);
  };

  const handleChangeImage = (index: number) => {
    setSlideMenu(null);
    if (fileInputRef.current) {
      fileInputRef.current.dataset.slideIndex = String(index);
      fileInputRef.current.click();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const index = parseInt(e.target.dataset.slideIndex || '0');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      updateSlide(index, { imageUrl: url });
    };
    reader.readAsDataURL(files[0]);
    e.target.value = '';
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        setImages(prev => [...prev, url]);
      };
      reader.readAsDataURL(file);
    });
  };

  const assignImageToSlide = (imageUrl: string) => {
    if (selectedSlideIndex !== null) {
      updateSlide(selectedSlideIndex, { imageUrl });
    }
  };

  const SNAP_THRESHOLD = 3; // percentage threshold for snapping

  const handleTextDrag = (e: React.MouseEvent, slideIndex: number, layerId: string) => {
    const slideEl = slideRefs.current[slideIndex];
    const textEl = e.currentTarget as HTMLElement;
    if (!slideEl || !textEl) return;
    e.preventDefault();
    e.stopPropagation();
    setSelectedSlideIndex(slideIndex);
    setSelectedTextId(layerId);

    const rect = slideEl.getBoundingClientRect();
    const layer = slides[slideIndex]?.textLayers.find(l => l.id === layerId);
    let finalX = layer?.x ?? 50;
    let finalY = layer?.y ?? 50;
    let rafId: number;
    let overTrash = false;
    let hasMoved = false;
    const startX = e.clientX;
    const startY = e.clientY;
    const DRAG_THRESHOLD = 5;

    const onMouseMove = (e: MouseEvent) => {
      // Only start dragging after moving past threshold
      if (!hasMoved) {
        const dx = Math.abs(e.clientX - startX);
        const dy = Math.abs(e.clientY - startY);
        if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) return;
        hasMoved = true;
        setIsDragging(true);
        setDraggingLayerId(layerId);
      }

      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        let x = ((e.clientX - rect.left) / rect.width) * 100;
        let y = ((e.clientY - rect.top) / rect.height) * 100;

        // Snap to center
        const snapH = Math.abs(x - 50) < SNAP_THRESHOLD;
        const snapV = Math.abs(y - 50) < SNAP_THRESHOLD;

        if (snapH) x = 50;
        if (snapV) y = 50;

        setSnapGuides({ horizontal: snapV, vertical: snapH });

        finalX = Math.max(5, Math.min(95, x));
        finalY = Math.max(5, Math.min(95, y));
        textEl.style.left = `${finalX}%`;
        textEl.style.top = `${finalY}%`;

        // Check if over trash
        if (trashRef.current) {
          const trashRect = trashRef.current.getBoundingClientRect();
          overTrash = e.clientX >= trashRect.left && e.clientX <= trashRect.right &&
                      e.clientY >= trashRect.top && e.clientY <= trashRect.bottom;
          setIsOverTrash(overTrash);
        }
      });
    };

    const onMouseUp = () => {
      cancelAnimationFrame(rafId);
      setIsDragging(false);
      setDraggingLayerId(null);
      setSnapGuides({ horizontal: false, vertical: false });

      if (hasMoved) {
        if (overTrash) {
          deleteTextLayer(slideIndex, layerId);
        } else {
          updateTextLayer(slideIndex, layerId, { x: finalX, y: finalY });
        }
      }
      setIsOverTrash(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleTextResize = (e: React.MouseEvent, slideIndex: number, layerId: string, direction?: 'width' | 'height' | 'both') => {
    const slideEl = slideRefs.current[slideIndex];
    if (!slideEl) return;
    e.preventDefault();
    e.stopPropagation();

    const layer = slides[slideIndex]?.textLayers.find(l => l.id === layerId);
    if (!layer) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = layer.width;
    const startHeight = layer.height;
    const dir = direction || 'both';
    let rafId: number;

    const onMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        const updates: Partial<TextLayer> = {};
        if (dir === 'width' || dir === 'both') {
          updates.width = Math.max(60, startWidth + deltaX);
        }
        if (dir === 'height' || dir === 'both') {
          updates.height = Math.max(30, startHeight + deltaY);
        }
        updateTextLayer(slideIndex, layerId, updates);
      });
    };

    const onMouseUp = () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleCornerResize = (e: React.MouseEvent, slideIndex: number, layerId: string) => {
    const slideEl = slideRefs.current[slideIndex];
    if (!slideEl) return;
    e.preventDefault();
    e.stopPropagation();

    const layer = slides[slideIndex]?.textLayers.find(l => l.id === layerId);
    if (!layer) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = layer.width;
    const startFontSize = layer.fontSize;
    let rafId: number;

    const onMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        // Use the larger of the two deltas for proportional scaling
        const delta = Math.max(deltaX, deltaY);
        const scaleFactor = 1 + delta / 200;

        const newWidth = Math.max(60, Math.round(startWidth * scaleFactor));
        const newFontSize = Math.max(12, Math.min(120, Math.round(startFontSize * scaleFactor)));

        updateTextLayer(slideIndex, layerId, {
          width: newWidth,
          fontSize: newFontSize,
        });
      });
    };

    const onMouseUp = () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const totalDuration = useMemo(() => {
    return slides.reduce((sum, s) => sum + s.duration, 0);
  }, [slides]);

  return (
    <div className="h-screen flex flex-col bg-[#f8f8f8] text-gray-900 overflow-hidden" onClick={() => setSlideMenu(null)}>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
      />
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#fe2c55] rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 6L16 12L8 18V6Z"/>
                </svg>
              </div>
              <span className="font-semibold text-gray-900">ReelMaker</span>
            </div>
          </div>

          <nav className="flex-1 p-3">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-gray-100 text-gray-900 rounded-lg text-sm font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Slideshow
            </button>
          </nav>

          <div className="p-3 border-t border-gray-100">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                showSettings ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
          </div>
        </aside>

        {/* Preview/Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">

          {/* Export Button */}
          <button
            disabled={slides.length === 0}
            className="absolute top-3 right-4 px-12 py-2 bg-[#fe2c55] text-white text-[15px] font-medium rounded-full hover:bg-[#e91e45] disabled:opacity-40 disabled:cursor-not-allowed transition z-10"
          >
            Export
          </button>

          {/* Main Content */}
          <div className="flex-1 flex flex-col items-center justify-center py-6 overflow-hidden gap-4">
            {slides.length === 0 ? (
              <div className="flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">No slides yet</p>
                </div>
              </div>
            ) : selectedSlide && selectedSlideIndex !== null ? (
              <div className="flex items-center gap-4">
                <div
                  ref={el => slideRefs.current[selectedSlideIndex] = el}
                  className="relative w-[500px] aspect-[4/5] bg-black rounded-lg"
                  onClick={() => {
                    setSelectedTextId(null);
                    setEditingTextId(null);
                  }}
                >
                {selectedSlide.imageUrl && (
                  <img
                    src={selectedSlide.imageUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                    draggable={false}
                  />
                )}

                {/* Snap guide lines */}
                {isDragging && (
                  <>
                    {snapGuides.vertical && (
                      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-cyan-400 -translate-x-1/2 pointer-events-none z-50" />
                    )}
                    {snapGuides.horizontal && (
                      <div className="absolute left-0 right-0 top-1/2 h-px bg-cyan-400 -translate-y-1/2 pointer-events-none z-50" />
                    )}
                  </>
                )}

                {/* Text Layers */}
                {selectedSlide.textLayers.map((layer) => {
                  const isSelected = selectedTextId === layer.id;

                  return (
                    <div
                      key={layer.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTextId(layer.id);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingTextId(layer.id);
                      }}
                      onMouseDown={(e) => {
                        if (editingTextId !== layer.id) {
                          handleTextDrag(e, selectedSlideIndex, layer.id);
                        }
                      }}
                      className={`absolute ${isSelected ? 'ring-1 ring-white' : ''}`}
                      style={{
                        left: `${layer.x}%`,
                        top: `${layer.y}%`,
                        transform: 'translate(-50%, -50%)',
                        width: `${layer.width * 2.08}px`,
                        minHeight: `${layer.height}px`,
                        minWidth: '80px',
                        zIndex: isSelected ? 1000 : 1,
                        boxSizing: 'border-box',
                        cursor: editingTextId === layer.id ? 'text' : 'move',
                      }}
                    >
                      {editingTextId === layer.id ? (
                        <textarea
                          autoFocus
                          value={layer.text}
                          onChange={(e) => updateTextLayer(selectedSlideIndex, layer.id, { text: e.target.value })}
                          onBlur={() => setEditingTextId(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') setEditingTextId(null);
                          }}
                          placeholder="Enter text..."
                          className="w-full bg-transparent resize-none focus:outline-none box-border block overflow-hidden"
                          style={{
                            color: layer.color,
                            fontSize: `${layer.fontSize * 0.92}px`,
                            fontFamily: layer.fontFamily,
                            fontWeight: layer.fontWeight,
                            textAlign: layer.textAlign,
                            lineHeight: 1.2,
                            padding: '4px',
                            margin: 0,
                            height: 'auto',
                            minHeight: `${layer.fontSize * 0.92 * 1.2 + 8}px`,
                            fieldSizing: 'content',
                            textShadow: layer.outline === 'none' ? undefined :
                              `${layer.outline === 'black' ? '#000' : layer.outline === 'white' ? '#fff' : layer.outlineColor} -1px -1px 0px, ${layer.outline === 'black' ? '#000' : layer.outline === 'white' ? '#fff' : layer.outlineColor} 1px -1px 0px, ${layer.outline === 'black' ? '#000' : layer.outline === 'white' ? '#fff' : layer.outlineColor} -1px 1px 0px, ${layer.outline === 'black' ? '#000' : layer.outline === 'white' ? '#fff' : layer.outlineColor} 1px 1px 0px`,
                          } as React.CSSProperties}
                        />
                      ) : (
                        <div
                          className="w-full select-none"
                          style={{
                            color: layer.color,
                            fontSize: `${layer.fontSize * 0.92}px`,
                            fontFamily: layer.fontFamily,
                            fontWeight: layer.fontWeight,
                            textAlign: layer.textAlign,
                            lineHeight: 1.2,
                            padding: '4px',
                            whiteSpace: 'pre-wrap',
                            textShadow: layer.outline === 'none' ? undefined :
                              `${layer.outline === 'black' ? '#000' : layer.outline === 'white' ? '#fff' : layer.outlineColor} -1px -1px 0px, ${layer.outline === 'black' ? '#000' : layer.outline === 'white' ? '#fff' : layer.outlineColor} 1px -1px 0px, ${layer.outline === 'black' ? '#000' : layer.outline === 'white' ? '#fff' : layer.outlineColor} -1px 1px 0px, ${layer.outline === 'black' ? '#000' : layer.outline === 'white' ? '#fff' : layer.outlineColor} 1px 1px 0px`,
                          }}
                        >
                          {layer.text || 'Double-click to edit'}
                        </div>
                      )}

                      {/* Resize handles */}
                      {isSelected && (
                        <>
                          {/* Width handles (sides) */}
                          <div style={{ position: 'absolute', userSelect: 'none', width: '10px', height: '100%', top: 0, right: '-5px', cursor: 'ew-resize' }} onMouseDown={(e) => handleTextResize(e, selectedSlideIndex, layer.id, 'width')}>
                            <div className="w-2 h-2 bg-white border border-gray-400 absolute top-1/2 -translate-y-1/2 right-0" />
                          </div>
                          <div style={{ position: 'absolute', userSelect: 'none', width: '10px', height: '100%', top: 0, left: '-5px', cursor: 'ew-resize' }} onMouseDown={(e) => handleTextResize(e, selectedSlideIndex, layer.id, 'width')}>
                            <div className="w-2 h-2 bg-white border border-gray-400 absolute top-1/2 -translate-y-1/2 left-0" />
                          </div>
                          {/* Height handles (top/bottom) */}
                          <div style={{ position: 'absolute', userSelect: 'none', height: '10px', width: '100%', top: '-5px', left: 0, cursor: 'ns-resize' }} onMouseDown={(e) => handleTextResize(e, selectedSlideIndex, layer.id, 'height')}>
                            <div className="w-2 h-2 bg-white border border-gray-400 absolute left-1/2 -translate-x-1/2 top-0" />
                          </div>
                          <div style={{ position: 'absolute', userSelect: 'none', height: '10px', width: '100%', bottom: '-5px', left: 0, cursor: 'ns-resize' }} onMouseDown={(e) => handleTextResize(e, selectedSlideIndex, layer.id, 'height')}>
                            <div className="w-2 h-2 bg-white border border-gray-400 absolute left-1/2 -translate-x-1/2 bottom-0" />
                          </div>
                          {/* Corner handles (scale text + box proportionally) */}
                          <div
                            style={{ position: 'absolute', userSelect: 'none', width: '14px', height: '14px', bottom: '-7px', right: '-7px', cursor: 'nwse-resize' }}
                            onMouseDown={(e) => handleCornerResize(e, selectedSlideIndex, layer.id)}
                          >
                            <div className="w-3 h-3 bg-white border border-gray-400 rounded-sm" />
                          </div>
                          <div
                            style={{ position: 'absolute', userSelect: 'none', width: '14px', height: '14px', bottom: '-7px', left: '-7px', cursor: 'nesw-resize' }}
                            onMouseDown={(e) => handleCornerResize(e, selectedSlideIndex, layer.id)}
                          >
                            <div className="w-3 h-3 bg-white border border-gray-400 rounded-sm" />
                          </div>
                          <div
                            style={{ position: 'absolute', userSelect: 'none', width: '14px', height: '14px', top: '-7px', right: '-7px', cursor: 'nesw-resize' }}
                            onMouseDown={(e) => handleCornerResize(e, selectedSlideIndex, layer.id)}
                          >
                            <div className="w-3 h-3 bg-white border border-gray-400 rounded-sm" />
                          </div>
                          <div
                            style={{ position: 'absolute', userSelect: 'none', width: '14px', height: '14px', top: '-7px', left: '-7px', cursor: 'nwse-resize' }}
                            onMouseDown={(e) => handleCornerResize(e, selectedSlideIndex, layer.id)}
                          >
                            <div className="w-3 h-3 bg-white border border-gray-400 rounded-sm" />
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}

                {/* Trash drop zone - appears when dragging text */}
                {draggingLayerId && (
                  <div
                    ref={trashRef}
                    className={`absolute bottom-4 left-1/2 -translate-x-1/2 p-4 rounded-full transition-all ${
                      isOverTrash ? 'bg-red-500 scale-125' : 'bg-black/50'
                    }`}
                  >
                    <svg className={`w-6 h-6 ${isOverTrash ? 'text-white' : 'text-white/70'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                )}

                {/* Top Text Toolbar - Font, Alignment, Color, Stroke */}
                {selectedLayer && !draggingLayerId && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent rounded-t-lg px-4 pt-3 pb-8 flex items-center justify-center gap-3 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setActiveToolbarMenu(activeToolbarMenu === 'font' ? null : 'font')}
                      className="p-3 rounded-full hover:bg-white/10 transition"
                    >
                      <span className="text-2xl font-serif text-white">Aa</span>
                    </button>
                    <button
                      onClick={() => {
                        const alignments: ('left' | 'center' | 'right')[] = ['left', 'center', 'right'];
                        const currentIndex = alignments.indexOf(selectedLayer.textAlign);
                        const nextIndex = (currentIndex + 1) % alignments.length;
                        updateTextLayer(selectedSlideIndex, selectedTextId!, { textAlign: alignments[nextIndex] });
                      }}
                      className="p-3 rounded-full hover:bg-white/10 transition"
                    >
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {selectedLayer.textAlign === 'left' && (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
                        )}
                        {selectedLayer.textAlign === 'center' && (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M5 18h14" />
                        )}
                        {selectedLayer.textAlign === 'right' && (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M6 18h14" />
                        )}
                      </svg>
                    </button>
                    <button
                      onClick={() => setActiveToolbarMenu(activeToolbarMenu === 'color' ? null : 'color')}
                      className="p-3 rounded-full hover:bg-white/10 transition"
                    >
                      <div className="w-7 h-7 rounded-full border-2 border-white overflow-hidden" style={{ background: `conic-gradient(from 0deg, hsl(0,70%,65%), hsl(45,70%,65%), hsl(90,70%,65%), hsl(135,70%,65%), hsl(180,70%,65%), hsl(225,70%,65%), hsl(270,70%,65%), hsl(315,70%,65%), hsl(360,70%,65%))`, filter: 'blur(3px)' }} />
                    </button>
                    <button
                      onClick={() => setActiveToolbarMenu(activeToolbarMenu === 'stroke' ? null : 'stroke')}
                      className="p-3 rounded-full hover:bg-white/10 transition"
                    >
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 18h16" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16" strokeDasharray="4 2" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Bottom Text Toolbar - Shows options for selected tool */}
                {selectedLayer && !draggingLayerId && activeToolbarMenu && activeToolbarMenu !== 'align' && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent rounded-b-lg px-4 pb-3 pt-8 flex items-center justify-center gap-3 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                    {activeToolbarMenu === 'font' && (
                      <>
                        <select
                          value={selectedLayer.fontFamily}
                          onChange={(e) => updateTextLayer(selectedSlideIndex, selectedTextId!, { fontFamily: e.target.value })}
                          className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none"
                        >
                          {FONTS.map(font => (
                            <option key={font.value} value={font.value} className="text-gray-900">{font.name}</option>
                          ))}
                        </select>
                        <select
                          value={selectedLayer.fontSize}
                          onChange={(e) => updateTextLayer(selectedSlideIndex, selectedTextId!, { fontSize: parseInt(e.target.value) })}
                          className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none w-20"
                        >
                          {FONT_SIZES.map(size => (
                            <option key={size} value={size} className="text-gray-900">{size}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => updateTextLayer(selectedSlideIndex, selectedTextId!, { fontWeight: selectedLayer.fontWeight === '700' ? '400' : '700' })}
                          className={`px-4 py-1.5 rounded-lg text-sm font-bold text-white transition ${selectedLayer.fontWeight === '700' ? 'bg-white/20' : 'bg-white/10 hover:bg-white/15'}`}
                        >
                          B
                        </button>
                      </>
                    )}
                    {activeToolbarMenu === 'color' && (
                      <>
                        <input
                          type="color"
                          value={selectedLayer.color}
                          onChange={(e) => updateTextLayer(selectedSlideIndex, selectedTextId!, { color: e.target.value })}
                          className="w-8 h-8 rounded-full cursor-pointer border-2 border-white/50"
                        />
                        {['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'].map(color => (
                          <button
                            key={color}
                            onClick={() => updateTextLayer(selectedSlideIndex, selectedTextId!, { color })}
                            className={`w-8 h-8 rounded-full border-2 transition ${selectedLayer.color === color ? 'border-white scale-110' : 'border-white/30 hover:border-white/60'}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </>
                    )}
                    {activeToolbarMenu === 'stroke' && (
                      <>
                        {[
                          { value: 'none', label: 'None' },
                          { value: 'black', label: 'Black' },
                          { value: 'white', label: 'White' },
                        ].map(option => (
                          <button
                            key={option.value}
                            onClick={() => updateTextLayer(selectedSlideIndex, selectedTextId!, { outline: option.value as any })}
                            className={`px-4 py-1.5 rounded-lg text-sm text-white transition ${selectedLayer.outline === option.value ? 'bg-white/20' : 'hover:bg-white/10'}`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}

              </div>

                {/* Vertical Toolbar */}
                <div className="flex flex-col items-center bg-white border border-gray-200 rounded-xl shadow-sm px-1 py-1">
                  {/* Replace Image */}
                  <div className="relative group">
                    <button
                      onClick={() => handleChangeImage(selectedSlideIndex)}
                      className="p-2.5 rounded-lg hover:bg-gray-100 transition"
                    >
                      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                      Replace Image
                    </div>
                  </div>
                  <div className="h-px w-6 bg-gray-200" />
                  {/* Add Text */}
                  <div className="relative group">
                    <button
                      onClick={() => addTextLayer(selectedSlideIndex)}
                      className="p-2.5 rounded-lg hover:bg-gray-100 transition"
                    >
                      <span className="text-gray-700 font-semibold text-sm">Aa</span>
                    </button>
                    <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                      Add Text
                    </div>
                  </div>
                  <div className="h-px w-6 bg-gray-200" />
                  {/* Filter */}
                  <div className="relative group">
                    <button
                      className="p-2.5 rounded-lg hover:bg-gray-100 transition"
                    >
                      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </button>
                    <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                      Filters
                    </div>
                  </div>
                  <div className="h-px w-6 bg-gray-200" />
                  {/* Crop */}
                  <div className="relative group">
                    <button
                      className="p-2.5 rounded-lg hover:bg-gray-100 transition"
                    >
                      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4M3 12h18" />
                      </svg>
                    </button>
                    <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                      Crop
                    </div>
                  </div>
                  <div className="h-px w-6 bg-gray-200" />
                  {/* Aspect Ratio */}
                  <div className="relative group">
                    <button
                      className="p-2.5 rounded-lg hover:bg-gray-100 transition"
                    >
                      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    </button>
                    <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                      Aspect Ratio
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Select a slide to preview</p>
            )}

            {/* Thumbnail Strip */}
            {slides.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto overflow-y-visible p-2 pb-4">
                {slides.map((slide, index) => (
                  <div key={slide.id} className="relative flex-shrink-0">
                    <button
                      draggable
                      onDragStart={() => setDraggedSlideIndex(index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (draggedSlideIndex !== null) {
                          reorderSlides(draggedSlideIndex, index);
                          setDraggedSlideIndex(null);
                        }
                      }}
                      onDragEnd={() => setDraggedSlideIndex(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSlideIndex(index);
                        setSelectedTextId(null);
                        setEditingTextId(null);
                        setSlideMenu(null);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedSlideIndex(index);
                        setSlideMenu({ index, x: e.clientX, y: e.clientY });
                      }}
                      className={`relative w-[48px] aspect-square bg-black overflow-hidden transition-all rounded-lg cursor-grab active:cursor-grabbing ${
                        selectedSlideIndex === index
                          ? 'ring-2 ring-[#fe2c55]'
                          : 'ring-1 ring-gray-200 hover:ring-2 hover:ring-gray-300'
                      } ${draggedSlideIndex === index ? 'opacity-50' : ''}`}
                    >
                      {slide.imageUrl && (
                        <img src={slide.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
                      )}
                    </button>
                  </div>
                ))}

                {/* Add Slide */}
                <div className="relative flex-shrink-0">
                  <button
                    onClick={addSlide}
                    className="w-[48px] aspect-square bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition rounded-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Fixed Position Slide Menu */}
      {slideMenu && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-[100] min-w-[140px]"
          style={{ left: slideMenu.x, top: slideMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              handleChangeImage(slideMenu.index);
              setSlideMenu(null);
            }}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Change Image
          </button>
          <button
            onClick={() => {
              removeSlide(slideMenu.index);
              setSlideMenu(null);
            }}
            className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-200 transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
