/**
 * Environment validation utility
 * Provides fail-fast behavior for missing configuration and debugging helpers
 */

interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

interface EnvSummary {
  [key: string]: string;
}

// Required environment variables
const REQUIRED_ENV_VARS = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'] as const;

// Required in production only
const PRODUCTION_REQUIRED = ['NEXT_PUBLIC_METAL_PRICE_API_KEY'] as const;

// Optional environment variables (grouped by feature)
const OPTIONAL_ENV_VARS = {
  redis: ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
  cloudinary: ['NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET'],
  google: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
  admin: ['ADMIN_SEED_KEY'],
} as const;

// Default development values that should be changed in production
const INSECURE_DEFAULTS = {
  NEXTAUTH_SECRET: 'your-secret-key-here',
} as const;

/**
 * Validates that all required environment variables are set
 */
export function validateEnv(): EnvValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production';

  // Check required vars
  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Check production-required vars
  if (isProduction) {
    for (const varName of PRODUCTION_REQUIRED) {
      if (!process.env[varName]) {
        missing.push(varName);
      }
    }
  }

  // Check for insecure defaults
  for (const [varName, insecureValue] of Object.entries(INSECURE_DEFAULTS)) {
    if (process.env[varName] === insecureValue) {
      if (isProduction) {
        missing.push(`${varName} (using insecure default)`);
      } else {
        warnings.push(`${varName} is using the default development value - change before deploying`);
      }
    }
  }

  // Validate DATABASE_URL format
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && !dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    warnings.push('DATABASE_URL should start with postgresql:// or postgres://');
  }

  // Warn about missing SSL in production
  if (isProduction && dbUrl && !dbUrl.includes('sslmode=require') && !dbUrl.includes('ssl=true')) {
    warnings.push('DATABASE_URL should use SSL in production (add ?sslmode=require)');
  }

  // Warn about optional features
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    warnings.push('Rate limiting will use in-memory fallback (not persistent) - configure UPSTASH_* for production');
  }

  if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
    warnings.push('Image storage will use database (not recommended) - configure Cloudinary for production');
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Returns a summary of environment configuration with sensitive values masked
 */
export function getEnvSummary(): EnvSummary {
  const summary: EnvSummary = {};

  // Database URL - mask credentials
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    try {
      const url = new URL(dbUrl);
      summary.DATABASE_URL = `${url.protocol}//***@${url.host}${url.pathname}`;
    } catch {
      summary.DATABASE_URL = '[invalid URL format]';
    }
  } else {
    summary.DATABASE_URL = '[not set]';
  }

  // Auth config
  summary.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET
    ? process.env.NEXTAUTH_SECRET === INSECURE_DEFAULTS.NEXTAUTH_SECRET
      ? '[default - CHANGE ME]'
      : '[set]'
    : '[not set]';
  summary.NEXTAUTH_URL = process.env.NEXTAUTH_URL || '[not set]';

  // API keys
  summary.METAL_PRICE_API_KEY = process.env.NEXT_PUBLIC_METAL_PRICE_API_KEY
    ? '[configured]'
    : '[not set]';

  // Optional features
  summary.UPSTASH_REDIS =
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
      ? '[configured]'
      : '[not set]';

  summary.CLOUDINARY =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
      ? '[configured]'
      : '[not set]';

  summary.GOOGLE_OAUTH =
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? '[configured]'
      : '[not set]';

  return summary;
}

/**
 * Validates environment and logs results
 * Call this during app initialization for fail-fast behavior
 */
export function validateEnvAndLog(): void {
  const result = validateEnv();
  const summary = getEnvSummary();

  console.log('\n📦 Environment Configuration:');
  for (const [key, value] of Object.entries(summary)) {
    console.log(`   ${key}: ${value}`);
  }

  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    for (const warning of result.warnings) {
      console.log(`   - ${warning}`);
    }
  }

  if (!result.valid) {
    console.error('\n❌ Missing required environment variables:');
    for (const missing of result.missing) {
      console.error(`   - ${missing}`);
    }
    console.error('\n   See .env.example for configuration details.\n');

    // In production, throw to fail fast
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${result.missing.join(', ')}`);
    }
  } else {
    console.log('\n✅ Environment validation passed\n');
  }
}
