'use client';

import {
  useState,
  useEffect,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export interface RadialScrollGalleryProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children: (hoveredIndex: number | null) => ReactNode[];
  scrollDuration?: number;
  visiblePercentage?: number;
  baseRadius?: number;
  mobileRadius?: number;
  startTrigger?: string;
  onItemSelect?: (index: number) => void;
  direction?: 'ltr' | 'rtl';
  disabled?: boolean;
}

export function RadialScrollGallery({
  children,
  className,
  scrollDuration = 2500,
  visiblePercentage = 45,
  baseRadius = 550,
  mobileRadius = 220,
  startTrigger = 'top top',
  onItemSelect,
  direction = 'ltr',
  disabled = false,
  ...props
}: RadialScrollGalleryProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [radius, setRadius] = useState(baseRadius);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const innerContainerRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef({ value: 0 });
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const prefersReducedMotion = useRef(false);

  const items = children(hoveredIndex);
  const itemCount = items.length;

  // Calculate angle for visible arc
  // Allow items to overlap by using a fixed arc that doesn't grow too large
  const baseArc = (visiblePercentage / 100) * 360;
  // Arc determines how spread out items are - smaller = more overlap
  const maxArc = 70;
  const visibleArcAngle = Math.min(baseArc, maxArc);

  // Position items centered at the top of the wheel (270° is straight up)
  const startAngle = 270 - visibleArcAngle / 2; // Center the arc around 270° (top)
  const endAngle = startAngle + visibleArcAngle;
  // For many items, they will naturally overlap since arc is capped
  const anglePerItem = itemCount > 1 ? visibleArcAngle / (itemCount - 1) : 0;

  // Two-phase rotation:
  // Phase 1: Rotate clockwise until rightmost item (at endAngle) is 90% off right edge
  //          Right edge is at ~0° (or 360°), so we need to rotate from endAngle to ~350°
  // Phase 2: Rotate counter-clockwise back to center so items remain visible at the end
  //          This brings items back into view after sweeping right

  // Calculate rotation needed for each phase
  const phase1Rotation = (360 - endAngle) + 20; // Clockwise to push right item off right edge
  // Phase 2 brings items back to center (rotation returns to 0), so items end up visible
  const phase2Rotation = phase1Rotation; // Return to starting position

  // Handle responsive radius
  useEffect(() => {
    const checkMotionPreference = () => {
      prefersReducedMotion.current = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;
    };

    const updateRadius = () => {
      setRadius(window.innerWidth < 768 ? mobileRadius : baseRadius);
    };

    checkMotionPreference();
    updateRadius();
    window.addEventListener('resize', updateRadius);

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', checkMotionPreference);

    return () => {
      window.removeEventListener('resize', updateRadius);
      mediaQuery.removeEventListener('change', checkMotionPreference);
    };
  }, [baseRadius, mobileRadius]);

  // Position items on the arc
  useEffect(() => {
    if (disabled || itemCount === 0) return;

    itemsRef.current.forEach((item, index) => {
      if (!item) return;

      const itemAngle = startAngle + index * anglePerItem;
      const rad = (itemAngle * Math.PI) / 180;

      const x = Math.cos(rad) * radius;
      const y = Math.sin(rad) * radius;

      gsap.set(item, {
        x,
        y,
        // Items rotate with their position on the wheel (pointing outward from center)
        rotation: itemAngle + 90,
        transformOrigin: 'center center',
      });
    });
  }, [radius, itemCount, startAngle, anglePerItem, disabled]);

  // Scroll-driven rotation animation with two phases
  useGSAP(
    () => {
      if (
        disabled ||
        itemCount === 0 ||
        !scrollContainerRef.current ||
        !containerRef.current ||
        prefersReducedMotion.current
      ) {
        return;
      }

      const trigger = ScrollTrigger.create({
        trigger: scrollContainerRef.current,
        start: startTrigger,
        end: `+=${scrollDuration}`,
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        pinSpacing: true,
        onUpdate: (self) => {
          let newRotation: number;

          const progress = self.progress;

          if (progress <= 0.5) {
            // Phase 1 (0-50% scroll): Full clockwise rotation
            const phase1Progress = progress / 0.5;
            newRotation = phase1Progress * phase1Rotation;
          } else {
            // Phase 2 (50-100% scroll): Full counter-clockwise back to start
            const phase2Progress = (progress - 0.5) / 0.5;
            newRotation = phase1Rotation - (phase2Progress * phase1Rotation);
          }

          rotationRef.current.value = newRotation;

          if (containerRef.current) {
            gsap.set(containerRef.current, { rotation: newRotation });
          }
        },
        onLeave: () => {
          // Just reset rotation, let coins scroll naturally
          if (containerRef.current) {
            gsap.set(containerRef.current, { rotation: 0 });
          }
        },
        onEnterBack: () => {
          if (containerRef.current) {
            gsap.set(containerRef.current, { rotation: 0 });
          }
        },
      });

      return () => {
        trigger.kill();
      };
    },
    {
      dependencies: [
        itemCount,
        scrollDuration,
        phase1Rotation,
        phase2Rotation,
        startTrigger,
        startAngle,
        anglePerItem,
        disabled,
      ],
      scope: scrollContainerRef,
    }
  );

  const handleItemClick = (index: number) => {
    onItemSelect?.(index);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleItemClick(index);
    }
  };

  if (itemCount === 0) {
    return null;
  }

  return (
    <div
      ref={scrollContainerRef}
      className={cn('relative w-full', className)}
      style={{ height: `${scrollDuration}px`, overflow: 'visible' }}
      {...props}
    >
      {/*
        IMPORTANT: No sticky here! ScrollTrigger's pin handles keeping content visible.
        Using sticky + pin causes conflicts where content disappears after unpin.
        This div is just a positioning container for the wheel.
      */}
      <div
        ref={innerContainerRef}
        className="relative w-full h-screen"
        style={{ zIndex: 30, overflow: 'visible' }}
      >
        <div
          ref={containerRef}
          className="absolute left-1/2"
          style={{
            width: radius * 2,
            height: radius * 2,
            marginLeft: -radius,
            // Center the wheel so items appear in middle of screen
            top: '80%',
            marginTop: -radius,
          }}
        >
          {items.map((item, index) => {
            const isHovered = hoveredIndex === index;
            // Base z-index increases with index so later items are on top
            // Hovered items get a much higher z-index to always be on top
            const zIndex = isHovered ? 1000 : index + 1;

            return (
              <div
                key={index}
                ref={(el) => {
                  itemsRef.current[index] = el;
                }}
                className="absolute left-1/2 top-1/2 cursor-pointer"
                style={{
                  marginLeft: '-100px',
                  marginTop: '-140px',
                  zIndex,
                }}
                onClick={() => handleItemClick(index)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                tabIndex={0}
                role="button"
                aria-label={`Gallery item ${index + 1}`}
              >
                {/* Inner wrapper for hover scale - doesn't conflict with GSAP transforms on parent */}
                <div
                  style={{
                    transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                    transition: 'transform 0.2s ease-out',
                  }}
                >
                  {item}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
