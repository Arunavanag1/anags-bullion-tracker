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
  const rotationRef = useRef({ value: 0 });
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const prefersReducedMotion = useRef(false);

  const items = children(hoveredIndex);
  const itemCount = items.length;

  // Calculate angle for visible arc
  // Start at 270° (top of circle) and spread items evenly across the visible arc
  const visibleArcAngle = (visiblePercentage / 100) * 360;
  const startAngle = 270 - visibleArcAngle / 2;
  const anglePerItem = itemCount > 1 ? visibleArcAngle / (itemCount - 1) : 0;
  const totalRotation = direction === 'ltr' ? visibleArcAngle : -visibleArcAngle;

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

  // Scroll-driven rotation animation
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
        onUpdate: (self) => {
          const newRotation = self.progress * totalRotation;
          rotationRef.current.value = newRotation;

          if (containerRef.current) {
            gsap.set(containerRef.current, { rotation: newRotation });
          }

          // Items rotate with the wheel (no counter-rotation)
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
        totalRotation,
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
      style={{ height: `${scrollDuration}px` }}
      {...props}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div
          ref={containerRef}
          className="absolute left-1/2 top-1/2"
          style={{
            width: radius * 2,
            height: radius * 2,
            marginLeft: -radius,
            marginTop: -radius,
          }}
        >
          {items.map((item, index) => (
            <div
              key={index}
              ref={(el) => {
                itemsRef.current[index] = el;
              }}
              className="absolute left-1/2 top-1/2 cursor-pointer"
              style={{
                marginLeft: '-100px',
                marginTop: '-140px',
              }}
              onClick={() => handleItemClick(index)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              tabIndex={0}
              role="button"
              aria-label={`Gallery item ${index + 1}`}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
