'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export function AuthButton() {
  const { data: session, status } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (status === 'loading') {
    return <div className="h-10 w-24 bg-background-secondary animate-pulse rounded-lg"></div>;
  }

  if (session?.user) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: '10px',
            background: '#E8E8E8',
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
            transition: 'background 0.2s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#DEDEDE'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#E8E8E8'}
        >
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: '#1a1a1a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '12px',
            fontWeight: '600',
          }}>
            {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <span style={{
            color: '#1a1a1a',
            fontWeight: '500',
            fontSize: '14px',
          }}>
            {session.user.name || session.user.email}
          </span>
          <svg
            style={{
              width: '14px',
              height: '14px',
              color: '#666',
              transition: 'transform 0.2s ease',
              transform: showMenu ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-background-card rounded-lg shadow-lg border border-border py-1 z-50">
            <div className="px-4 py-2 border-b border-border">
              <p className="text-sm font-medium text-text-primary truncate">
                {session.user.name || 'User'}
              </p>
              <p className="text-xs text-text-secondary truncate">{session.user.email}</p>
            </div>
            <Link
              href="/account/settings"
              className="block w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-background-secondary transition-colors"
              onClick={() => setShowMenu(false)}
            >
              Account Settings
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-background-secondary transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/auth/signin">
        <Button variant="ghost" size="sm">
          Sign In
        </Button>
      </Link>
      <Link href="/auth/signup">
        <Button variant="primary" size="sm">
          Sign Up
        </Button>
      </Link>
    </div>
  );
}
