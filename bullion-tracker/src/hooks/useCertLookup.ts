import { useMutation } from '@tanstack/react-query';
import type { Metal } from '@/types';

export interface CertLookupData {
  pcgsNumber: number;
  fullName: string;
  year: number;
  mintMark: string | null;
  denomination: string;
  grade: string;
  gradeNumeric: number;
  metal: Metal | null;
  priceGuide: number | null;
  mintage: number | null;
  imageUrl: string | null;
  matchedCoinId: string | null;
  metalPurity: number | null;
  metalWeightOz: number | null;
  preciousMetalOz: number | null;
}

export interface CertLookupResponse {
  success: boolean;
  service: 'pcgs' | 'ngc';
  requiresManualLookup?: boolean;
  lookupUrl?: string;
  data?: CertLookupData;
  error?: string;
}

interface CertLookupParams {
  certNumber: string;
  service: 'pcgs' | 'ngc';
}

async function lookupCert(params: CertLookupParams): Promise<CertLookupResponse> {
  const response = await fetch('/api/coins/cert-lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();

    if (response.status === 404) {
      return {
        success: false,
        service: params.service,
        error: 'Certificate not found',
      };
    }

    if (response.status === 429) {
      return {
        success: false,
        service: params.service,
        error: 'Rate limit exceeded. Please try again later.',
      };
    }

    return {
      success: false,
      service: params.service,
      error: error.error || 'Lookup failed',
    };
  }

  return response.json();
}

/**
 * Hook for looking up coin data by certification number
 *
 * Usage:
 * ```
 * const certLookup = useCertLookup();
 *
 * // Trigger lookup
 * certLookup.mutate({ certNumber: '12345678', service: 'pcgs' });
 *
 * // Access results
 * if (certLookup.data?.success) {
 *   const { grade, metal, priceGuide } = certLookup.data.data;
 * }
 * ```
 */
export function useCertLookup() {
  return useMutation({
    mutationFn: lookupCert,
  });
}
