'use client';

import Link from 'next/link';

const metadata = {
  title: 'Privacy Policy | Bullion Tracker',
  description: 'Privacy Policy for Bullion Tracker - Your precious metals collection tracking app',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = 'January 19, 2026';
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
          Privacy Policy
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#666',
          marginBottom: '40px',
        }}>
          Last updated: {lastUpdated}
        </p>

        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          <Section title="1. Introduction">
            <p>
              Welcome to {appName}. We respect your privacy and are committed to protecting your personal data.
              This privacy policy explains how we collect, use, and safeguard your information when you use our
              precious metals collection tracking application.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <p>We collect the following types of information:</p>
            <ul>
              <li><strong>Account Information:</strong> Email address and password when you create an account</li>
              <li><strong>Collection Data:</strong> Information about your precious metals collection that you choose to enter, including item descriptions, purchase prices, weights, and images</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our app, including features used and time spent</li>
              <li><strong>Device Information:</strong> Device type, operating system, and app version for troubleshooting and optimization</li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Information">
            <p>We use the collected information to:</p>
            <ul>
              <li>Provide and maintain our service</li>
              <li>Calculate portfolio values using current spot prices</li>
              <li>Display your collection data and analytics</li>
              <li>Send important service notifications</li>
              <li>Improve our app and develop new features</li>
              <li>Respond to your support requests</li>
            </ul>
          </Section>

          <Section title="4. Data Storage and Security">
            <p>
              Your data is stored securely using industry-standard encryption. We use:
            </p>
            <ul>
              <li>HTTPS encryption for all data in transit</li>
              <li>Encrypted database storage for data at rest</li>
              <li>Secure authentication with JWT tokens</li>
              <li>Regular security audits and updates</li>
            </ul>
            <p>
              Collection images are stored securely using Cloudinary&apos;s cloud storage service.
            </p>
          </Section>

          <Section title="5. Third-Party Services">
            <p>We use the following third-party services:</p>
            <ul>
              <li><strong>Spot Price Data:</strong> We fetch current precious metal prices from third-party APIs to calculate portfolio values</li>
              <li><strong>PCGS/NGC:</strong> Optional integration for coin certification lookup</li>
              <li><strong>Cloudinary:</strong> Secure image storage for collection photos</li>
              <li><strong>Vercel:</strong> Application hosting and deployment</li>
              <li><strong>Sentry:</strong> Error monitoring to improve app stability</li>
            </ul>
            <p>
              These services have their own privacy policies governing the use of your information.
            </p>
          </Section>

          <Section title="6. Data Sharing">
            <p>
              We do not sell, trade, or rent your personal information to third parties.
            </p>
            <p>
              <strong>Your collection data is yours alone.</strong> We will never share, sell, or disclose
              your precious metals collection information with any third party. Your inventory details,
              purchase prices, and collection composition remain completely private.
            </p>
            <p>
              We may share limited account information only in the following circumstances:
            </p>
            <ul>
              <li>With your explicit consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and prevent fraud</li>
              <li>With service providers who assist in operating our app (under strict confidentiality agreements) - these providers never have access to your collection data</li>
            </ul>
          </Section>

          <Section title="7. Your Rights">
            <p>You have the right to:</p>
            <ul>
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
              <li><strong>Export:</strong> Request export of your collection data</li>
              <li><strong>Opt-out:</strong> Opt out of non-essential communications</li>
            </ul>
            <p>
              To exercise these rights, please contact us at{' '}
              <a href={`mailto:${contactEmail}`} style={{ color: '#D4AF37' }}>
                {contactEmail}
              </a>.
            </p>
          </Section>

          <Section title="8. Data Retention">
            <p>
              We retain your personal data for as long as your account is active or as needed to provide
              you services. If you delete your account, we will delete your personal data within 30 days,
              except where we are required to retain it for legal purposes.
            </p>
          </Section>

          <Section title="9. Children&apos;s Privacy">
            <p>
              Our service is not directed to children under 13. We do not knowingly collect personal
              information from children under 13. If you are a parent or guardian and believe your child
              has provided us with personal information, please contact us.
            </p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>
              We may update this privacy policy from time to time. We will notify you of any changes by
              posting the new policy on this page and updating the &quot;Last updated&quot; date. We encourage
              you to review this policy periodically.
            </p>
          </Section>

          <Section title="11. Contact Us">
            <p>
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <ul>
              <li>
                Email:{' '}
                <a href={`mailto:${contactEmail}`} style={{ color: '#D4AF37' }}>
                  {contactEmail}
                </a>
              </li>
            </ul>
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
          <Link href="/contact" style={{ color: '#666', textDecoration: 'none' }}>
            Contact
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
