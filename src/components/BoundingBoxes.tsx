import React, { useState, useEffect } from 'react';
import { BovineDetection } from '../types';

interface BoundingBoxesProps {
  detections: BovineDetection[];
  containerRef: React.RefObject<HTMLDivElement>;
}

export const BoundingBoxes = ({ detections, containerRef }: BoundingBoxesProps) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const img = containerRef.current.querySelector('img');
        if (img) {
          setDimensions({ width: img.clientWidth, height: img.clientHeight });
        }
      }
    };

    updateDimensions();
    // Use a ResizeObserver for better accuracy
    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    window.addEventListener('resize', updateDimensions);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, [containerRef]);

  if (dimensions.width === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {detections.map((det) => {
        const { x_min, y_min, x_max, y_max } = det.caixa_delimitadora;
        // Gemini coordinates are 0-1000
        const left = (x_min / 1000) * dimensions.width;
        const top = (y_min / 1000) * dimensions.height;
        const width = ((x_max - x_min) / 1000) * dimensions.width;
        const height = ((y_max - y_min) / 1000) * dimensions.height;

        return (
          <div
            key={det.id}
            className="absolute border-2 border-[#10b981] bg-[rgba(16,185,129,0.1)] rounded-sm"
            style={{
              left: `${left}px`,
              top: `${top}px`,
              width: `${width}px`,
              height: `${height}px`,
            }}
          >
            <div className="absolute -top-6 left-0 bg-[#10b981] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
              {det.classe} {Math.round(det.confianca * 100)}%
            </div>
          </div>
        );
      })}
    </div>
  );
};
