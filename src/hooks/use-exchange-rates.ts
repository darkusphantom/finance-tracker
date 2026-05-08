import { useState, useEffect } from 'react';

export type ExchangeRate = {
  fuente: string;
  nombre: string;
  compra: number;
  venta: number;
  promedio: number;
  fechaActualizacion: string;
};

export function useExchangeRates() {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoading(true);
        setError(null);
        const url = process.env.NEXT_PUBLIC_DOLAR_API_URL || 'https://ve.dolarapi.com/v1/dolares';
        const response = await fetch(url);
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

  return { rates, loading, error };
}
