import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Type, Check, Share2 } from 'lucide-react';

interface StoryEditorProps {
  file: File;
  onShare: (imageDataUrl: string) => void;
  onClose: () => void;
}

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
}

export function StoryEditor({ file, onShare, onClose }: StoryEditorProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [texts, setTexts] = useState<TextOverlay[]>([]);
  const [isAddingText, setIsAddingText] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [currentColor, setCurrentColor] = useState('#ffffff');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleAddText = () => {
    if (currentText.trim()) {
      setTexts([...texts, {
        id: Date.now().toString(),
        text: currentText,
        x: 0,
        y: 0,
        color: currentColor,
        fontSize: 32
      }]);
    }
    setCurrentText('');
    setIsAddingText(false);
  };

  const handleShare = async () => {
    if (!containerRef.current || !imageRef.current) return;
    setIsProcessing(true);
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Set canvas dimensions to 1080x1920 (standard story size)
      canvas.width = 1080;
      canvas.height = 1920;

      // Fill background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Calculate image drawing parameters
      const img = imageRef.current;
      
      // Calculate scale to cover the canvas
      const scaleX = canvas.width / img.naturalWidth;
      const scaleY = canvas.height / img.naturalHeight;
      const baseScale = Math.max(scaleX, scaleY);
      
      const finalScale = baseScale * zoom;
      
      const scaledWidth = img.naturalWidth * finalScale;
      const scaledHeight = img.naturalHeight * finalScale;
      
      // Calculate center position
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Apply pan (pan is in screen pixels, need to map to canvas pixels)
      const containerRect = containerRef.current.getBoundingClientRect();
      const ratioX = canvas.width / containerRect.width;
      const ratioY = canvas.height / containerRect.height;
      
      const drawX = centerX - (scaledWidth / 2) + (pan.x * ratioX);
      const drawY = centerY - (scaledHeight / 2) + (pan.y * ratioY);

      ctx.drawImage(img, drawX, drawY, scaledWidth, scaledHeight);

      // Draw texts
      texts.forEach(t => {
        ctx.font = `bold ${t.fontSize * ratioY}px sans-serif`;
        ctx.fillStyle = t.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Text coordinates are relative to the center of the container
        const textX = centerX + (t.x * ratioX);
        const textY = centerY + (t.y * ratioY);
        
        // Add text shadow for better visibility
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
        
        ctx.fillText(t.text, textX, textY);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      });

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      onShare(dataUrl);
    } catch (error) {
      console.error("Error generating story image:", error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white z-10">
        <button onClick={onClose} className="p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors">
          <X className="w-6 h-6" />
        </button>
        <button onClick={() => setIsAddingText(true)} className="p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors">
          <Type className="w-6 h-6" />
        </button>
      </div>

      {/* Editor Area */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center" ref={containerRef}>
        {imageUrl && (
          <motion.img
            ref={imageRef}
            src={imageUrl}
            className="absolute max-w-none origin-center cursor-move"
            style={{ 
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              x: pan.x,
              y: pan.y,
              scale: zoom
            }}
            drag
            dragMomentum={false}
            onDrag={(e, info) => {
              setPan({ x: pan.x + info.delta.x, y: pan.y + info.delta.y });
            }}
          />
        )}

        {/* Texts */}
        {texts.map((t, i) => (
          <motion.div
            key={t.id}
            drag
            dragMomentum={false}
            onDrag={(e, info) => {
              const newTexts = [...texts];
              newTexts[i] = { ...t, x: t.x + info.delta.x, y: t.y + info.delta.y };
              setTexts(newTexts);
            }}
            className="absolute cursor-move font-bold whitespace-nowrap z-10"
            style={{ 
              color: t.color,
              x: t.x,
              y: t.y,
              fontSize: `${t.fontSize}px`,
              textShadow: '0 2px 10px rgba(0,0,0,0.5)'
            }}
          >
            {t.text}
          </motion.div>
        ))}

        {/* Add Text Overlay */}
        {isAddingText && (
          <div className="absolute inset-0 bg-black/80 z-20 flex flex-col items-center justify-center p-4">
            <input
              autoFocus
              type="text"
              value={currentText}
              onChange={e => setCurrentText(e.target.value)}
              className="bg-transparent text-white text-4xl font-bold text-center outline-none w-full"
              placeholder="Type something..."
              style={{ color: currentColor }}
            />
            <div className="flex gap-4 mt-8">
              {['#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#000000'].map(c => (
                <button
                  key={c}
                  onClick={() => setCurrentColor(c)}
                  className={`w-10 h-10 rounded-full border-2 ${currentColor === c ? 'border-white scale-110' : 'border-transparent'} transition-all`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setIsAddingText(false)}
                className="p-4 bg-zinc-800 text-white rounded-full font-bold"
              >
                <X className="w-6 h-6" />
              </button>
              <button
                onClick={handleAddText}
                className="p-4 bg-white text-black rounded-full font-bold"
              >
                <Check className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Controls */}
      <div className="p-6 bg-gradient-to-t from-black/90 to-transparent flex flex-col gap-6 z-10">
        <div className="flex items-center gap-4 bg-black/50 p-3 rounded-2xl backdrop-blur-sm">
          <span className="text-white text-xs font-bold uppercase tracking-wider">Zoom</span>
          <input
            type="range"
            min="1"
            max="4"
            step="0.05"
            value={zoom}
            onChange={e => setZoom(parseFloat(e.target.value))}
            className="flex-1 accent-white"
          />
        </div>
        <button
          onClick={handleShare}
          disabled={isProcessing}
          className="w-full py-4 bg-primary text-white rounded-full font-bold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
        >
          {isProcessing ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Share2 className="w-5 h-5" />
              Share to Story
            </>
          )}
        </button>
      </div>
    </div>
  );
}
