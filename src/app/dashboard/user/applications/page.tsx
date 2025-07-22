
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import withAuth from '@/components/withAuth';
import { useNotifications, ApplicationNotification } from '@/contexts/NotificationContext';
import { format } from 'date-fns';
import { ArrowUpDown, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';

type SortKey = keyof ApplicationNotification;

function ApplicationHistoryPage() {
    const { applicationHistory } = useNotifications();
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>({ key: 'timestamp', direction: 'descending' });

    const sortedApplications = useMemo(() => {
        let sortableItems = [...applicationHistory];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [applicationHistory, sortConfig]);

    const requestSort = (key: SortKey) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };
    
    const getSortIndicator = (key: SortKey) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
        }
        return sortConfig.direction === 'ascending' ? '▲' : '▼';
    }

    const getStatusBadgeVariant = (status: ApplicationNotification['status']) => {
        switch (status) {
            case 'Applied': return 'secondary';
            case 'Under Review': return 'default';
            case 'Interview': return 'default';
            case 'Offer': return 'default';
            case 'Rejected': return 'destructive';
            default: return 'outline';
        }
    };


    return (
        <div className="container mx-auto py-8">
            <Card className="shadow-xl">
                <CardHeader>
                    <div className="flex items-center gap-3">
                         <ListChecks className="h-8 w-8 text-primary" />
                         <div>
                            <CardTitle className="font-headline text-3xl">My Applications</CardTitle>
                            <CardDescription>Track the status of all your job applications.</CardDescription>
                         </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>
                                     <Button variant="ghost" onClick={() => requestSort('jobTitle')}>
                                        Job Title
                                        {getSortIndicator('jobTitle')}
                                     </Button>
                                </TableHead>
                                <TableHead>
                                     <Button variant="ghost" onClick={() => requestSort('company')}>
                                        Company
                                        {getSortIndicator('company')}
                                     </Button>
                                </TableHead>
                                <TableHead>
                                     <Button variant="ghost" onClick={() => requestSort('timestamp')}>
                                        Date Applied
                                        {getSortIndicator('timestamp')}
                                     </Button>
                                </TableHead>
                                <TableHead>
                                     <Button variant="ghost" onClick={() => requestSort('status')}>
                                        Status
                                        {getSortIndicator('status')}
                                    </Button>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedApplications.length > 0 ? (
                                sortedApplications.map(app => (
                                    <TableRow key={app.id}>
                                        <TableCell className="font-medium">{app.jobTitle}</TableCell>
                                        <TableCell>{app.company}</TableCell>
                                        <TableCell>{format(new Date(app.timestamp), 'PPP')}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(app.status)}>{app.status}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                        You haven't applied to any jobs yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

export default withAuth(ApplicationHistoryPage, ['user', 'admin']);
