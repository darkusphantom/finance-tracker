'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

function Rule503020Calculator() {
  const [income, setIncome] = useState<number>(0);

  const needs = income * 0.5;
  const wants = income * 0.3;
  const savings = income * 0.2;

  return (
    <Card>
      <CardHeader>
        <CardTitle>50/30/20 Rule Calculator</CardTitle>
        <CardDescription>
          Divide your after-tax income into three categories: 50% for needs, 30% for wants, and 20% for savings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="income-503020">Monthly After-Tax Income</Label>
          <Input
            id="income-503020"
            type="number"
            placeholder="Enter your monthly income"
            value={income || ''}
            onChange={(e) => setIncome(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="flex flex-col gap-2 p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Needs (50%)</p>
            <p className="text-2xl font-bold text-primary">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(needs)}
            </p>
          </div>
          <div className="flex flex-col gap-2 p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Wants (30%)</p>
            <p className="text-2xl font-bold text-accent">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(wants)}
            </p>
          </div>
          <div className="flex flex-col gap-2 p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Savings (20%)</p>
            <p className="text-2xl font-bold text-green-500">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(savings)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Rule9010Calculator() {
    const [income, setIncome] = useState<number>(0);
    const spending = income * 0.9;
    const savings = income * 0.1;

    return (
        <Card>
            <CardHeader>
                <CardTitle>90/10 Rule Calculator</CardTitle>
                <CardDescription>
                Live on 90% of your income and save the other 10%. A simple rule for building wealth.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="space-y-2">
                    <Label htmlFor="income-9010">Monthly After-Tax Income</Label>
                    <Input
                        id="income-9010"
                        type="number"
                        placeholder="Enter your monthly income"
                        value={income || ''}
                        onChange={(e) => setIncome(parseFloat(e.target.value) || 0)}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                    <div className="flex flex-col gap-2 p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Spending (90%)</p>
                        <p className="text-2xl font-bold text-primary">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(spending)}
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Savings (10%)</p>
                        <p className="text-2xl font-bold text-green-500">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(savings)}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

type ExchangeRate = {
  fuente: string;
  nombre: string;
  compra: number;
  venta: number;
  promedio: number;
  fechaActualizacion: string;
};

function DollarRateMonitor() {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle>Monitor del Dólar en Venezuela</CardTitle>
            <CardDescription>
                Cotizaciones del dólar actualizadas en tiempo real.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
        {loading && (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
            <p className="ml-4 text-muted-foreground">Cargando tasas...</p>
          </div>
        )}
        {error && (
            <div className="flex justify-center items-center h-40 text-destructive">
                <AlertCircle className="h-8 w-8 mr-4" />
                <div>
                    <p className="font-bold">Error al cargar los datos</p>
                    <p>{error}</p>
                </div>
            </div>
        )}
        {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {rates.map(rate => (
                    <Card key={rate.nombre} className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-lg">{rate.nombre}</CardTitle>
                            <CardDescription>Fuente: {rate.fuente}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-2">
                           <p>Compra: <span className='font-mono'>{formatCurrency(rate.compra)}</span></p>
                           <p>Venta: <span className='font-mono'>{formatCurrency(rate.venta)}</span></p>
                           <p>Promedio: <span className='font-mono'>{formatCurrency(rate.promedio)}</span></p>
                        </CardContent>
                        <CardFooter>
                           <p className="text-xs text-muted-foreground w-full text-center">
                                Actualizado: {format(new Date(rate.fechaActualizacion), "MMM d, yyyy, h:mm a")}
                            </p>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        )}
        </CardContent>
    </Card>
);
}

export function FinancialCalculators() {
  return (
    <Tabs defaultValue="50-30-20" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="50-30-20">50/30/20 Rule</TabsTrigger>
        <TabsTrigger value="90-10">90/10 Rule</TabsTrigger>
        <TabsTrigger value="budget">Dollar Monitor</TabsTrigger>
      </TabsList>
      <TabsContent value="50-30-20" className="mt-4">
        <Rule503020Calculator />
      </TabsContent>
      <TabsContent value="90-10" className="mt-4">
        <Rule9010Calculator />
      </TabsContent>
      <TabsContent value="budget" className="mt-4">
        <DollarRateMonitor />
      </TabsContent>
    </Tabs>
  );
}
