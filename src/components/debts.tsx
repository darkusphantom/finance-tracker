import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const debts = [
  {
    name: 'Student Loan',
    type: 'Debt',
    total: 25000,
    paid: 12000,
    status: 'Paying',
  },
  {
    name: 'Car Loan',
    type: 'Debt',
    total: 18000,
    paid: 18000,
    status: 'Paid Off',
  },
  {
    name: 'Mike (Dinner)',
    type: 'Debtor',
    total: 45,
    paid: 0,
    status: 'Pending',
  },
];

export function Debts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Debts & Debtors</CardTitle>
        <CardDescription>
          Track your outstanding debts and what others owe you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {debts.map((debt) => (
          <div key={debt.name}>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">{debt.name}</span>
              <Badge
                variant={debt.type === 'Debt' ? 'destructive' : 'secondary'}
              >
                {debt.type}
              </Badge>
            </div>
            <div className="flex justify-between items-baseline text-sm mb-1">
              <span className="text-muted-foreground">
                {debt.status === 'Paid Off' ? 'Paid' : 'Paid'}: $
                {debt.paid.toLocaleString()} of ${debt.total.toLocaleString()}
              </span>
              <span
                className={`font-semibold ${
                  debt.status === 'Paid Off' ? 'text-primary' : ''
                }`}
              >
                {debt.status}
              </span>
            </div>
            <Progress value={(debt.paid / debt.total) * 100} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
