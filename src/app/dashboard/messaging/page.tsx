
'use client';
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, CalendarPlus, Search, MoreVertical, Trash2, Eraser, Pin, PinOff, X, CheckSquare, MessageSquare, ListChecks } from "lucide-react";
import withAuth from '@/components/withAuth';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';

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
  pinned: boolean;
}

const getMockConversations = (role: 'recruiter' | 'user' | 'admin'): Conversation[] => {
    if (role === 'user') {
      return [
        {
          id: 'conv1',
          partnerName: 'Recruiter @ TekSystems India',
          partnerRole: 'Recruiter',
          jobTitle: 'Senior Backend Engineer',
          lastMessage: 'That sounds great! I am available to chat tomorrow.',
          avatar: 'R',
          messages: [
            { id: 'msg1', sender: 'other', text: 'Hi Priya, thanks for your interest in the Senior Backend Engineer role. Your profile looks impressive.', timestamp: '10:30 AM' },
            { id: 'msg2', sender: 'me', text: 'Thank you! I am very interested in the position.', timestamp: '10:31 AM' },
            { id: 'msg3', sender: 'other', text: 'Excellent. Would you be available for a brief call tomorrow to discuss your experience further?', timestamp: '10:32 AM' },
            { id: 'msg4', sender: 'me', text: 'That sounds great! I am available to chat tomorrow.', timestamp: '10:33 AM' },
          ],
          pinned: true,
        },
        {
          id: 'conv2',
          partnerName: 'HR @ Google',
          partnerRole: 'Recruiter',
          jobTitle: 'Data Scientist',
          lastMessage: 'Sure, I will share it shortly.',
          avatar: 'G',
          messages: [
            { id: 'msg1', sender: 'other', text: 'Hi there, we have received your application for the Data Scientist role. Can you please share your portfolio?', timestamp: 'Yesterday' },
            { id: 'msg2', sender: 'me', text: 'Sure, I will share it shortly.', timestamp: 'Yesterday' },
          ],
          pinned: false,
        },
      ];
    }
    return [
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
          { id: 'msg3', sender: 'me', text: 'Excellent. Would you be available for a brief call tomorrow to discuss your experience further?', timestamp: '10:32 AM' },
          { id: 'msg4', sender: 'other', text: 'That sounds great! I am available to chat tomorrow.', timestamp: '10:33 AM' },
        ],
        pinned: true,
      },
      {
        id: 'conv2',
        partnerName: 'Rohan Sharma',
        partnerRole: 'Candidate',
        jobTitle: 'Data Scientist',
        lastMessage: 'Yes, I have submitted my resume via the portal.',
        avatar: 'RS',
        messages: [
          { id: 'msg1', sender: 'me', text: 'Hi Rohan, I saw your application for the Data Scientist role. Have you submitted your full resume?', timestamp: 'Yesterday' },
          { id: 'msg2', sender: 'other', text: 'Yes, I have submitted my resume via the portal.', timestamp: 'Yesterday' },
        ],
        pinned: false,
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
        ],
        pinned: false,
      }
    ];
};


function MessagingPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [conversations, setConversations] = useState<Conversation[]>(getMockConversations(user?.role || 'user'));
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(conversations.find(c => c.pinned) || conversations[0] || null);
    const [messageInput, setMessageInput] = useState('');
    const [isMessageSelectionMode, setIsMessageSelectionMode] = useState(false);
    const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
    const [isConvSelectionMode, setIsConvSelectionMode] = useState(false);
    const [selectedConversations, setSelectedConversations] = useState<string[]>([]);

    const sortedConversations = useMemo(() => {
        return [...conversations].sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return 0; // In a real app, you'd sort by last message timestamp here
        });
    }, [conversations]);
    
    const showPinAction = useMemo(() => {
        if (selectedConversations.length === 0) return false;
        // If any selected conversation is not pinned, show the Pin action
        return selectedConversations.some(id => !conversations.find(c => c.id === id)?.pinned);
    }, [selectedConversations, conversations]);

    const handleSelectConversation = (conversationId: string) => {
        if(isConvSelectionMode) {
             setSelectedConversations(prev => 
                prev.includes(conversationId) 
                ? prev.filter(id => id !== conversationId)
                : [...prev, conversationId]
            );
            return;
        }

        if (isMessageSelectionMode) {
            setIsMessageSelectionMode(false);
            setSelectedMessages([]);
        }
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
                return { ...c, messages: updatedMessages, lastMessage: newMessage.text };
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

    const handleClearMessages = () => {
        if (!selectedConversation) return;
        const updatedConversations = conversations.map(c => {
            if (c.id === selectedConversation.id) return { ...c, messages: [], lastMessage: "Chat cleared" };
            return c;
        });
        setConversations(updatedConversations);
        setSelectedConversation(prev => prev ? { ...prev, messages: [] } : null);
        toast({ title: "Messages Cleared", description: "The chat history has been cleared." });
    };

    const handleDeleteConversation = () => {
        if (!selectedConversation) return;
        const updatedConversations = conversations.filter(c => c.id !== selectedConversation.id);
        setConversations(updatedConversations);
        setSelectedConversation(updatedConversations[0] || null);
        toast({ title: "Conversation Deleted", description: "The conversation has been removed." });
    };

    const handleMessageSelection = (messageId: string) => {
        setSelectedMessages(prev => 
            prev.includes(messageId) 
            ? prev.filter(id => id !== messageId)
            : [...prev, messageId]
        );
    };

    const handleDeleteSelectedMessages = () => {
        if (!selectedConversation) return;
        const updatedMessages = selectedConversation.messages.filter(msg => !selectedMessages.includes(msg.id));
        
        const updatedConversations = conversations.map(c => {
            if (c.id === selectedConversation.id) {
                return { ...c, messages: updatedMessages, lastMessage: updatedMessages.length > 0 ? updatedMessages[updatedMessages.length - 1].text : "Messages deleted" };
            }
            return c;
        });
        
        setConversations(updatedConversations);
        setSelectedConversation(prev => prev ? { ...prev, messages: updatedMessages } : null);
        toast({ title: `${selectedMessages.length} Message(s) Deleted` });
        setIsMessageSelectionMode(false);
        setSelectedMessages([]);
    };

    const handleBulkPin = (pin: boolean) => {
        setConversations(prev => prev.map(c => selectedConversations.includes(c.id) ? { ...c, pinned: pin } : c));
        toast({ title: `${selectedConversations.length} conversation(s) ${pin ? 'pinned' : 'unpinned'}` });
        setIsConvSelectionMode(false);
        setSelectedConversations([]);
    };

    const handleBulkDelete = () => {
        setConversations(prev => prev.filter(c => !selectedConversations.includes(c.id)));
        if (selectedConversations.includes(selectedConversation?.id || '')) {
            setSelectedConversation(conversations.filter(c => !selectedConversations.includes(c.id))[0] || null);
        }
        toast({ title: `${selectedConversations.length} conversation(s) deleted` });
        setIsConvSelectionMode(false);
        setSelectedConversations([]);
    }


  return (
    <div className="container mx-auto py-8">
      <div className="h-[calc(100vh-theme(spacing.32))] grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Conversations List */}
        <Card className="md:col-span-1 lg:col-span-1 shadow-xl flex flex-col h-full">
            <CardHeader className="p-4 border-b">
                {!isConvSelectionMode ? (
                    <div className="flex justify-between items-center">
                        <CardTitle className="font-headline text-2xl">Conversations</CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => { setIsConvSelectionMode(true); setSelectedConversations([]); }}>
                            <ListChecks className="h-5 w-5" />
                            <span className="sr-only">Select Conversations</span>
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setIsConvSelectionMode(false)}>
                            <X className="h-5 w-5" />
                        </Button>
                        <h3 className="font-semibold text-sm">{selectedConversations.length} selected</h3>
                        <div className="flex-grow" />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" disabled={selectedConversations.length === 0}>Actions</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {showPinAction ? (
                                    <DropdownMenuItem onClick={() => handleBulkPin(true)}>
                                        <Pin className="mr-2 h-4 w-4" /> Pin
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem onClick={() => handleBulkPin(false)}>
                                        <PinOff className="mr-2 h-4 w-4" /> Unpin
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                     <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete {selectedConversations.length} conversations?</AlertDialogTitle>
                                            <AlertDialogDescription>This action cannot be undone and will permanently delete the selected conversations.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90">
                                                Confirm Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
                <div className="relative mt-2">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search..." className="pl-8" />
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
                <ScrollArea className="h-full">
                    <div className="p-2 space-y-1">
                    {sortedConversations.map(convo => (
                        <div
                            key={convo.id}
                            className={cn(
                                "group flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                                selectedConversation?.id === convo.id && !isConvSelectionMode ? "bg-primary/10" : "hover:bg-muted/50",
                                isConvSelectionMode && selectedConversations.includes(convo.id) && "bg-muted"
                            )}
                            onClick={() => handleSelectConversation(convo.id)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSelectConversation(convo.id)}
                            tabIndex={0}
                            role="button"
                        >
                            {isConvSelectionMode && (
                                <Checkbox 
                                    checked={selectedConversations.includes(convo.id)} 
                                    onCheckedChange={() => handleSelectConversation(convo.id)}
                                    className="mt-2"
                                    aria-label={`Select conversation with ${convo.partnerName}`}
                                />
                            )}
                            <Avatar className="h-10 w-10 border">
                                 <AvatarImage src={`https://placehold.co/40x40.png?text=${convo.avatar}`} alt={convo.partnerName} data-ai-hint="person avatar" />
                                <AvatarFallback>{convo.avatar}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 truncate">
                                <div className="flex justify-between items-start">
                                    <p className="font-semibold text-sm truncate pr-2">{convo.partnerName}</p>
                                    {convo.pinned && <Pin className="h-4 w-4 text-primary fill-current shrink-0" />}
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
                    {isMessageSelectionMode ? (
                        <div className="flex items-center gap-4 w-full">
                            <Button variant="ghost" size="icon" onClick={() => { setIsMessageSelectionMode(false); setSelectedMessages([]); }}>
                                <X className="h-5 w-5" />
                            </Button>
                            <h3 className="font-semibold">{selectedMessages.length} selected</h3>
                            <div className="flex-grow" />
                            <Button size="sm" variant="destructive" onClick={handleDeleteSelectedMessages} disabled={selectedMessages.length === 0}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        </div>
                    ) : (
                    <>
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
                    <div className="flex items-center gap-2">
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
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {setIsMessageSelectionMode(true); setSelectedMessages([]);}}>
                                <CheckSquare className="mr-2 h-4 w-4" />
                                Select Messages
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleClearMessages}>
                                <Eraser className="mr-2 h-4 w-4" />
                                Clear Messages
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Conversation
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete this conversation and remove its data from our servers.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDeleteConversation} className="bg-destructive hover:bg-destructive/90">
                                            Yes, delete conversation
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </DropdownMenuContent>
                     </DropdownMenu>
                    </div>
                    </>
                    )}
                </CardHeader>
                <CardContent className="flex-1 p-4 overflow-y-auto">
                    <div className="space-y-4">
                    {selectedConversation.messages.map(msg => (
                        <div key={msg.id} className={cn("flex items-end gap-2", msg.sender === 'me' ? 'justify-end' : 'justify-start')}>
                            {isMessageSelectionMode && (
                               <Checkbox 
                                 id={`msg-select-${msg.id}`}
                                 checked={selectedMessages.includes(msg.id)}
                                 onCheckedChange={() => handleMessageSelection(msg.id)}
                                 className={cn(msg.sender === 'me' ? 'order-last ml-2' : 'mr-2')}
                               />
                            )}
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
                                    <AvatarImage src={`https://placehold.co/40x40.png`} alt="My Avatar" data-ai-hint="person avatar" />
                                    <AvatarFallback>{user?.role === 'user' ? 'JS' : user?.role.charAt(0).toUpperCase()}</AvatarFallback>
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
                    <MessageSquare className="w-16 h-16 mb-4" />
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
