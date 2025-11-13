'use server';

import {
  getSpotWallet,
  getFundingWallet,
  getSimpleEarnFlexible,
  getSimpleEarnLocked,
  getTickerPrices,
} from '@/lib/binance';

async function getVesRate() {
  try {
    const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
    if (!response.ok) return 36.5; // fallback
    const data = await response.json();
    return data.promedio || 36.5;
  } catch (e) {
    console.error("Could not fetch VEF rate:", e);
    return 36.5; // fallback
  }
}

function calculateUsdValue(asset: string, amount: number, prices: Map<string, number>) {
    if (asset.startsWith('LD')) { // Simple Earn Locked asset
        const underlying = asset.substring(2);
        return calculateUsdValue(underlying, amount, prices);
    }
    if (['USDT', 'USDC', 'FDUSD'].includes(asset)) {
        return amount;
    }
    const pair = `${asset}USDT`;
    const price = prices.get(pair);
    return price ? amount * price : 0;
}


export async function getBinanceBalances() {
  try {
    const prices = await getTickerPrices();
    const vesRate = await getVesRate();

    // Fetch all wallets in parallel
    const [spot, funding, earnFlexible, earnLocked] = await Promise.all([
      getSpotWallet().catch(e => ({ error: 'Spot', details: e.message })),
      getFundingWallet().catch(e => ({ error: 'Funding', details: e.message })),
      getSimpleEarnFlexible().catch(e => ({ error: 'Earn (Flexible)', details: e.message })),
      getSimpleEarnLocked().catch(e => ({ error: 'Earn (Locked)', details: e.message })),
    ]);

    const wallets: { wallet: string, assets: any[], totalUsd: number }[] = [];
    
    // Process Spot
    if (!('error' in spot)) {
        const spotAssets = spot.map(a => {
            const totalAmount = parseFloat(a.free) + parseFloat(a.locked);
            return { asset: a.asset, totalAmount: totalAmount.toString(), usdValue: calculateUsdValue(a.asset, totalAmount, prices) }
        });
        wallets.push({ wallet: "Spot", assets: spotAssets, totalUsd: spotAssets.reduce((sum, a) => sum + a.usdValue, 0) });
    }

    // Process Funding
    if (!('error'in funding)) {
        const fundingAssets = funding.map((a: any) => {
            const totalAmount = parseFloat(a.free);
            return { asset: a.asset, totalAmount: totalAmount.toString(), usdValue: calculateUsdValue(a.asset, totalAmount, prices) }
        });
        wallets.push({ wallet: "Funding", assets: fundingAssets, totalUsd: fundingAssets.reduce((sum, a) => sum + a.usdValue, 0) });
    }
    
    // Process Earn
    const earnAssetsMap = new Map<string, { amount: number }>();
    if (!('error' in earnFlexible) && earnFlexible.rows) {
        earnFlexible.rows.forEach((p: any) => {
            const amount = parseFloat(p.totalAmount);
            if (earnAssetsMap.has(p.asset)) {
                earnAssetsMap.get(p.asset)!.amount += amount;
            } else {
                earnAssetsMap.set(p.asset, { amount });
            }
        });
    }
     if (!('error' in earnLocked) && earnLocked.rows) {
        earnLocked.rows.forEach((p: any) => {
            const amount = parseFloat(p.amount);
            if (earnAssetsMap.has(p.asset)) {
                earnAssetsMap.get(p.asset)!.amount += amount;
            } else {
                earnAssetsMap.set(p.asset, { amount });
            }
        });
    }

    const earnAssets = Array.from(earnAssetsMap.entries()).map(([asset, data]) => ({
        asset,
        totalAmount: data.amount.toString(),
        usdValue: calculateUsdValue(asset, data.amount, prices)
    }));

    if (earnAssets.length > 0) {
        wallets.push({ wallet: "Earn", assets: earnAssets, totalUsd: earnAssets.reduce((sum, a) => sum + a.usdValue, 0) });
    }


    const totalUsd = wallets.reduce((sum, w) => sum + w.totalUsd, 0);

    return { data: {
        wallets,
        totalUsd,
        totalVes: totalUsd * vesRate,
        exchangeRate: vesRate
    } };
  } catch (error: any) {
    console.error('Binance data fetching failed:', error);
    return { error: error.message || 'An unexpected error occurred while fetching Binance data.' };
  }
}
