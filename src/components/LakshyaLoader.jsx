import React, { useState, useEffect } from 'react';

const LakshyaLoader = ({ onLoadComplete, loadedSections }) => {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [minSectionsLoaded, setMinSectionsLoaded] = useState(false);

  useEffect(() => {
    // Check if at least 2 sections are loaded
    if (loadedSections >= 2 && !minSectionsLoaded) {
      setMinSectionsLoaded(true);
    }
  }, [loadedSections]);

  useEffect(() => {
    // Only start the progress animation if minimum sections are loaded
    if (!minSectionsLoaded) return;

    // Smooth progress animation over 1.5 seconds
    const duration = 1500;
    const interval = 20;
    const steps = duration / interval;
    const increment = 100 / steps;
    
    let currentProgress = 0;
    const timer = setInterval(() => {
      currentProgress += increment;
      if (currentProgress >= 100) {
        currentProgress = 100;
        setProgress(100);
        setTimeout(() => {
          setIsComplete(true);
          if (onLoadComplete) onLoadComplete();
        }, 300);
        clearInterval(timer);
      } else {
        setProgress(currentProgress);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [minSectionsLoaded, onLoadComplete]);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-white transition-opacity duration-500 ${isComplete ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="text-center">
        {/* Target logo with smooth rotation */}
        <div className="relative mb-8 mx-auto w-24 h-24">
          {/* Outer ring */}
          <div className="absolute inset-0 border-2 border-gray-200 rounded-full"></div>
          
          {/* Progress ring */}
          <div className="absolute inset-0">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="2"
              />
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 10}`}
                strokeDashoffset={`${2 * Math.PI * 10 * (1 - progress / 100)}`}
                className="transition-all duration-300 ease-out"
              />
            </svg>
          </div>
          
          {/* Center target dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full shadow-lg"></div>
          </div>
          
          {/* Arrow pointing to center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="absolute transform transition-transform duration-1000 ease-in-out"
              style={{
                transform: `rotate(${progress * 3.6}deg) translateY(-35px)`,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-blue-500">
                <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" fill="currentColor"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Brand name */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 tracking-wide">
            LAKSHYA
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1 tracking-wider">
            CLASSES
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-64 mx-auto mb-4">
          <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
            <div 
              className="h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Loading text */}
        <div className="flex items-center justify-center text-gray-600">
          <span className="text-sm font-medium">Loading</span>
          <div className="flex ml-2 space-x-1">
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0s'}}></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
          </div>
        </div>

        {/* Progress percentage */}
        <div className="mt-4 text-xs text-gray-400 font-mono">
          {Math.round(progress)}%
        </div>
      </div>
    </div>
  );
};

export default LakshyaLoader;