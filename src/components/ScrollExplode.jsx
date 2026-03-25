import { useEffect, useRef, useState, useCallback } from 'react';

const TOTAL_FRAMES = 240;

function getFramePath(index, isPortrait) {
  const dir = isPortrait ? 'portrait' : 'landscape';
  const num = String(index).padStart(3, '0');
  return `/${dir}/ezgif-frame-${num}.jpg`;
}

export default function ScrollExplode({ onLoadComplete, triggerReassemble, onReassembleComplete, scrollContainerRef }) {
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);
  const currentFrameRef = useRef(0);
  const targetFrameRef = useRef(0);
  const rafRef = useRef(null);
  const [isPortrait, setIsPortrait] = useState(window.innerWidth < 768);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const reassemblingRef = useRef(false);

  // Detect orientation
  useEffect(() => {
    const handleResize = () => setIsPortrait(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Preload frames
  useEffect(() => {
    let cancelled = false;
    const images = [];
    let loadedCount = 0;

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFramePath(i, isPortrait);
      img.onload = () => {
        loadedCount++;
        if (!cancelled) {
          setLoadProgress(Math.floor((loadedCount / TOTAL_FRAMES) * 100));
          if (loadedCount === TOTAL_FRAMES) {
            setLoaded(true);
            onLoadComplete?.();
          }
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (!cancelled) {
          setLoadProgress(Math.floor((loadedCount / TOTAL_FRAMES) * 100));
        }
      };
      images.push(img);
    }
    imagesRef.current = images;

    return () => { cancelled = true; };
  }, [isPortrait, onLoadComplete]);

  // Draw frame
  const drawFrame = useCallback((frameIndex) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = imagesRef.current[frameIndex];
    if (!canvas || !ctx || !img || !img.complete) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Cover fit
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = canvas.width / canvas.height;
    let sw, sh, sx, sy;

    if (canvasRatio > imgRatio) {
      sw = img.naturalWidth;
      sh = img.naturalWidth / canvasRatio;
      sx = 0;
      sy = (img.naturalHeight - sh) / 2;
    } else {
      sh = img.naturalHeight;
      sw = img.naturalHeight * canvasRatio;
      sx = (img.naturalWidth - sw) / 2;
      sy = 0;
    }

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  }, []);

  // Scroll → frame mapping
  useEffect(() => {
    if (!loaded) return;

    const handleScroll = () => {
      if (reassemblingRef.current) return;
      const container = scrollContainerRef?.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const scrollable = container.scrollHeight - window.innerHeight;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / scrollable));
      targetFrameRef.current = Math.min(
        TOTAL_FRAMES - 1,
        Math.floor(progress * TOTAL_FRAMES)
      );
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loaded, scrollContainerRef]);

  // Lerp animation loop
  useEffect(() => {
    if (!loaded) return;

    const animate = () => {
      const current = currentFrameRef.current;
      const target = targetFrameRef.current;
      const diff = target - current;
      const next = Math.abs(diff) < 0.5 ? target : current + diff * 0.15;
      currentFrameRef.current = next;
      drawFrame(Math.round(next));
      rafRef.current = requestAnimationFrame(animate);
    };

    drawFrame(0);
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loaded, drawFrame]);

  // Reassemble trigger
  useEffect(() => {
    if (!triggerReassemble) return;
    reassemblingRef.current = true;

    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'instant' });

    let frame = currentFrameRef.current;
    const speed = 6;

    const reverseLoop = () => {
      frame -= speed;
      if (frame <= 0) {
        frame = 0;
        currentFrameRef.current = 0;
        targetFrameRef.current = 0;
        drawFrame(0);
        reassemblingRef.current = false;
        onReassembleComplete?.();
        return;
      }
      currentFrameRef.current = frame;
      targetFrameRef.current = frame;
      drawFrame(Math.round(frame));
      requestAnimationFrame(reverseLoop);
    };

    requestAnimationFrame(reverseLoop);
  }, [triggerReassemble, drawFrame, onReassembleComplete]);

  return (
    <>
      {!loaded && (
        <div className="loading-screen">
          <div className="loading-title">ODYSSEY</div>
          <div className="loading-bar-container">
            <div className="loading-bar" style={{ width: `${loadProgress}%` }} />
          </div>
          <div className="loading-percent">{loadProgress}%</div>
        </div>
      )}
      <div className="scroll-canvas-wrapper">
        <canvas ref={canvasRef} className="scroll-canvas" />
      </div>
    </>
  );
}
