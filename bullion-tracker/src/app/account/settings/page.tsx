'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

const CONFIRMATION_TEXT = 'DELETE MY ACCOUNT';

export default function AccountSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect to sign in if not authenticated
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  if (!session?.user) {
    router.push('/auth/signin?callbackUrl=/account/settings');
    return null;
  }

  const hasPassword = true; // Assume credential users have passwords; OAuth users might not

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: password || undefined,
          confirmationText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to delete account');
        setLoading(false);
        return;
      }

      // Sign out and redirect to home
      await signOut({ redirect: false });
      router.push('/?deleted=true');
    } catch {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowDeleteModal(false);
    setPassword('');
    setConfirmationText('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Header */}
      <header className="bg-background-card border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-text-primary hover:text-text-secondary transition-colors">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-lg font-semibold text-text-primary">Account Settings</h1>
          <div className="w-20"></div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Account Info Section */}
        <section className="bg-background-card rounded-lg border border-border p-6 mb-8">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Account Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
              <p className="text-text-primary">{session.user.name || 'Not set'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
              <p className="text-text-primary">{session.user.email}</p>
            </div>
          </div>
        </section>

        {/* Danger Zone Section */}
        <section className="bg-background-card rounded-lg border border-red-200 p-6">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Danger Zone</h2>
          <p className="text-text-secondary mb-4">
            Once you delete your account, there is no going back. All your data including your collection items, portfolio history, and account information will be permanently deleted.
          </p>

          <Button
            variant="danger"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete Account
          </Button>
        </section>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-background-card rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-text-primary mb-2">Delete Account</h3>
            <p className="text-text-secondary mb-4">
              This action cannot be undone. This will permanently delete your account and all associated data.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              {hasPassword && (
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-text-primary mb-2"
                  >
                    Enter your password to confirm
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Your password"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="confirmation"
                  className="block text-sm font-medium text-text-primary mb-2"
                >
                  Type <span className="font-mono bg-background-secondary px-1 rounded">{CONFIRMATION_TEXT}</span> to confirm
                </label>
                <input
                  id="confirmation"
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="DELETE MY ACCOUNT"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeModal}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  disabled={loading || confirmationText !== CONFIRMATION_TEXT}
                  className="flex-1"
                >
                  {loading ? 'Deleting...' : 'Delete Account'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
