'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { Plus, LogOut, Scale } from 'lucide-react';

interface EvidenceItem {
  id: number;
  case_number: string;
  item_number: string;
  description: string;
  collected_date: string;
  collected_by: string;
  location?: string;
  status: string;
  notes?: string;
  created_by_name?: string;
  created_at: string;
}

export default function DashboardPage() {
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    case_number: '',
    item_number: '',
    description: '',
    collected_date: new Date().toISOString().split('T')[0],
    collected_by: '',
    location: '',
    status: 'stored',
    notes: '',
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/evidence');
      if (res.status === 401) {
        router.push('/');
        return;
      }
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error('Failed to fetch items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const res = await fetch('/api/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowForm(false);
        setFormData({
          case_number: '',
          item_number: '',
          description: '',
          collected_date: new Date().toISOString().split('T')[0],
          collected_by: '',
          location: '',
          status: 'stored',
          notes: '',
        });
        await fetchItems();
      } else {
        const errorData = await res.json();
        console.error('Error creating evidence:', errorData);
        alert('Failed to create evidence item: ' + (errorData.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Failed to create item:', err);
      alert('Connection error while creating evidence item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Scale className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Evidence Property Manager</h1>
              <p className="text-sm text-muted-foreground">Digital Evidence Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button onClick={handleLogout} variant="destructive" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Actions Bar */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">Evidence Items</h2>
            <p className="text-muted-foreground">{items.length} item{items.length !== 1 ? 's' : ''} total</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            variant={showForm ? "outline" : "default"}
          >
            {showForm ? 'Cancel' : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add New Item
              </>
            )}
          </Button>
        </div>

        {/* Add Form */}
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Evidence Item</CardTitle>
              <CardDescription>Enter the details of the evidence item to add to the system</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="case_number">Case Number *</Label>
                    <Input
                      id="case_number"
                      type="text"
                      value={formData.case_number}
                      onChange={(e) => setFormData({ ...formData, case_number: e.target.value })}
                      placeholder="e.g., 2024-12345"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item_number">Item Number *</Label>
                    <Input
                      id="item_number"
                      type="text"
                      value={formData.item_number}
                      onChange={(e) => setFormData({ ...formData, item_number: e.target.value })}
                      placeholder="e.g., ITEM-001"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detailed description of the evidence item"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="collected_date">Collected Date *</Label>
                    <Input
                      id="collected_date"
                      type="date"
                      value={formData.collected_date}
                      onChange={(e) => setFormData({ ...formData, collected_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="collected_by">Collected By *</Label>
                    <Input
                      id="collected_by"
                      type="text"
                      value={formData.collected_by}
                      onChange={(e) => setFormData({ ...formData, collected_by: e.target.value })}
                      placeholder="Name of collector"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Storage Location</Label>
                    <Input
                      id="location"
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Locker 5, Shelf A"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="stored">Stored</option>
                      <option value="in-analysis">In Analysis</option>
                      <option value="released">Released</option>
                      <option value="destroyed">Destroyed</option>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes or chain of custody information"
                    rows={2}
                  />
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                  {submitting ? 'Adding Evidence...' : 'Add Evidence Item'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Evidence Items Table */}
        <Card>
          <CardContent className="p-0">
            {items.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Scale className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg">No evidence items found</p>
                <p className="text-sm mt-2">Click "Add New Item" to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Case #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Item #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Collected</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Collected By</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{item.case_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{item.item_number}</td>
                        <td className="px-6 py-4 text-sm max-w-xs truncate">{item.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {new Date(item.collected_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{item.collected_by}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{item.location || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.status === 'stored' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            item.status === 'in-analysis' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            item.status === 'released' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
