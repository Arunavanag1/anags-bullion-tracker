/**
 * Seed OAuth Client for Plaid
 * Run this script to create the OAuth client that Plaid will use
 *
 * Usage: npx tsx scripts/seed-oauth-client.ts
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { randomBytes } from 'crypto';

const connectionString = process.env.DATABASE_URL || 'postgresql://arunavanag@localhost:5432/bullion_tracker';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔑 Creating OAuth Client for Plaid...\n');

  // Generate a secure client secret
  const clientSecret = randomBytes(32).toString('base64url');

  const client = await prisma.oAuthClient.upsert({
    where: { clientId: 'plaid-exchange' },
    update: {
      name: 'Plaid Core Exchange',
      redirectUris: [
        'https://cdn.plaid.com/link/v2/stable/oauth.html',
        'http://localhost:8080/callback', // For local testing
      ],
    },
    create: {
      clientId: 'plaid-exchange',
      clientSecret,
      name: 'Plaid Core Exchange',
      redirectUris: [
        'https://cdn.plaid.com/link/v2/stable/oauth.html',
        'http://localhost:8080/callback', // For local testing
      ],
    },
  });

  console.log('✅ OAuth Client Created!\n');
  console.log('Client ID:', client.clientId);
  console.log('Client Secret:', clientSecret);
  console.log('\n⚠️  IMPORTANT: Save the Client Secret securely!');
  console.log('You will need to provide these credentials to Plaid.\n');

  console.log('📋 OAuth Configuration:');
  console.log('OIDC Discovery:', `${process.env.NEXT_PUBLIC_API_URL}/.well-known/openid-configuration`);
  console.log('JWKS URI:', `${process.env.NEXT_PUBLIC_API_URL}/.well-known/jwks.json`);
  console.log('Authorization Endpoint:', `${process.env.NEXT_PUBLIC_API_URL}/api/oauth/authorize`);
  console.log('Token Endpoint:', `${process.env.NEXT_PUBLIC_API_URL}/api/oauth/token`);
  console.log('UserInfo Endpoint:', `${process.env.NEXT_PUBLIC_API_URL}/api/oauth/userinfo`);
  console.log('\n📊 FDX API Base URL:', `${process.env.NEXT_PUBLIC_API_URL}/api/fdx/v6`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
