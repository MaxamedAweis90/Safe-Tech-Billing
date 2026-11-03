import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';
import { cn } from '../../utils/cn';

export interface DocumentScaleWrapperProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Responsive A4 scale wrapper matching prototype `fitSheets()` (lines 519-520).
 * Fits standard 794px-wide A4 document sheets smoothly into any container width.
 */
export const DocumentScaleWrapper: React.FC<DocumentScaleWrapperProps> = ({
  children,
  className = '',
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);
  const [scaledHeight, setScaledHeight] = useState<number | null>(null);

  const calculateFit = () => {
    if (!containerRef.current || !scaleRef.current) return;
    const w = containerRef.current;
    const sc = scaleRef.current;

    const computedPadding = parseFloat(window.getComputedStyle(w).paddingLeft) || 20;
    const avail = w.clientWidth - computedPadding * 2;
    if (avail <= 0) return;

    const k = Math.min(1, avail / 794);
    setScale(k);

    const child = sc.firstElementChild as HTMLElement | null;
    if (child) {
      setScaledHeight(child.offsetHeight * k);
    }
  };

  useLayoutEffect(() => {
    calculateFit();
  }, []);

  useEffect(() => {
    calculateFit();
    window.addEventListener('resize', calculateFit);

    // ResizeObserver on the container to detect pane expansion/resizing
    const roContainer = new ResizeObserver(() => {
      calculateFit();
    });
    if (containerRef.current) {
      roContainer.observe(containerRef.current);
    }

    // ResizeObserver on the document canvas to detect content expansion / image loading
    const childEl = scaleRef.current?.firstElementChild as HTMLElement | null;
    const roChild = new ResizeObserver(() => {
      calculateFit();
    });
    if (childEl) {
      roChild.observe(childEl);
    }

    return () => {
      window.removeEventListener('resize', calculateFit);
      roContainer.disconnect();
      roChild.disconnect();
    };
  }, [children]);

  return (
    <div ref={containerRef} className={cn('sheet-wrap', className)} style={style}>
      <div
        ref={scaleRef}
        className="sheet-scale"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: '794px',
          height: scaledHeight !== null ? `${scaledHeight}px` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
};

