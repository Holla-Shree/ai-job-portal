
'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, CalendarPlus, Search, MoreVertical, Trash2, Eraser, Pin, PinOff, X, CheckSquare, MessageSquare, ListChecks, Bell, BellOff, Heart, Mail, Settings, Star, Loader2 } from "lucide-react";
import withAuth from '@/components/withAuth';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Checkbox } from "@/components/ui/checkbox";
import Link from 'next/link';
import { useNotifications, Conversation } from '@/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

function MessagingPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const { 
        conversations, 
        setConversations,
        markAsRead, 
        toggleMute
    } = useNotifications();
    const searchParams = useSearchParams();
    
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);
    const [conversationToClear, setConversationToClear] = useState<Conversation | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [isMessageSelectionMode, setIsMessageSelectionMode] = useState(false);
    const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
    const [isConvSelectionMode, setIsConvSelectionMode] = useState(false);
    const [selectedConversations, setSelectedConversations] = useState<string[]>([]);
    const [filter, setFilter] = useState<'all' | 'unread' | 'favorites'>('all');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const selectedConversation = useMemo(() => {
        return conversations.find(c => c.id === selectedConversationId) || null;
    }, [selectedConversationId, conversations]);

    
    useEffect(() => {
        const openConversationId = searchParams.get('open');
        const suggestedMessage = searchParams.get('message');

        if (openConversationId && openConversationId !== selectedConversationId) {
            const conversationToOpen = conversations.find(c => c.id === openConversationId);
            if (conversationToOpen) {
                setSelectedConversationId(conversationToOpen.id);
                if (suggestedMessage) {
                    setMessageInput(decodeURIComponent(suggestedMessage));
                }
                if (user && conversationToOpen.unreadBy.includes(user.id)) {
                    markAsRead(conversationToOpen.id);
                }
                // Clean up URL params
                const newParams = new URLSearchParams(window.location.search);
                newParams.delete('open');
                newParams.delete('message');
                router.replace(`${window.location.pathname}?${newParams.toString()}`);
            }
        }
    }, [searchParams, conversations, markAsRead, router, user, selectedConversationId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedConversation?.messages]);


    const filteredConversations = useMemo(() => {
        if (!user) return [];
        let convos = [...conversations];
        if (filter === 'unread') {
            convos = convos.filter(c => c.unreadBy.includes(user.id));
        } else if (filter === 'favorites') {
            convos = convos.filter(c => c.favourited);
        }

        return convos.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return b.timestamp - a.timestamp;
        });
    }, [conversations, filter, user]);
    
    const showPinAction = useMemo(() => {
        if (selectedConversations.length === 0) return false;
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
        
        setSelectedConversationId(conversationId);
        setMessageInput(''); 
        
        const conversation = conversations.find(c => c.id === conversationId);
        if (user && conversation && conversation.unreadBy.includes(user.id)) {
            markAsRead(conversationId);
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !selectedConversation || selectedConversation.partnerRole === 'System') return;

        const newMessage = {
            id: `msg${Date.now()}`,
            sender: 'me' as const,
            text: messageInput,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        // This part needs to be wired up to a real backend (e.g., Firestore update)
        // For now, it will only update local state
        setConversations(prev => prev.map(c => 
            c.id === selectedConversationId ? {
                ...c,
                messages: [...c.messages, newMessage],
                lastMessage: newMessage.text,
                timestamp: Date.now()
            } : c
        ));
        
        setMessageInput('');
    };

    const handleScheduleInterview = () => {
        toast({
            title: "Interview Scheduled!",
            description: `An invitation has been sent to ${selectedConversation?.partnerName}.`
        });
    };

    const handleClearMessages = () => {
        if (!conversationToClear) return;
        setConversations(prev => prev.map(c => c.id === conversationToClear.id ? { ...c, messages: [] } : c));
        toast({ title: "Messages Cleared", description: "The chat history has been cleared." });
        setConversationToClear(null);
    };

    const handleDeleteConversation = () => {
        if (!conversationToDelete) return;
        setConversations(prev => prev.filter(c => c.id !== conversationToDelete.id));
        if (selectedConversationId === conversationToDelete.id) {
            setSelectedConversationId(null);
        }
        setConversationToDelete(null);
        toast({ title: "Conversation Deleted", description: "The conversation has been removed." });
    };
    
    const handleTogglePin = (convo: Conversation | null) => {
        if (!convo) return;
        setConversations(prev => prev.map(c => c.id === convo.id ? { ...c, pinned: !c.pinned } : c));
        toast({ title: `Conversation ${convo.pinned ? 'unpinned' : 'pinned'}`});
    };

    const handleToggleFavourite = (convo: Conversation | null) => {
        if (!convo) return;
        setConversations(prev => prev.map(c => c.id === convo.id ? { ...c, favourited: !c.favourited } : c));
        toast({ title: `Conversation ${convo.favourited ? 'removed from' : 'added to'} favourites`});
    };
    
    const handleToggleMute = (convo: Conversation | null) => {
        if (!convo || !user) return;
        toggleMute(convo.id);
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
        setConversations(prev => prev.map(c => 
            c.id === selectedConversation.id 
            ? { ...c, messages: c.messages.filter(m => !selectedMessages.includes(m.id)) }
            : c
        ));
        toast({ title: `${selectedMessages.length} Message(s) Deleted` });
        setIsMessageSelectionMode(false);
        setSelectedMessages([]);
    };

    const handleBulkPin = (pin: boolean) => {
        setConversations(prev => prev.map(c => 
            selectedConversations.includes(c.id) ? { ...c, pinned: pin } : c
        ));
        toast({ title: `${selectedConversations.length} conversation(s) ${pin ? 'pinned' : 'unpinned'}` });
        setIsConvSelectionMode(false);
        setSelectedConversations([]);
    }

    const handleBulkDelete = () => {
        setConversations(prev => prev.filter(c => !selectedConversations.includes(c.id)));
        if (selectedConversations.includes(selectedConversation?.id || '')) {
            setSelectedConversationId(null);
        }
        toast({ title: `${selectedConversations.length} conversation(s) deleted` });
        setIsConvSelectionMode(false);
        setSelectedConversations([]);
    }

    const renderAvatar = (convo: Conversation) => {
        if (convo.partnerRole === 'System') {
            return (
                <Avatar className="h-10 w-10 border bg-accent text-accent-foreground">
                    <AvatarFallback><Bell className="h-5 w-5"/></AvatarFallback>
                </Avatar>
            );
        }
        return (
            <Avatar className="h-10 w-10 border">
                <AvatarImage src={`https://placehold.co/40x40.png?text=${convo.avatar}`} alt={convo.partnerName} data-ai-hint="person avatar" />
                <AvatarFallback>{convo.avatar}</AvatarFallback>
            </Avatar>
        );
    }
    
    const ConversationContextMenu = ({ convo }: { convo: Conversation }) => (
        <ContextMenuContent onSelect={(e) => e.preventDefault()}>
            {convo.partnerRole !== 'System' && (
                <>
                    <ContextMenuItem onClick={() => handleTogglePin(convo)}>
                        {convo.pinned ? <PinOff className="mr-2 h-4 w-4" /> : <Pin className="mr-2 h-4 w-4" />}
                        <span>{convo.pinned ? 'Unpin Chat' : 'Pin Chat'}</span>
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleToggleMute(convo)}>
                        {user && convo.mutedBy.includes(user.id) ? <Bell className="mr-2 h-4 w-4" /> : <BellOff className="mr-2 h-4 w-4" />}
                        <span>{user && convo.mutedBy.includes(user.id) ? 'Unmute' : 'Mute'}</span>
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => {
                        toast({ title: 'Marked as unread' });
                    }}>
                        <Mail className="mr-2 h-4 w-4" />
                        <span>Mark as unread</span>
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleToggleFavourite(convo)}>
                        <Heart className={cn("mr-2 h-4 w-4", convo.favourited && "fill-current text-red-500")} />
                        <span>{convo.favourited ? 'Remove from Favourites' : 'Add to Favourites'}</span>
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={() => {setIsMessageSelectionMode(true); setSelectedMessages([]); setSelectedConversationId(convo.id);}}>
                        <CheckSquare className="mr-2 h-4 w-4" />
                        Select Messages
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => setConversationToClear(convo)}>
                        <Eraser className="mr-2 h-4 w-4" />
                        Clear Messages
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                </>
            )}
             <ContextMenuItem className="text-destructive" onClick={() => setConversationToDelete(convo)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Conversation
            </ContextMenuItem>
        </ContextMenuContent>
    );

    const getPlaceholderText = () => {
        if (user?.role === 'user') {
            return "Choose a conversation from the left panel to view messages and connect with recruiters.";
        }
        if (user?.role === 'recruiter') {
            return "Choose a conversation from the left panel to view messages and connect with candidates.";
        }
        return "Choose a conversation from the left panel to view messages and connect with candidates or recruiters.";
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
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-5 w-5" />
                                    <span className="sr-only">More Options</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setIsConvSelectionMode(true); setSelectedConversations([]); }}>
                                    <CheckSquare className="mr-2 h-4 w-4" />
                                    Select Chats
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/messaging/settings">
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>Messaging Settings</span>
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setIsConvSelectionMode(false); setSelectedConversations([]); }}>
                            <X className="h-5 w-5" />
                        </Button>
                        <h3 className="font-semibold text-sm">{selectedConversations.length} selected</h3>
                        <div className="flex-grow" />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" disabled={selectedConversations.length === 0}>
                                    <MoreVertical className="h-4 w-4"/>
                                    <span className="sr-only">More actions</span>
                                </Button>
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
                                <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()} onClick={handleBulkDelete}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
                <div className="relative mt-2">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search..." className="pl-8" />
                </div>
                 <div className="flex items-center gap-2 mt-4 text-sm">
                    <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => setFilter('all')}>All</Button>
                    <Button variant={filter === 'unread' ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => setFilter('unread')}>Unread</Button>
                    <Button variant={filter === 'favorites' ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => setFilter('favorites')}>Favorites</Button>
                </div>
                {user?.role === 'recruiter' && (
                    <Button asChild variant="outline" className="w-full mt-4">
                        <Link href="/dashboard/recruiter?tab=shortlisted">
                            <Star className="mr-2 h-4 w-4" /> View Shortlisted Candidates
                        </Link>
                    </Button>
                )}
            </CardHeader>
            <CardContent className="p-0 flex-1">
                <ScrollArea className="h-full">
                    <div className="p-2 space-y-1">
                    {filteredConversations.map(convo => (
                        <ContextMenu key={convo.id}>
                            <ContextMenuTrigger>
                                <div
                                    className={cn(
                                        "group flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors relative",
                                        selectedConversationId === convo.id && !isConvSelectionMode ? "bg-primary/10" : "hover:bg-muted/50",
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
                                    {renderAvatar(convo)}
                                    <div className="flex-1 truncate">
                                        <div className="flex justify-between items-center">
                                            <p className={cn("font-semibold text-sm truncate pr-2", user && convo.unreadBy.includes(user.id) && "font-bold")}>{convo.partnerName}</p>
                                            <div className="flex items-center gap-1.5">
                                                {user && convo.mutedBy.includes(user.id) && <BellOff className="h-4 w-4 text-muted-foreground shrink-0" />}
                                                {convo.favourited && <Heart className="h-4 w-4 text-red-500 fill-current shrink-0" />}
                                                {convo.pinned && <Pin className="h-4 w-4 text-primary fill-current shrink-0" />}
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">{convo.partnerRole === 'System' ? `Regarding: ${convo.jobTitle}` : user?.role === 'recruiter' ? convo.partnerRole : convo.jobTitle}</p>
                                        <p className="text-xs text-muted-foreground truncate mt-1">{convo.lastMessage}</p>
                                    </div>
                                    {user && convo.unreadBy.includes(user.id) && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
                                    )}
                                </div>
                            </ContextMenuTrigger>
                            <ConversationContextMenu convo={convo} />
                        </ContextMenu>
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
                        {renderAvatar(selectedConversation)}
                        <div>
                            <CardTitle className="font-headline text-lg">{selectedConversation.partnerName}</CardTitle>
                            <CardDescription>{user?.role === 'recruiter' && selectedConversation.partnerRole !== 'System' ? `Candidate for: ${selectedConversation.jobTitle}` : selectedConversation.jobTitle}</CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                     {user?.role === 'recruiter' && selectedConversation.partnerRole === 'Candidate' && (
                        <Button size="sm" variant="outline" onClick={handleScheduleInterview}>
                            <CalendarPlus className="mr-2 h-4 w-4" />
                            Schedule Interview
                        </Button>
                     )}
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {selectedConversation.partnerRole !== 'System' && (
                                <>
                                    <DropdownMenuItem onClick={() => handleTogglePin(selectedConversation)}>
                                        {selectedConversation.pinned ? <PinOff className="mr-2 h-4 w-4" /> : <Pin className="mr-2 h-4 w-4" />}
                                        <span>{selectedConversation.pinned ? 'Unpin' : 'Pin'} Chat</span>
                                    </DropdownMenuItem>
                                     <DropdownMenuItem onClick={() => handleToggleMute(selectedConversation)}>
                                        {user && selectedConversation.mutedBy.includes(user.id) ? <Bell className="mr-2 h-4 w-4" /> : <BellOff className="mr-2 h-4 w-4" />}
                                        <span>{user && selectedConversation.mutedBy.includes(user.id) ? 'Unmute' : 'Mute'}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => {
                                         toast({ title: 'Marked as unread' });
                                    }}>
                                        <Mail className="mr-2 h-4 w-4" />
                                        <span>Mark as unread</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleToggleFavourite(selectedConversation)}>
                                        <Heart className={cn("mr-2 h-4 w-4", selectedConversation.favourited && "fill-current text-red-500")} />
                                        <span>{selectedConversation.favourited ? 'Remove from Favourites' : 'Add to Favourites'}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => {setIsMessageSelectionMode(true); setSelectedMessages([]);}}>
                                        <CheckSquare className="mr-2 h-4 w-4" />
                                        Select Messages
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setConversationToClear(selectedConversation); }}>
                                          <Eraser className="mr-2 h-4 w-4" />
                                          Clear Messages
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                </>
                            )}
                            <DropdownMenuItem className="text-destructive" onSelect={(e) => { e.preventDefault(); setConversationToDelete(selectedConversation); }}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Conversation
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
                     <Button variant="ghost" size="icon" onClick={() => setSelectedConversationId(null)}>
                        <X className="h-5 w-5" />
                        <span className="sr-only">Close Chat</span>
                    </Button>
                    </div>
                    </>
                    )}
                </CardHeader>
                <CardContent className="flex-1 p-4 overflow-y-auto">
                    <ScrollArea className="h-full pr-4">
                        <div className="space-y-4">
                        {selectedConversation.messages.map(msg => (
                            <div key={msg.id} className={cn("flex items-end gap-2", 
                                msg.sender === 'me' ? 'justify-end' : 
                                msg.sender === 'system' ? 'justify-center' :
                                'justify-start'
                            )}>
                                {isMessageSelectionMode && msg.sender !== 'system' && (
                                <Checkbox 
                                    id={`msg-select-${msg.id}`}
                                    checked={selectedMessages.includes(msg.id)}
                                    onCheckedChange={() => handleMessageSelection(msg.id)}
                                    className={cn("self-center", msg.sender === 'me' ? 'order-last ml-2' : 'mr-2')}
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
                                    msg.sender === 'me' ? 'bg-primary text-primary-foreground rounded-br-none' : 
                                    msg.sender === 'system' ? 'bg-accent/20 text-accent-foreground w-full text-center italic' :
                                    'bg-muted rounded-bl-none'
                                )}>
                                    <p>{msg.text}</p>
                                    <p className="text-xs opacity-70 mt-1 text-right">{msg.timestamp}</p>
                                </div>
                                {msg.sender === 'me' && user && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user.avatar} alt="My Avatar" data-ai-hint="person avatar" />
                                        <AvatarFallback>{user.email ? user.email.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                        </div>
                    </ScrollArea>
                </CardContent>
                <CardFooter className="p-4 border-t">
                    <form onSubmit={handleSendMessage} className="w-full flex items-center gap-2">
                        <Input
                            placeholder={selectedConversation.partnerRole === 'System' ? 'This is a system notification.' : 'Type your message...'}
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            disabled={selectedConversation.partnerRole === 'System'}
                        />
                        <Button type="submit" size="icon" disabled={selectedConversation.partnerRole === 'System'}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </CardFooter>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                    <MessageSquare className="w-16 h-16 mb-4" />
                    <h3 className="text-xl font-semibold">Select a conversation</h3>
                    <p className="max-w-xs">{getPlaceholderText()}</p>
                </div>
            )}
        </Card>
      </div>

      <AlertDialog open={!!conversationToDelete || !!conversationToClear} onOpenChange={(open) => {
          if (!open) {
              setConversationToDelete(null);
              setConversationToClear(null);
          }
      }}>
          <AlertDialogContent>
              {conversationToDelete && (
                  <>
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
                  </>
              )}
              {conversationToClear && (
                  <>
                      <AlertDialogHeader>
                          <AlertDialogTitle>Clear all messages?</AlertDialogTitle>
                          <AlertDialogDescription>
                              This action cannot be undone. All messages in this conversation will be permanently deleted.
                          </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleClearMessages} className="bg-destructive hover:bg-destructive/90">
                              Yes, clear messages
                          </AlertDialogAction>
                      </AlertDialogFooter>
                  </>
              )}
          </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

function MessagingPageWrapper() {
    return (
        <React.Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        }>
            <MessagingPage />
        </React.Suspense>
    )
}

export default withAuth(MessagingPageWrapper, ['user', 'recruiter', 'admin']);
