'use client'

import { useState, useEffect } from 'react'

const STATUS_MESSAGES = [
  'Reading commit history',
  'Scanning submission patterns',
  'Mapping difficulty graph',
  'Analyzing burst frequency',
  'Decoding skill trajectory',
  'Cross-referencing platforms',
  'Computing credibility score',
]

export default function Sphere({ state = 'idle', size = 320 }) {
  const [statusIdx, setStatusIdx] = useState(0)
  const isAnalyzing = state === 'analyzing'
  const isComplete = state === 'complete'

  useEffect(() => {
    if (!isAnalyzing) return
    const interval = setInterval(() => {
      setStatusIdx(i => (i + 1) % STATUS_MESSAGES.length)
    }, 1800)
    return () => clearInterval(interval)
  }, [isAnalyzing])

  const scale = size / 320

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className="sphere-container"
        style={{ width: size, height: size, transform: `scale(${scale})`, transformOrigin: 'center' }}
      >
        {/* Wireframe background */}
        <div className="sphere-wireframe" />

        {/* Orbital rings */}
        <div className={`sphere-ring sphere-ring-1 ${isAnalyzing ? 'analyzing' : ''}`} />
        <div className={`sphere-ring sphere-ring-2 ${isAnalyzing ? 'analyzing' : ''}`} />
        <div className={`sphere-ring sphere-ring-3 ${isAnalyzing ? 'analyzing' : ''}`} />

        {/* Scan line (visible only when analyzing) */}
        <div className={`sphere-scan-line ${isAnalyzing ? 'analyzing' : ''}`} />

        {/* Core */}
        <div className={`sphere-core ${isAnalyzing ? 'analyzing' : ''} ${isComplete ? 'complete' : ''}`} />

        {/* Floating particles */}
        {isAnalyzing && (
          <>
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="sphere-particle"
                style={{
                  top: `${50 + 40 * Math.sin((i * Math.PI * 2) / 8)}%`,
                  left: `${50 + 40 * Math.cos((i * Math.PI * 2) / 8)}%`,
                  animation: `geo-float ${2 + i * 0.3}s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                  opacity: 0.6 + Math.random() * 0.4,
                }}
              />
            ))}
          </>
        )}
      </div>

      {/* Status text */}
      {isAnalyzing && (
        <div className="status-text text-center animate-fade-in">
          {STATUS_MESSAGES[statusIdx]}
          <span className="animate-pulse">...</span>
        </div>
      )}

      {isComplete && (
        <div className="text-center animate-fade-in">
          <span className="font-display font-bold text-memphis-green text-lg tracking-wide uppercase">
            Analysis Complete
          </span>
        </div>
      )}
    </div>
  )
}
