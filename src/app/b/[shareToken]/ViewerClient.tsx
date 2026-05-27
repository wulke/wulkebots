'use client';

import React from 'react';
import { useState } from 'react';

type ViewerClientProps = {
  botName: string;
  imageUrl: string;
  quotes: string[];
};

const MOVEMENT_STEP_PX = 32;

function getNextQuoteIndex(currentIndex: number | null, quoteCount: number) {
  if (quoteCount === 0) {
    return null;
  }

  if (currentIndex === null) {
    return 0;
  }

  return (currentIndex + 1) % quoteCount;
}

// @spec VIEW-LAYOUT-002, VIEW-LAYOUT-003, VIEW-QUOTE-001, VIEW-QUOTE-002, VIEW-QUOTE-003, VIEW-QUOTE-004, VIEW-QUOTE-005, VIEW-QUOTE-006, VIEW-MOVE-001, VIEW-MOVE-002, VIEW-MOVE-003, VIEW-MOVE-004, VIEW-MOVE-005, VIEW-DATA-002
export function ViewerClient({ botName, imageUrl, quotes }: ViewerClientProps) {
  const [activeQuoteIndex, setActiveQuoteIndex] = useState<number | null>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const [bounceTick, setBounceTick] = useState(0);

  const activeQuote = activeQuoteIndex === null ? null : quotes[activeQuoteIndex] ?? null;

  function moveBy(deltaX: number, deltaY: number) {
    setOffsetX((currentValue) => currentValue + deltaX);
    setOffsetY((currentValue) => currentValue + deltaY);
  }

  function handleDrawingPress() {
    const nextQuoteIndex = getNextQuoteIndex(activeQuoteIndex, quotes.length);

    if (nextQuoteIndex === null) {
      return;
    }

    setActiveQuoteIndex(nextQuoteIndex);
    setBounceTick((currentValue) => currentValue + 1);
    setIsBouncing(true);
  }

  return (
    <section
      style={{
        alignItems: 'center',
        display: 'grid',
        gap: '1rem',
        gridTemplateAreas: '". up ." "left figure right" ". down ."',
        gridTemplateColumns: 'minmax(3rem, 1fr) minmax(0, auto) minmax(3rem, 1fr)',
        justifyItems: 'center',
        minHeight: '100vh',
        padding: '1.5rem',
      }}
    >
      <style>{`
        @keyframes viewer-bounce {
          0% { transform: scale(1); }
          35% { transform: scale(1.04) translateY(-6px); }
          100% { transform: scale(1); }
        }
      `}</style>
      <DirectionalButton
        ariaLabel="Move up"
        gridArea="up"
        onPress={() => moveBy(0, -MOVEMENT_STEP_PX)}
      >
        ↑
      </DirectionalButton>
      <DirectionalButton
        ariaLabel="Move left"
        gridArea="left"
        onPress={() => moveBy(-MOVEMENT_STEP_PX, 0)}
      >
        ←
      </DirectionalButton>
      <div
        data-testid="viewer-figure"
        data-bouncing={isBouncing ? 'true' : 'false'}
        onAnimationEnd={() => setIsBouncing(false)}
        style={{
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          gridArea: 'figure',
          maxWidth: '100%',
          position: 'relative',
          transform: `translate(${offsetX}px, ${offsetY}px)`,
        }}
      >
        {activeQuote ? (
          <div
            role="status"
            style={{
              backgroundColor: '#ffffff',
              border: '2px solid #1f2937',
              borderRadius: '1rem',
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.15)',
              color: '#111827',
              maxWidth: '80vw',
              padding: '0.875rem 1rem',
              textAlign: 'center',
              whiteSpace: 'normal',
              wordBreak: 'break-word',
            }}
          >
            {activeQuote}
          </div>
        ) : null}
        <button
          aria-label={botName}
          key={bounceTick}
          onClick={handleDrawingPress}
          style={{
            animation: isBouncing ? 'viewer-bounce 180ms ease' : 'none',
            background: 'transparent',
            border: 0,
            cursor: 'pointer',
            padding: 0,
          }}
          type="button"
        >
          {showPlaceholder ? (
            <div
              data-testid="viewer-placeholder"
              style={{
                alignItems: 'center',
                backgroundColor: '#d1d5db',
                borderRadius: '1rem',
                color: '#4b5563',
                display: 'flex',
                fontSize: '0.95rem',
                justifyContent: 'center',
                maxHeight: '70vh',
                maxWidth: '100%',
                minHeight: '16rem',
                minWidth: '16rem',
                objectFit: 'contain',
                padding: '1rem',
              }}
            >
              Drawing unavailable
            </div>
          ) : (
            <img
              alt={botName}
              onError={() => setShowPlaceholder(true)}
              src={imageUrl}
              style={{
                borderRadius: '1rem',
                display: 'block',
                maxHeight: '70vh',
                maxWidth: '100%',
                objectFit: 'contain',
              }}
            />
          )}
        </button>
        <p
          style={{
            color: '#475569',
            fontSize: '0.95rem',
            margin: 0,
          }}
        >
          {botName}
        </p>
      </div>
      <DirectionalButton
        ariaLabel="Move right"
        gridArea="right"
        onPress={() => moveBy(MOVEMENT_STEP_PX, 0)}
      >
        →
      </DirectionalButton>
      <DirectionalButton
        ariaLabel="Move down"
        gridArea="down"
        onPress={() => moveBy(0, MOVEMENT_STEP_PX)}
      >
        ↓
      </DirectionalButton>
    </section>
  );
}

type DirectionalButtonProps = {
  ariaLabel: string;
  children: string;
  gridArea: string;
  onPress: () => void;
};

function DirectionalButton({ ariaLabel, children, gridArea, onPress }: DirectionalButtonProps) {
  return (
    <button
      aria-label={ariaLabel}
      onClick={onPress}
      style={{
        backgroundColor: '#ffffff',
        border: '2px solid #1f2937',
        borderRadius: '999px',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
        color: '#111827',
        cursor: 'pointer',
        fontSize: '1.5rem',
        fontWeight: 700,
        gridArea,
        height: '3rem',
        lineHeight: 1,
        width: '3rem',
      }}
      type="button"
    >
      {children}
    </button>
  );
}
