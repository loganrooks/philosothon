'use client';

import React, { useRef, useEffect } from 'react';

const MatrixBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // List of philosopher names to embed
  const philosophers = [
    'socrates', 'plato', 'aristotle', 'descartes', 'kant', 'nietzsche',
    'wittgenstein', 'sartre', 'camus', 'foucault', 'derrida', 'heidegger',
    'arendt', 'de beauvoir', 'hypatia', 'confucius', 'lao tzu', 'avicenna',
    'aquinas', 'locke', 'hume', 'rousseau', 'mill', 'marx', 'russell',
    'popper', 'kuhn', 'rawls', 'nozick', 'singer', 'chalmers', 'dennett',
    'searle', 'nagel', 'parfit', 'anscombe', 'foot', 'midgley', 'nussbaum',
    'butler', 'zizek', 'badiou', 'agamben', 'ranciere', 'stiegler', 'latour'
  ];

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use clientWidth/Height instead of window properties for more reliable sizing
    let width = canvas.width = canvas.clientWidth;
    let height = canvas.height = canvas.clientHeight;

    let columns = Math.floor(width / 20); // Number of columns based on font size
    const drops: number[] = []; // y-coordinate for the drop in each column
    const dropSpeed: number[] = []; // speed for each drop
    const binaryChars = '01'.split(''); // Only binary for background rain

    // Initialize drops starting at the top
    for (let i = 0; i < columns; i++) {
      drops[i] = 1;
      dropSpeed[i] = Math.random() * 0.5 + 0.2; // Random speed for variation
    }

    let animationFrameId: number;
    let nameInsertionCounter = 0;
    const nameInsertionFrequency = 150; // How often to try inserting a name (lower is more frequent)
    const nameStreams: { col: number; name: string; y: number; speed: number; active: boolean }[] = []; // Added 'active' flag

    const draw = () => {
      // Semi-transparent black background for fading effect
      ctx.fillStyle = 'rgba(13, 13, 13, 0.05)'; // Use dark-base color with low alpha
      ctx.fillRect(0, 0, width, height);

      // Set default font for binary rain
      ctx.font = '15pt JetBrains Mono, monospace';

      // Track which columns have active name streams
      const activeNameColumns = new Set(nameStreams.map(s => s.col));

      // Draw standard falling binary characters
      for (let i = 0; i < drops.length; i++) {
        // Dim binary in columns with names
        if (activeNameColumns.has(i)) {
          ctx.fillStyle = 'rgba(0, 70, 0, 0.6)'; // Dimmer green for binary in name columns
        } else {
          ctx.fillStyle = '#008F11'; // Normal green for binary rain
        }

        const text = binaryChars[Math.floor(Math.random() * binaryChars.length)];
        ctx.fillText(text, i * 20, drops[i] * 20);

        // Nearly freeze columns with names
        const currentSpeed = activeNameColumns.has(i) ? 0.1 : dropSpeed[i]; // Much slower for name columns

        // Send drop back to top randomly after it crosses the screen
        if (drops[i] * 20 > height && Math.random() > 0.975) {
          drops[i] = -10;
          dropSpeed[i] = Math.random() * 0.5 + 0.2; // Reset base speed
        }
        drops[i] += currentSpeed; // Move drop down based on calculated speed
      }

      // Attempt to insert a new philosopher name stream
      nameInsertionCounter++;
      if (nameInsertionCounter > nameInsertionFrequency && nameStreams.length < columns / 5) { // Limit concurrent names
        nameInsertionCounter = 0;
        if (Math.random() > 0.5) { // Chance to insert a name
          const name = philosophers[Math.floor(Math.random() * philosophers.length)];
          const col = Math.floor(Math.random() * columns);
          // Avoid overlapping with existing name streams in the same column
          if (!nameStreams.some(stream => stream.col === col)) {
            // Calculate vertical space needed for the name
            const nameChars = name.split('');
            const verticalSpacing = 1.5; // Same spacing factor used when drawing
            const nameHeight = nameChars.length * verticalSpacing;

            // Start name above the canvas viewport
            nameStreams.push({
              col: col,
              name: name,
              y: -nameHeight, // Start fully above the canvas
              speed: Math.random() * 0.15 + 0.15,
              active: true
            });
          }
        }
      }

      // Draw and update philosopher name streams
      ctx.fillStyle = '#00FF41'; // Brighter green for names
      ctx.font = 'bold 15pt JetBrains Mono, monospace'; // Slightly larger and bold

      for (let i = nameStreams.length - 1; i >= 0; i--) {
        const stream = nameStreams[i];
        const nameChars = stream.name.split('');

        for (let j = 0; j < nameChars.length; j++) {
          // Increase vertical spacing between characters
          const yPos = (stream.y * 20) + (j * 20 * 1.5); // More spacing between characters
          if (yPos < height && yPos > 0) {
            ctx.fillText(nameChars[j], stream.col * 20, yPos);
          }
        }

        stream.y += stream.speed;

        // Remove stream if it's fully off-screen
        const lastCharPos = (stream.y * 20) - ((nameChars.length - 1) * 20 * 1.5);
        if (lastCharPos > height) {
          nameStreams.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      columns = Math.floor(width / 20);

      // Reset drops array based on new column count
      drops.length = 0;
      dropSpeed.length = 0;
      for (let i = 0; i < columns; i++) {
        drops[i] = 1;
        dropSpeed[i] = Math.random() * 0.5 + 0.2;
      }

      // Clear existing name streams on resize to avoid weird placement
      nameStreams.length = 0;
    };

    // A safer resize handler using ResizeObserver if available
    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(handleResize)
      : null;

    if (resizeObserver) {
      resizeObserver.observe(canvas);
    } else {
      // Fallback to event listener if ResizeObserver isn't available
      window.addEventListener('resize', handleResize);
      handleResize(); // Call once to initialize properly
    }

    // Start animation after a slight delay to avoid hydration issues
    const timeoutId = setTimeout(() => {
      draw();
    }, 100);

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(animationFrameId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <canvas
      ref={canvasRef}
      className="matrix-canvas"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1, // Ensure it's behind other content
        opacity: 0.5, // Increased opacity from 0.3 to make it more visible
        pointerEvents: 'none', // Ensures the canvas doesn't interfere with clicks
      }}
      suppressHydrationWarning
    />
  );
};

export default MatrixBackground;
