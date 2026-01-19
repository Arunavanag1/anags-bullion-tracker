'use client';

import Link from 'next/link';

const metadata = {
  title: 'Contact & Support | Bullion Tracker',
  description: 'Contact and Support for Bullion Tracker - Your precious metals collection tracking app',
};

export default function ContactSupportPage() {
  const appName = 'Bullion Tracker';
  const contactEmail = 'arunavaknag@berkeley.edu';

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8F7F4',
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        background: '#1a1a1a',
        padding: '16px 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ color: '#D4AF37', fontSize: '18px', fontWeight: '600' }}>
            {appName}
          </span>
        </Link>
        <Link href="/" style={{
          color: '#888',
          fontSize: '14px',
          textDecoration: 'none',
        }}>
          ← Back to App
        </Link>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '48px 24px',
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#1a1a1a',
          marginBottom: '8px',
        }}>
          Contact & Support
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#666',
          marginBottom: '40px',
        }}>
          We&apos;re here to help with any questions or issues
        </p>

        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          <Section title="Email Support">
            <p>
              For questions, feedback, or technical support, please email us at:
            </p>
            <div style={{
              background: '#F8F7F4',
              padding: '20px',
              borderRadius: '12px',
              marginTop: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <span style={{ fontSize: '24px' }}>📧</span>
              <a
                href={`mailto:${contactEmail}`}
                style={{
                  color: '#D4AF37',
                  fontSize: '18px',
                  fontWeight: '500',
                  textDecoration: 'none',
                }}
              >
                {contactEmail}
              </a>
            </div>
            <p style={{ marginTop: '16px', fontSize: '14px', color: '#888' }}>
              We typically respond within 24-48 hours on business days.
            </p>
          </Section>

          <Section title="Common Topics">
            <ul>
              <li><strong>Account Issues:</strong> Problems signing in, password reset, account deletion requests</li>
              <li><strong>Collection Data:</strong> Questions about data import/export, synchronization issues</li>
              <li><strong>Pricing Information:</strong> Spot price updates, valuation questions, premium calculations</li>
              <li><strong>Bug Reports:</strong> App crashes, unexpected behavior, display issues</li>
              <li><strong>Feature Requests:</strong> Suggestions for new features or improvements</li>
              <li><strong>Privacy & Data:</strong> Questions about how we handle your data</li>
            </ul>
          </Section>

          <Section title="Before Contacting Us">
            <p>
              To help us assist you faster, please include the following information in your message:
            </p>
            <ul>
              <li>Your device type (iPhone, iPad, Android, or Web browser)</li>
              <li>App version (found in Settings on mobile, or footer on web)</li>
              <li>A detailed description of your issue or question</li>
              <li>Screenshots if applicable (especially for visual bugs)</li>
              <li>Steps to reproduce the issue if it&apos;s a bug</li>
            </ul>
          </Section>

          <Section title="App Store Reviews">
            <p>
              If you&apos;re enjoying {appName}, we&apos;d greatly appreciate a review on the App Store or
              Google Play. Your feedback helps other collectors discover the app and helps us improve.
            </p>
            <p>
              If you&apos;re experiencing issues, please contact us directly first so we can help resolve
              them. We&apos;re committed to making {appName} the best precious metals tracking app available.
            </p>
          </Section>

          <Section title="Response Times">
            <p>
              We strive to respond to all inquiries promptly:
            </p>
            <ul>
              <li><strong>General Questions:</strong> 24-48 hours</li>
              <li><strong>Technical Issues:</strong> 24-48 hours</li>
              <li><strong>Bug Reports:</strong> 24-72 hours (may take longer for complex issues)</li>
              <li><strong>Feature Requests:</strong> We review all suggestions, though we may not respond individually</li>
            </ul>
          </Section>

          <Section title="Business Hours">
            <p>
              Our support team is available Monday through Friday, 9 AM - 6 PM EST.
              Messages received outside these hours will be addressed on the next business day.
            </p>
          </Section>
        </div>

        {/* Footer Links */}
        <div style={{
          marginTop: '40px',
          paddingTop: '20px',
          borderTop: '1px solid #E0E0E0',
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          fontSize: '14px',
        }}>
          <Link href="/" style={{ color: '#666', textDecoration: 'none' }}>
            Home
          </Link>
          <Link href="/privacy" style={{ color: '#666', textDecoration: 'none' }}>
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '32px' }}>
      <h2 style={{
        fontSize: '18px',
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: '16px',
      }}>
        {title}
      </h2>
      <div style={{
        fontSize: '15px',
        lineHeight: '1.7',
        color: '#444',
      }}>
        {children}
      </div>
      <style jsx>{`
        section ul {
          margin: 12px 0;
          padding-left: 24px;
        }
        section li {
          margin-bottom: 8px;
        }
        section p {
          margin-bottom: 12px;
        }
      `}</style>
    </section>
  );
}
