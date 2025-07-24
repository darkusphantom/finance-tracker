'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'bot';
  content: string;
  file?: {
    name: string;
    type: string;
  };
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
    try {
      const storedMessages = localStorage.getItem('chatHistory');
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      }
    } catch (error) {
        console.error("Failed to parse chat history from localStorage", error);
        localStorage.removeItem('chatHistory');
    }
  }, []);

  useEffect(() => {
    if(messages.length > 0) {
        localStorage.setItem('chatHistory', JSON.stringify(messages));
    }
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

    let userMessage: Message = { role: 'user', content: input };
    if (file) {
      userMessage.file = { name: file.name, type: file.type };
    }

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    let fileDataUri: string | null = null;
    if (file) {
      try {
        fileDataUri = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
      } catch (error) {
        console.error("Error reading file:", error);
        toast({
            title: "File Read Error",
            description: "Could not process the attached file.",
            variant: "destructive"
        });
        setIsLoading(false);
        // Remove the message that failed to send
        setMessages(prev => prev.slice(0, prev.length -1));
        return;
      }
    }

    // Keep the full history for context, but only the last message for the action
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
  
  const MessageContent = ({ message }: { message: Message }) => {
    const content = (
        <div>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                className="prose dark:prose-invert"
                components={{
                    p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal list-inside" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc list-inside" {...props} />,
                }}
            >
                {message.content}
            </ReactMarkdown>
            {message.file && (
                <div className="mt-2 flex items-center gap-2 rounded-md border p-2 text-sm bg-background/30">
                    <FileIcon className="h-4 w-4" />
                    <span>{message.file.name}</span>
                </div>
            )}
        </div>
    );
    return content;
  }


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
              className={cn('flex items-start gap-3', { 'justify-end': message.role === 'user' })}
            >
              {message.role === 'bot' && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
                  <Bot size={20} />
                </div>
              )}
              <div
                className={cn('max-w-xl rounded-lg p-3', {
                  'bg-primary text-primary-foreground': message.role === 'user',
                  'bg-muted': message.role === 'bot',
                })}
              >
                <MessageContent message={message} />
              </div>
              {message.role === 'user' && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted shrink-0">
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
            disabled={isLoading}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <Paperclip />
          </Button>
          <div className="relative flex-1">
             <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type your message or upload a file..."
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                disabled={isLoading}
            />
            {file && (
                <div className="absolute bottom-12 left-0 flex w-fit items-center gap-2 rounded-lg border bg-muted p-2 text-sm">
                    <FileIcon className="h-4 w-4" />
                    <span className='truncate max-w-xs'>{file.name}</span>
                     <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => {
                         setFile(null);
                         if(fileInputRef.current) fileInputRef.current.value = '';
                     }}>
                        <XCircle className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            )}
          </div>
          <Button onClick={handleSendMessage} disabled={isLoading || (!input.trim() && !file)}>
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
