'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Paperclip,
  Send,
  Loader2,
  User,
  Bot,
  XCircle,
  File as FileIcon,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { chatWithBotAction } from '@/app/actions';

interface Message {
  role: 'user' | 'bot';
  content: string | React.ReactNode;
}

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_FILE_TYPES = [
  'image/png',
  'image/jpeg',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export function FinancialChatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
        toast({
          title: 'File too large',
          description: `Please select a file smaller than ${MAX_FILE_SIZE_MB}MB.`,
          variant: 'destructive',
        });
        return;
      }
      if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
        toast({
          title: 'Invalid file type',
          description:
            'Please select a PNG, JPG, PDF, or Word document.',
          variant: 'destructive',
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() && !file) return;

    const userMessageContent = (
      <div>
        <p>{input}</p>
        {file && (
          <div className="mt-2 flex items-center gap-2 rounded-md border p-2">
            <FileIcon className="h-4 w-4" />
            <span>{file.name}</span>
          </div>
        )}
      </div>
    );
    const userMessage: Message = { role: 'user', content: userMessageContent };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    let fileDataUri: string | null = null;
    if (file) {
      fileDataUri = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    const result = await chatWithBotAction({
      message: input,
      fileDataUri,
    });
    
    if (result.error) {
       setMessages(prev => [...prev, { role: 'bot', content: `Error: ${result.error}` }]);
    } else if (result.response) {
       setMessages(prev => [...prev, { role: 'bot', content: result.response! }]);
    }
    
    setInput('');
    setFile(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
    setIsLoading(false);
  };
  
  return (
    <Card className="flex h-[80vh] flex-col">
       <CardHeader>
        <CardTitle>AI Financial Advisor</CardTitle>
        <CardDescription>
          Ask me anything about your finances, upload a receipt, or get a personalized savings plan.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                message.role === 'user' ? 'justify-end' : ''
              }`}
            >
              {message.role === 'bot' && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Bot size={20} />
                </div>
              )}
              <div
                className={`max-w-md rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {typeof message.content === 'string' ? <p>{message.content}</p> : message.content}
              </div>
              {message.role === 'user' && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <User size={20} />
                </div>
              )}
            </div>
          ))}
           <div ref={messagesEndRef} />
        </div>
      </CardContent>
      <CardFooter className="border-t p-4">
        <div className="flex w-full items-center gap-2">
           <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept={ALLOWED_FILE_TYPES.join(',')}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip />
          </Button>
          <div className="relative flex-1">
             <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type your message or upload a file..."
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                disabled={isLoading}
            />
            {file && (
                <div className="absolute bottom-12 left-0 flex w-fit items-center gap-2 rounded-lg border bg-muted p-2 text-sm">
                    <FileIcon className="h-4 w-4" />
                    <span>{file.name}</span>
                     <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => {
                         setFile(null);
                         if(fileInput-ref.current) fileInputRef.current.value = '';
                     }}>
                        <XCircle className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            )}
          </div>
          <Button onClick={handleSendMessage} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Send />
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
