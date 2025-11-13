"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Maximize2,
  RotateCw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

type ImageViewerProps = {
  imageUrl: string;
  altText: string;
};

export function ImageViewer({ imageUrl, altText }: ImageViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [baseZoomLevel, setBaseZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [modalRotation, setModalRotation] = useState(0);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 1));
  };

  const handleBaseZoomIn = () => {
    setBaseZoomLevel((prev) => Math.min(prev + 0.5, 4));
  };

  const handleBaseZoomOut = () => {
    setBaseZoomLevel((prev) => Math.max(prev - 0.5, 1));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleModalRotate = () => {
    setModalRotation((prev) => (prev + 90) % 360);
  };

  const handleCloseModal = () => {
    setIsExpanded(false);
    setZoomLevel(1);
  };

  return (
    <>
      <section className="relative flex flex-col gap-4">
        <div className="relative flex h-full max-h-[88vh] overflow-auto rounded-xl border bg-muted/20">
          <img
            src={imageUrl}
            alt={altText}
            className="h-full w-full object-contain transition-transform duration-200"
            style={{
              transform: `scale(${baseZoomLevel}) rotate(${rotation}deg)`,
            }}
          />
        </div>
        <div className="absolute bottom-8 right-8 z-10 flex gap-2">
          <Button
            size="icon"
            variant="secondary"
            onClick={handleBaseZoomOut}
            disabled={baseZoomLevel <= 1}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            onClick={handleBaseZoomIn}
            disabled={baseZoomLevel >= 4}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" onClick={handleRotate}>
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            onClick={() => setIsExpanded(true)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {isExpanded && (
        <div
          className="fixed inset-0 z-50 bg-black/95"
          onClick={handleCloseModal}
        >
          <div className="absolute right-4 top-4 flex gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                handleZoomOut();
              }}
              disabled={zoomLevel <= 1}
            >
              <ZoomOut className="h-6 w-6" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                handleZoomIn();
              }}
              disabled={zoomLevel >= 4}
            >
              <ZoomIn className="h-6 w-6" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                handleModalRotate();
              }}
            >
              <RotateCw className="h-6 w-6" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={handleCloseModal}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <div className="flex h-full items-center justify-center overflow-auto p-4">
            <img
              src={imageUrl}
              alt={altText}
              className="object-contain transition-transform duration-200"
              style={{
                transform: `scale(${zoomLevel}) rotate(${modalRotation}deg)`,
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
