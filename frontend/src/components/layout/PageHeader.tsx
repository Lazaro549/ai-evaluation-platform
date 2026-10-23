interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6 px-4 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-gray-500 mt-1">{description}</p>}
      </div>
      {children}
    </div>
  );
}
