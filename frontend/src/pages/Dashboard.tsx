import { PageHeader } from '@/components/layout/PageHeader';

export function Dashboard() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Page ready — connect to the FastAPI backend to load real data."
      />
      <div className="max-w-7xl mx-auto px-4">
        <div className="rounded-lg border bg-white dark:bg-gray-900 p-8 text-center text-gray-500">
          <p className="text-lg font-medium mb-2">Dashboard</p>
          <p className="text-sm">
            This is a polished stub. The real implementation uses the API client
            in <code className="bg-gray-100 px-1 rounded">src/api/</code> and the
            chart / table components already present in the repo.
          </p>
        </div>
      </div>
    </div>
  );
}
