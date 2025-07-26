'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, TrendingUp, TrendingDown, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getRiskProfileAnalysisAction } from '@/app/actions';
import type { AssessRiskProfileOutput } from '@/ai/flows/risk-profile-flow';
import { Progress } from './ui/progress';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

const formSchema = z.object({
  jobStability: z.enum(['stable', 'moderate', 'unstable']),
  healthStatus: z.enum(['good', 'fair', 'poor']),
  emergencyFund: z.coerce.number().positive(),
  monthlyExpenses: z.coerce.number().positive(),
});

export function RiskProfileQuestionnaire() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AssessRiskProfileOutput | null>(
    null
  );
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobStability: 'moderate',
      healthStatus: 'good',
      emergencyFund: 0,
      monthlyExpenses: 0,
    },
  });

  async function onSubmit(
    values: z.infer<typeof formSchema>
  ) {
    setIsLoading(true);
    setAnalysis(null);
    const result = await getRiskProfileAnalysisAction(values);
    setIsLoading(false);

    if (result.error) {
      toast({
        title: 'Analysis Failed',
        description: result.error,
        variant: 'destructive',
      });
    } else if (result.data) {
      setAnalysis(result.data);
      toast({
        title: 'Analysis Complete!',
        description: 'Your financial risk profile has been generated.',
      });
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Risk Profile Questionnaire</CardTitle>
          <CardDescription>
            Answer these questions to help us assess your financial risk
            profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="jobStability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Stability</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your job stability" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="stable">
                          Stable (Secure, long-term employment)
                        </SelectItem>
                        <SelectItem value="moderate">
                          Moderate (Freelance, contract-based, some
                          uncertainty)
                        </SelectItem>
                        <SelectItem value="unstable">
                          Unstable (Irregular income, high turnover industry)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How secure is your primary source of income?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="healthStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>General Health Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your health status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="good">
                          Good (No chronic conditions, low health expenses)
                        </SelectItem>
                        <SelectItem value="fair">
                          Fair (Manageable conditions, moderate expenses)
                        </SelectItem>
                        <SelectItem value="poor">
                          Poor (Significant health issues, high expenses)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      This helps estimate potential unexpected medical costs.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emergencyFund"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Emergency Fund Size</FormLabel>
                    <Input
                      type="number"
                      placeholder="e.g., 5000"
                      {...field}
                    />
                    <FormDescription>
                      How much do you have saved for unexpected events?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="monthlyExpenses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Average Monthly Expenses</FormLabel>
                    <Input
                      type="number"
                      placeholder="e.g., 2000"
                      {...field}
                    />
                    <FormDescription>
                      Your typical total expenses for one month.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Sparkles className="mr-2" />
                )}
                Analyze My Risk Profile
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Analysis</CardTitle>
          <CardDescription>
            Your results will appear here after you submit the form.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Loader2 className="animate-spin h-12 w-12 text-primary mb-4" />
              <p className="text-muted-foreground">
                Our AI is analyzing your profile...
              </p>
            </div>
          )}
          {analysis && (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold">Risk Level</h3>
                  <Badge
                    variant={
                      analysis.riskLevel === 'Low'
                        ? 'secondary'
                        : analysis.riskLevel === 'Moderate'
                        ? 'default'
                        : 'destructive'
                    }
                    className="text-lg"
                  >
                     {analysis.riskLevel}
                  </Badge>
                </div>
                <Progress value={analysis.riskScore} className="h-4" />
                 <p className="text-sm text-muted-foreground text-center mt-1">
                    Risk Score: {analysis.riskScore} / 100
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Summary</h4>
                <p className="text-sm">{analysis.summary}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Emergency Fund Analysis
                </h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="flex flex-col gap-2 p-4 border rounded-lg">
                         <p className="text-sm text-muted-foreground">Current Coverage</p>
                         <p className="text-2xl font-bold">
                            {analysis.emergencyFund.currentMonths.toFixed(1)} months
                         </p>
                    </div>
                     <div className="flex flex-col gap-2 p-4 border rounded-lg bg-primary/10">
                         <p className="text-sm text-muted-foreground">Recommended</p>
                         <p className="text-2xl font-bold text-primary">
                            {analysis.emergencyFund.recommendedMonths.toFixed(0)}+ months
                         </p>
                    </div>
                </div>
                 <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2"><Shield /> Recommendation</h4>
                    <p className="text-sm">{analysis.emergencyFund.recommendation}</p>
                </div>
              </div>
            </div>
          )}
          {!isLoading && !analysis && (
             <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <p>Your analysis results are just a few clicks away.</p>
                <p>Fill out the form and see what our AI advisor thinks!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
