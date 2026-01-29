'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit, FileText, History, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface EvidenceItem {
  id: number;
  case_number: string;
  item_number: string;
  description: string;
  collected_date: string;
  collected_by: string;
  item_type_name?: string;
  item_type_category?: string;
  current_location_name?: string;
  current_custodian_name?: string;
  status: string;
  chain_of_custody?: string;
  notes?: string;
  extended_fields?: Record<string, any>;
  created_by_name?: string;
  created_at: string;
  updated_at?: string;
}

interface Note {
  id: number;
  note: string;
  created_by_name: string;
  created_at: string;
}

export default function EvidenceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<EvidenceItem | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchItemDetails();
    }
  }, [params.id]);

  const fetchItemDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/evidence-v2/${params.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch evidence details');
      }
      
      const data = await response.json();
      setItem(data.item);
      setNotes(data.notes || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      stored: 'bg-blue-500',
      'in_analysis': 'bg-yellow-500',
      released: 'bg-green-500',
      destroyed: 'bg-red-500',
    };
    
    return (
      <Badge className={`${variants[status] || 'bg-gray-500'} text-white`}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading evidence details...</p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error Loading Evidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error || 'Evidence item not found'}</p>
            <Button onClick={() => router.push('/dashboard')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/dashboard')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">
                  {item.case_number} - {item.item_number}
                </h1>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(item.status)}
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="details" className="w-full">
          <TabsList>
            <TabsTrigger value="details">
              <FileText className="mr-2 h-4 w-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="custody">
              <History className="mr-2 h-4 w-4" />
              Chain of Custody
            </TabsTrigger>
            <TabsTrigger value="photos">
              <ImageIcon className="mr-2 h-4 w-4" />
              Photos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Core evidence details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Case Number</label>
                    <p className="text-lg">{item.case_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Item Number</label>
                    <p className="text-lg">{item.item_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <p className="text-lg">{item.description}</p>
                  </div>
                  {item.item_type_name && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Item Type</label>
                      <p className="text-lg">
                        {item.item_type_name}
                        {item.item_type_category && (
                          <span className="text-muted-foreground"> ({item.item_type_category})</span>
                        )}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Collection Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Collection Details</CardTitle>
                  <CardDescription>When and where the evidence was collected</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Collected Date</label>
                    <p className="text-lg">{formatDate(item.collected_date)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Collected By</label>
                    <p className="text-lg">{item.collected_by}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">{getStatusBadge(item.status)}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Current Location & Custody */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Location & Custody</CardTitle>
                  <CardDescription>Where the evidence is now</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {item.current_location_name && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Location</label>
                      <p className="text-lg">{item.current_location_name}</p>
                    </div>
                  )}
                  {item.current_custodian_name && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Current Custodian</label>
                      <p className="text-lg">{item.current_custodian_name}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Extended Fields (if any) */}
              {item.extended_fields && Object.keys(item.extended_fields).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Details</CardTitle>
                    <CardDescription>Item-specific information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(item.extended_fields).map(([key, value]) => (
                      <div key={key}>
                        <label className="text-sm font-medium text-muted-foreground">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </label>
                        <p className="text-lg">{String(value)}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Notes Section */}
            {item.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{item.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Chain of Custody Text */}
            {item.chain_of_custody && (
              <Card>
                <CardHeader>
                  <CardTitle>Chain of Custody (Legacy)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{item.chain_of_custody}</p>
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
                <CardDescription>System information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created By:</span>
                  <span>{item.created_by_name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created At:</span>
                  <span>{formatDate(item.created_at)}</span>
                </div>
                {item.updated_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span>{formatDate(item.updated_at)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="custody" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Chain of Custody History</CardTitle>
                <CardDescription>Complete transfer history (coming soon)</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Full custody transfer tracking will be available in Phase 4 of the enhancement plan.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="photos" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Evidence Photos</CardTitle>
                <CardDescription>Associated images and documentation</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Photo management will be available in Phase 4 of the enhancement plan.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
