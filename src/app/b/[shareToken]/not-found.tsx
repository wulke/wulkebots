import React from 'react';

// @spec VIEW-ROUTE-002
export default function ViewerNotFoundPage() {
  return (
    <main
      style={{
        alignItems: 'center',
        display: 'grid',
        minHeight: '100vh',
        padding: '2rem',
        placeItems: 'center',
      }}
    >
      <p
        style={{
          color: '#111827',
          fontSize: '1.125rem',
          margin: 0,
        }}
      >
        Bot not found
      </p>
    </main>
  );
}
