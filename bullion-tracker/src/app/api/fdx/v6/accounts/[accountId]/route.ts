/**
 * FDX API - Get Account Details
 * Returns detailed account information with holdings
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/plaid/oauth-tokens';
import { prisma } from '@/lib/db';
import { fetchSpotPrices } from '@/lib/prices';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;

    // Verify access token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = await verifyAccessToken(token);
    const userId = payload.sub;

    // Verify account belongs to user - exact match only
    const expectedAccountId = `bullion_${userId}`;
    if (accountId !== expectedAccountId) {
      return NextResponse.json(
        { error: 'not_found' },
        { status: 404 }
      );
    }

    // Get user's collection
    const items = await prisma.collectionItem.findMany({
      where: { userId },
    });

    // Get current spot prices
    const spotPrices = await fetchSpotPrices();

    // Group by metal
    const metalGroups: Record<string, {oz: number; value: number}> = {};

    for (const item of items) {
      if (!metalGroups[item.metal]) {
        metalGroups[item.metal] = { oz: 0, value: 0 };
      }
      const price = spotPrices[item.metal as keyof typeof spotPrices]?.pricePerOz || 0;
      const weightOz = item.weightOz || 0;
      const value = weightOz * price;

      metalGroups[item.metal].oz += weightOz;
      metalGroups[item.metal].value += value;
    }

    // Calculate total value
    const totalValue = Object.values(metalGroups).reduce((sum, m) => sum + m.value, 0);

    // Build holdings array
    const holdings = [];
    const metalSymbols: Record<string, string> = {
      gold: 'XAU',
      silver: 'XAG',
      platinum: 'XPT',
      palladium: 'XPD',
    };

    for (const [metal, data] of Object.entries(metalGroups)) {
      if (data.oz > 0) {
        const price = spotPrices[metal as keyof typeof spotPrices]?.pricePerOz || 0;
        holdings.push({
          holdingName: `${metal.charAt(0).toUpperCase() + metal.slice(1)} (${metalSymbols[metal]})`,
          holdingType: 'OTHER',
          symbol: metalSymbols[metal],
          units: data.oz,
          currentUnitPrice: price,
          currentUnitPriceDate: new Date().toISOString().split('T')[0],
          marketValue: Math.round(data.value * 100) / 100,
          cashAccount: false,
          fiAttributes: [
            { name: 'metalType', value: metal },
            { name: 'weightOz', value: data.oz.toString() },
          ],
        });
      }
    }

    return NextResponse.json({
      accountId: accountId,
      accountType: 'OTHERINVESTMENT',
      accountNumberDisplay: `****${userId.slice(-4)}`,
      productName: 'Precious Metals Portfolio',
      nickname: 'Bullion Collection',
      status: 'OPEN',
      currency: {
        currencyCode: 'USD',
      },
      availableCashBalance: 0,
      currentValue: Math.round(totalValue * 100) / 100,
      balanceAsOf: new Date().toISOString(),
      holdings,
    });
  } catch (error) {
    console.error('FDX account details error:', error);
    return NextResponse.json(
      { error: 'server_error' },
      { status: 500 }
    );
  }
}
