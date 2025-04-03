'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Use dynamic import with ssr:false to ensure client-side only rendering
const MatrixBackground = dynamic(() => import('@/components/MatrixBackground'), { 
  ssr: false,
  loading: () => null 
});

export default function ClientWrapper() {
  // Use a state to ensure the component only renders on the client
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    // Small delay to ensure clean hydration
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 10);
    
    return () => clearTimeout(timer);
  }, []);

  // Only render MatrixBackground when the component is mounted on client
  return (
    <div suppressHydrationWarning>
      {isMounted && <MatrixBackground />}
    </div>
  );
}