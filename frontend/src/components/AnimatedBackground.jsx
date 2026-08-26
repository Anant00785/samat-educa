import React from 'react';

/**
 * AnimatedBackground
 * High-performance, GPU-accelerated ambient background.
 * Deep purple / soft violet / dark indigo / obsidian gradients slowly drifting.
 */
export default function AnimatedBackground() {
  return (
    <div className="ambient-bg-container" aria-hidden="true">
      <div className="ambient-orb ambient-orb-1" />
      <div className="ambient-orb ambient-orb-2" />
      <div className="ambient-orb ambient-orb-3" />
      <div className="ambient-orb ambient-orb-4" />
      <div className="ambient-grid-overlay" />
    </div>
  );
}
