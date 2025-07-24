'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, ArrowRightLeft } from 'lucide-react';

const formatCurrency = (value: number, currency = 'VES') => {
    if (isNaN(value)) return '...';
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(value);
  };

type ExchangeRate = {
  fuente: string;
  nombre: string;
  compra: number;
  venta: number;
  promedio: number;
  fechaActualizacion: string;
};

export function CurrencyConverter() {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usdAmount, setUsdAmount] = useState<string>('1');
  const [vesAmount, setVesAmount] = useState<string>('');

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('https://ve.dolarapi.com/v1/dolares');
        if (!response.ok) {
          throw new Error('Failed to fetch exchange rates.');
        }
        const data = await response.json();
        setRates(data);
        // Set initial VES amount based on the first rate (usually 'Oficial')
        if (data.length > 0) {
            setVesAmount((1 * data[0].promedio).toFixed(2));
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, []);

  const handleUsdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsdAmount(value);
    const usdValue = parseFloat(value);
    if (!isNaN(usdValue) && rates.length > 0) {
      setVesAmount((usdValue * (rates[0]?.promedio || 0)).toFixed(2));
    } else {
        setVesAmount('');
    }
  };

  const handleVesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setVesAmount(value);
    const vesValue = parseFloat(value);
     if (!isNaN(vesValue) && rates.length > 0) {
        setUsdAmount((vesValue / (rates[0]?.promedio || 1)).toFixed(2));
    } else {
        setUsdAmount('');
    }
  };


  const getConversionResults = () => {
    const usd = parseFloat(usdAmount);
    if (isNaN(usd) || rates.length === 0) return [];
    
    return rates.map(rate => ({
        name: rate.nombre,
        value: usd * rate.promedio,
    }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Currency Converter</CardTitle>
        <CardDescription>
          Convert between USD and VEF using real-time rates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading && (
          <div className="flex justify-center items-center h-20">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
          </div>
        )}
         {error && (
            <div className="flex justify-center items-center h-20 text-destructive">
                <AlertCircle className="h-8 w-8 mr-4" />
                <p>{error}</p>
            </div>
        )}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="space-y-2">
                <Label htmlFor="usd-input">USD Amount</Label>
                <Input
                  id="usd-input"
                  type="number"
                  placeholder="1.00"
                  value={usdAmount}
                  onChange={handleUsdChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ves-input">VEF Amount (Oficial)</Label>
                 <Input
                  id="ves-input"
                  type="number"
                  placeholder="0.00"
                  value={vesAmount}
                  onChange={handleVesChange}
                />
              </div>
            </div>
            <div>
              <h3 className="text-md font-semibold mb-2 text-center">Conversion Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                {getConversionResults().map(result => (
                    <div key={result.name} className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">{result.name}</p>
                        <p className="text-xl font-bold">{formatCurrency(result.value, 'VES')}</p>
                    </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
