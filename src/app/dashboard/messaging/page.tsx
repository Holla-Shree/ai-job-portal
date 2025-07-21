
'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, CalendarPlus, Search } from "lucide-react";
import withAuth from '@/components/withAuth';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  sender: 'me' | 'other';
  text: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  partnerName: string;
  partnerRole: 'Recruiter' | 'Candidate';
  jobTitle: string;
  lastMessage: string;
  avatar: string;
  messages: Message[];
}

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv1',
    partnerName: 'Priya Patel',
    partnerRole: 'Candidate',
    jobTitle: 'Senior Backend Engineer',
    lastMessage: 'That sounds great! I am available to chat tomorrow.',
    avatar: 'PP',
    messages: [
      { id: 'msg1', sender: 'me', text: 'Hi Priya, thanks for your interest in the Senior Backend Engineer role. Your profile looks impressive.', timestamp: '10:30 AM' },
      { id: 'msg2', sender: 'other', text: 'Thank you! I am very interested in the position.', timestamp: '10:31 AM' },
      { id: 'msg3', sender: 'me', text: 'That sounds great! I am available to chat tomorrow.', timestamp: '10:32 AM' },
    ]
  },
  {
    id: 'conv2',
    partnerName: 'Recruiter Admin',
    partnerRole: 'Recruiter',
    jobTitle: 'Data Scientist',
    lastMessage: 'Yes, I have submitted my resume via the portal.',
    avatar: 'RA',
     messages: [
      { id: 'msg1', sender: 'other', text: 'Hi, I saw your application for the Data Scientist role. Have you submitted your full resume?', timestamp: 'Yesterday' },
      { id: 'msg2', sender: 'me', text: 'Yes, I have submitted my resume via the portal.', timestamp: 'Yesterday' },
    ]
  },
   {
    id: 'conv3',
    partnerName: 'Anjali Menon',
    partnerRole: 'Candidate',
    jobTitle: 'Junior Frontend Developer',
    lastMessage: 'Perfect, looking forward to it.',
    avatar: 'AM',
     messages: [
      { id: 'msg1', sender: 'me', text: 'Hello Anjali, we were impressed with your portfolio and would like to schedule a brief introductory call.', timestamp: '2 days ago' },
      { id: 'msg2', sender: 'other', text: 'Thank you so much! I\'d love that. What time works for you?', timestamp: '2 days ago' },
       { id: 'msg3', sender: 'me', text: 'How about Friday at 2 PM?', timestamp: '2 days ago' },
       { id: 'msg4', sender: 'other', text: 'Perfect, looking forward to it.', timestamp: '2 days ago' },
    ]
  }
];


function MessagingPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(conversations[0] || null);
    const [messageInput, setMessageInput] = useState('');

    const handleSelectConversation = (conversationId: string) => {
        const conversation = conversations.find(c => c.id === conversationId);
        setSelectedConversation(conversation || null);
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !selectedConversation) return;

        const newMessage: Message = {
            id: `msg${Date.now()}`,
            sender: 'me',
            text: messageInput,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const updatedConversations = conversations.map(c => {
            if (c.id === selectedConversation.id) {
                const updatedMessages = [...c.messages, newMessage];
                return {
                    ...c,
                    messages: updatedMessages,
                    lastMessage: newMessage.text,
                };
            }
            return c;
        });

        setConversations(updatedConversations);
        setSelectedConversation(prev => prev ? { ...prev, messages: [...prev.messages, newMessage] } : null);
        setMessageInput('');
    };

    const handleScheduleInterview = () => {
        toast({
            title: "Interview Scheduled!",
            description: `An invitation has been sent to ${selectedConversation?.partnerName}.`
        });
    };

  return (
    <div className="container mx-auto py-8">
      <div className="h-[calc(100vh-theme(spacing.32))] grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Conversations List */}
        <Card className="md:col-span-1 lg:col-span-1 shadow-xl flex flex-col h-full">
            <CardHeader className="p-4 border-b">
                <CardTitle className="font-headline text-2xl">Conversations</CardTitle>
                <div className="relative mt-2">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search..." className="pl-8" />
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
                <ScrollArea className="h-full">
                    <div className="p-2 space-y-1">
                    {conversations.map(convo => (
                        <div
                            key={convo.id}
                            className={cn(
                                "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                                selectedConversation?.id === convo.id ? "bg-primary/10" : "hover:bg-muted/50"
                            )}
                            onClick={() => handleSelectConversation(convo.id)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSelectConversation(convo.id)}
                            tabIndex={0}
                            role="button"
                        >
                            <Avatar className="h-10 w-10 border">
                                 <AvatarImage src={`https://placehold.co/40x40.png?text=${convo.avatar}`} alt={convo.partnerName} data-ai-hint="person avatar" />
                                <AvatarFallback>{convo.avatar}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 truncate">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold text-sm truncate">{convo.partnerName}</p>
                                    <p className="text-xs text-muted-foreground">{convo.messages[convo.messages.length - 1].timestamp}</p>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{user?.role === 'recruiter' ? convo.partnerRole : convo.jobTitle}</p>
                                <p className="text-xs text-muted-foreground truncate mt-1">{convo.lastMessage}</p>
                            </div>
                        </div>
                    ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>

        {/* Active Chat Window */}
        <Card className="md:col-span-2 lg:col-span-3 shadow-xl flex flex-col h-full">
            {selectedConversation ? (
                <>
                <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border">
                            <AvatarImage src={`https://placehold.co/40x40.png?text=${selectedConversation.avatar}`} alt={selectedConversation.partnerName} data-ai-hint="person avatar" />
                            <AvatarFallback>{selectedConversation.avatar}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="font-headline text-lg">{selectedConversation.partnerName}</CardTitle>
                            <CardDescription>{user?.role === 'recruiter' ? `Candidate for: ${selectedConversation.jobTitle}` : selectedConversation.jobTitle}</CardDescription>
                        </div>
                    </div>
                     {user?.role === 'recruiter' && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                    <CalendarPlus className="mr-2 h-4 w-4" />
                                    Schedule Interview
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Schedule Interview with {selectedConversation.partnerName}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This will send a calendar invitation to both parties to discuss the {selectedConversation.jobTitle} position.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleScheduleInterview}>Confirm & Send Invite</AlertDialogAction>
                            </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                     )}
                </CardHeader>
                <CardContent className="flex-1 p-4 overflow-y-auto">
                    <div className="space-y-4">
                    {selectedConversation.messages.map(msg => (
                        <div key={msg.id} className={cn("flex items-end gap-2", msg.sender === 'me' ? 'justify-end' : 'justify-start')}>
                            {msg.sender === 'other' && (
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={`https://placehold.co/40x40.png?text=${selectedConversation.avatar}`} alt={selectedConversation.partnerName} data-ai-hint="person avatar" />
                                    <AvatarFallback>{selectedConversation.avatar}</AvatarFallback>
                                </Avatar>
                            )}
                             <div className={cn(
                                'max-w-[70%] p-3 rounded-xl text-sm',
                                msg.sender === 'me' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none'
                             )}>
                                <p>{msg.text}</p>
                                <p className="text-xs opacity-70 mt-1 text-right">{msg.timestamp}</p>
                             </div>
                            {msg.sender === 'me' && (
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={`https://placehold.co/40x40.png?text=${user?.role.charAt(0).toUpperCase()}`} alt="My Avatar" data-ai-hint="person avatar" />
                                    <AvatarFallback>{user?.role.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    ))}
                    </div>
                </CardContent>
                <CardFooter className="p-4 border-t">
                    <form onSubmit={handleSendMessage} className="w-full flex items-center gap-2">
                        <Input
                            placeholder="Type your message..."
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                        />
                        <Button type="submit" size="icon">
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </CardFooter>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                    <Send className="w-16 h-16 mb-4" />
                    <h3 className="text-xl font-semibold">Select a conversation</h3>
                    <p className="max-w-xs">Choose a conversation from the left panel to view messages and connect with candidates or recruiters.</p>
                </div>
            )}
        </Card>
      </div>
    </div>
  );
}

export default withAuth(MessagingPage, ['user', 'recruiter', 'admin']);
