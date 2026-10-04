import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/States';

export function TestPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      await new Promise(r => setTimeout(r, 100));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <PageHeader title="Test" subtitle="Loading…" action={<LoadingState message="" />} />
        <Card><CardContent className="p-6"><LoadingState message="" /></CardContent></Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="Test" subtitle="Error" />
        <Card><CardContent className="p-6 text-center py-12">
          <p className="text-destructive">{error}</p>
          <Button onClick={fetchData} className="mt-4">Retry</Button>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <PageHeader
        title="Test Page"
        subtitle="This is a test"
        action={<Button variant="outline" size="sm" onClick={fetchData}>Refresh</Button>}
      />
      <Card>
        <CardHeader><CardTitle>Content</CardTitle></CardHeader>
        <CardContent className="pt-0">
          <p>Test content here</p>
        </CardContent>
      </Card>
    </div>
  );
}