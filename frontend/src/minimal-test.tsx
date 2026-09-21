import { useEffect, useState } from 'react';

export function MinimalTest() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1>Test Page</h1>
      <p>This is a minimal test</p>
    </div>
  );
}