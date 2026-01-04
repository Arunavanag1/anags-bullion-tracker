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
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background-secondary hover:bg-border transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-accent-primary flex items-center justify-center text-white font-semibold">
            {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <span className="text-text-primary font-medium hidden sm:inline">
            {session.user.name || session.user.email}
          </span>
          <svg
            className={`w-4 h-4 text-text-secondary transition-transform ${showMenu ? 'rotate-180' : ''}`}
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
