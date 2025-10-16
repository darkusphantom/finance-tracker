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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, AlertCircle, ArrowRightLeft } from 'lucide-react';

const formatCurrency = (value: number, currency = 'VES') => {
    if (isNaN(value)) return '';
    const displayCurrency = currency === 'USDT' ? 'USD' : currency;
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: displayCurrency,
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

export function CurrencyCalculator({ showTitle = true }: { showTitle?: boolean }) {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usdAmount, setUsdAmount] = useState<string>('1');
  const [vesAmount, setVesAmount] = useState<string>('');
  const [selectedRateName, setSelectedRateName] = useState<string>('Oficial');
  
  const selectedRate = rates.find(r => r.nombre === selectedRateName) || rates.find(r => r.nombre === 'Oficial') || rates[0];

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
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, []);
  
  useEffect(() => {
    if (selectedRate) {
        const usdValue = parseFloat(usdAmount);
        if (!isNaN(usdValue)) {
            setVesAmount((usdValue * selectedRate.promedio).toFixed(2));
        }
    }
  }, [usdAmount, selectedRate]);


  const handleUsdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsdAmount(value);
    const usdValue = parseFloat(value);
    if (!isNaN(usdValue) && selectedRate) {
      setVesAmount((usdValue * selectedRate.promedio).toFixed(2));
    } else {
        setVesAmount('');
    }
  };

  const handleVesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setVesAmount(value);
    const vesValue = parseFloat(value);
     if (!isNaN(vesValue) && selectedRate) {
        setUsdAmount((vesValue / selectedRate.promedio).toFixed(2));
    } else {
        setUsdAmount('');
    }
  };

  return (
    <Card>
      {showTitle && (
        <CardHeader>
            <CardTitle>Currency Converter</CardTitle>
            <CardDescription>
            Convert between USD and VEF using real-time rates.
            </CardDescription>
        </CardHeader>
      )}
      <CardContent className="space-y-6 pt-6">
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
            <div className="space-y-2">
                <Label htmlFor="rate-select">Conversion Rate</Label>
                <Select value={selectedRateName} onValueChange={setSelectedRateName}>
                    <SelectTrigger id="rate-select">
                        <SelectValue placeholder="Select a rate" />
                    </SelectTrigger>
                    <SelectContent>
                        {rates.map(rate => (
                            <SelectItem key={rate.nombre} value={rate.nombre}>
                                {rate.nombre} - {formatCurrency(rate.promedio)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
              <div className="space-y-2">
                <Label htmlFor="usd-input">USD</Label>
                <Input
                  id="usd-input"
                  type="number"
                  placeholder="1.00"
                  value={usdAmount}
                  onChange={handleUsdChange}
                />
              </div>
              <ArrowRightLeft className="h-6 w-6 text-muted-foreground self-end mb-2 hidden md:block"/>
              <div className="space-y-2">
                <Label htmlFor="ves-input">VEF</Label>
                 <Input
                  id="ves-input"
                  type="number"
                  placeholder="0.00"
                  value={vesAmount}
                  onChange={handleVesChange}
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
