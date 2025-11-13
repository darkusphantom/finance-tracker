'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { getBinanceBalances } from '@/app/binance-actions';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

const formatCurrency = (value: number, currency = 'USD') => {
  if (isNaN(value)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

interface Asset {
    asset: string;
    totalAmount: string;
    usdValue: number;
}

interface WalletData {
    wallet: string;
    assets: Asset[];
    totalUsd: number;
}

interface BalanceData {
    wallets: WalletData[];
    totalUsd: number;
    totalVes: number;
    exchangeRate: number;
}

const WalletCard = ({ title, assets, totalValue, exchangeRate }: { title: string, assets: Asset[], totalValue: number, exchangeRate: number }) => {
    const sortedAssets = [...assets].sort((a,b) => b.usdValue - a.usdValue).filter(a => a.usdValue > 1);

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>
                    Total Value: {formatCurrency(totalValue)} / {formatCurrency(totalValue * exchangeRate, 'VES')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 max-h-60 overflow-y-auto">
                    {sortedAssets.length > 0 ? sortedAssets.map(asset => (
                        <div key={asset.asset} className="flex justify-between items-center text-sm">
                            <div>
                                <p className="font-bold">{asset.asset}</p>
                                <p className="text-muted-foreground">{parseFloat(asset.totalAmount).toFixed(6)}</p>
                            </div>
                            <p className="font-mono">{formatCurrency(asset.usdValue)}</p>
                        </div>
                    )) : <p className="text-muted-foreground text-center">No assets over $1.00 found.</p>}
                </div>
            </CardContent>
        </Card>
    )
}

export function BinanceView() {
  const [data, setData] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getBinanceBalances();
      if (result.error) {
        throw new Error(result.error);
      }
      setData(result.data || null);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle>Portfolio Overview</CardTitle>
                <CardDescription>
                    A summary of your crypto assets across Binance.
                </CardDescription>
            </div>
            <Button onClick={fetchBalances} variant="outline" size="icon" disabled={loading}>
                <RefreshCw className={loading ? 'animate-spin' : ''} />
            </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading && (
          <div className="flex flex-col justify-center items-center h-40">
            <Loader2 className="animate-spin h-12 w-12 text-primary" />
            <p className="mt-4 text-muted-foreground">Fetching Binance balances...</p>
          </div>
        )}
        {error && (
            <div className="flex flex-col justify-center items-center h-40 text-destructive">
                <AlertCircle className="h-12 w-12" />
                <p className="mt-4 font-bold">Failed to load data</p>
                <p className="text-sm text-center">{error}</p>
            </div>
        )}
        {data && (
            <div className='space-y-6'>
                <div className="text-center p-6 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
                    <p className="text-4xl font-bold">{formatCurrency(data.totalUsd)}</p>
                    <p className="text-lg text-muted-foreground">{formatCurrency(data.totalVes, 'VES')}</p>
                    <p className="text-xs text-muted-foreground mt-1">(1 USD ≈ {data.exchangeRate.toFixed(2)} VES)</p>
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {data.wallets.map(wallet => (
                        <WalletCard 
                            key={wallet.wallet}
                            title={wallet.wallet}
                            assets={wallet.assets}
                            totalValue={wallet.totalUsd}
                            exchangeRate={data.exchangeRate}
                        />
                   ))}
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
