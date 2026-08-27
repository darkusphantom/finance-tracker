'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, Download, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface AiExportButtonProps {
  markdown: string;
  periodLabel?: string;
}

/**
 * Componente cliente para exportar informes financieros en formato Markdown (.md)
 * optimizado para ser procesado por Inteligencia Artificial (ChatGPT, Claude, Gemini).
 */
export function AiExportButton({ markdown, periodLabel = 'Informe' }: AiExportButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `informe_financiero_${format(new Date(), 'yyyy-MM-dd')}.md`;

      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al descargar archivo .md:', err);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        onClick={handleCopy}
        variant="outline"
        className="gap-2 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-emerald-500" />
            <span>¡Copiado para IA!</span>
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 text-emerald-500" />
            <span>Copiar Prompt para IA</span>
          </>
        )}
      </Button>

      <Button
        onClick={handleDownload}
        variant="secondary"
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        <span>Descargar .md</span>
      </Button>
    </div>
  );
}
