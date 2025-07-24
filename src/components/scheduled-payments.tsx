'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Button } from './ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';

export function ScheduledPayments({ initialItems = [] }: { initialItems?: any[] }) {
  const [items, setItems] = useState(initialItems);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const handleInputChange = (id: string, field: string, value: any) => {
    const newItems = items.map(item => {
      if (item.id === id) {
        if (field === 'amount' || field === 'day') {
            return { ...item, [field]: parseFloat(value) || 0 };
        }
        return { ...item, [field]: value };
      }
      return item;
    });
    setItems(newItems);
  };

  const addNewRow = (category: 'income' | 'expense') => {
    const newId = (items.length + 1).toString();
    setItems([
      ...items,
      { id: newId, name: 'Nuevo Item', day: 1, amount: 0, type: 'variable', category },
    ]);
  };

  const deleteRow = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };
  
  const incomeItems = items.filter(item => item.category === 'income');
  const expenseItems = items.filter(item => item.category === 'expense');

  const renderTable = (data: typeof items, category: 'income' | 'expense') => (
    <div>
        <div className='flex justify-between items-center mb-2'>
            <h3 className="text-lg font-semibold capitalize">{category === 'income' ? 'Ingresos Programados' : 'Pagos Programados'}</h3>
            <Button variant="outline" size="sm" onClick={() => addNewRow(category)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir
            </Button>
        </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead className='text-center'>Día del Mes</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map(item => (
            <TableRow key={item.id}>
              <TableCell>
                <Input
                  value={item.name}
                  onChange={e => handleInputChange(item.id, 'name', e.target.value)}
                  className="border-none bg-transparent p-0 h-auto focus-visible:ring-0"
                />
              </TableCell>
              <TableCell className='text-center'>
                <Input
                  type="number"
                  value={item.day}
                  onChange={e => handleInputChange(item.id, 'day', e.target.value)}
                  className="border-none bg-transparent p-0 h-auto focus-visible:ring-0 w-16 text-center"
                  min="1"
                  max="31"
                />
              </TableCell>
              <TableCell>
                <Select
                  value={item.type}
                  onValueChange={value => handleInputChange(item.id, 'type', value)}
                >
                  <SelectTrigger className="w-[120px] border-none bg-transparent p-0 h-auto focus:ring-0">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fijo</SelectItem>
                    <SelectItem value="variable">Variable</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={item.amount}
                  onChange={e => handleInputChange(item.id, 'amount', e.target.value)}
                  className={`font-mono border-none bg-transparent p-0 h-auto focus-visible:ring-0 ${
                    item.category === 'income' ? 'text-primary' : 'text-destructive'
                  }`}
                />
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => deleteRow(item.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pagos e Ingresos Programados</CardTitle>
        <CardDescription>
          Gestiona tus ingresos y gastos recurrentes del mes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {renderTable(incomeItems, 'income')}
        {renderTable(expenseItems, 'expense')}
      </CardContent>
    </Card>
  );
}
