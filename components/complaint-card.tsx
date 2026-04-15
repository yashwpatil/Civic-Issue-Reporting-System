'use client';

import { Complaint } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { categoryLabels, statusLabels, formatDate } from '@/lib/utils-civic';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ComplaintCardProps {
  complaint: Complaint;
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
  onStatusChange?: (id: string, status: Complaint['status']) => void;
}

export function ComplaintCard({
  complaint,
  onDelete,
  isAdmin,
  onStatusChange,
}: ComplaintCardProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/complaints/${complaint.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete complaint');
      }

      toast({
        title: 'Success',
        description: 'Complaint deleted successfully.',
      });

      onDelete?.(complaint.id);
    } catch (error) {
      console.error('Error deleting complaint:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete complaint.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: Complaint['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {complaint.image_url && (
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              className="group relative w-full h-48 overflow-hidden bg-muted transition-transform duration-200 hover:scale-[1.01]"
            >
              <img
                src={complaint.image_url}
                alt={complaint.title}
                className="w-full h-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 flex h-12 items-center justify-center bg-black/50 text-sm font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                View image
              </span>
            </button>
          </DialogTrigger>
          <DialogContent className="p-0 bg-transparent shadow-none max-w-5xl">
            <img
              src={complaint.image_url}
              alt={complaint.title}
              className="w-full max-h-[80vh] object-contain rounded-2xl"
            />
          </DialogContent>
        </Dialog>
      )}
      
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="line-clamp-2">{complaint.title}</CardTitle>
            <p className="text-sm text-foreground/60 mt-1">
              {categoryLabels[complaint.category] || complaint.category} • {formatDate(complaint.created_at || complaint.createdAt || new Date().toISOString())}
            </p>
          </div>
          <Badge className={`shrink-0 ${getStatusColor(complaint.status)}`}>
            {statusLabels[complaint.status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-foreground/70 line-clamp-2">{complaint.description}</p>
        
        <div className="text-sm space-y-2">
          <p className="text-foreground/60">
            <span className="font-medium">Location:</span> {complaint.location}
          </p>
          {complaint.address && complaint.address !== complaint.location && (
            <p className="text-foreground/60">
              <span className="font-medium">Address:</span> {complaint.address}
            </p>
          )}
          {complaint.latitude && complaint.longitude && (
            <p className="text-foreground/60">
              <span className="font-medium">Coordinates:</span> {complaint.latitude}, {complaint.longitude}
            </p>
          )}
          {complaint.audio && (
            <div className="mt-2 w-full overflow-hidden rounded-md border border-border">
              <audio controls src={complaint.audio} className="w-full" />
            </div>
          )}
        </div>

        {complaint.contactEmail && (
          <div className="text-sm">
            <p className="text-foreground/60">
              <span className="font-medium">Email:</span> {complaint.contactEmail}
            </p>
          </div>
        )}

        {isAdmin && onStatusChange && (
          <div className="flex flex-wrap gap-2 pt-4">
            {['pending', 'in-progress', 'resolved'].map((status) => (
              <Button
                key={status}
                size="sm"
                variant={complaint.status === status ? 'default' : 'outline'}
                onClick={() => onStatusChange(complaint.id, status as Complaint['status'])}
                className="whitespace-nowrap"
              >
                {statusLabels[status as Complaint['status']]}
              </Button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isDeleting} className="whitespace-nowrap">
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Complaint</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this complaint? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex justify-end gap-2">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
