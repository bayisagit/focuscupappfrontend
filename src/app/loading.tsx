import React from 'react';
import AastuLogoLoader from '@/components/AastuLogoLoader';

export default function Loading() {
  return (
    <AastuLogoLoader
      message="Loading Focus Football Cup..."
      subMessage="Winning is a bonus; friendship, joy, and fellowship come first!"
      fullScreen
    />
  );
}
