interface PageWrapperProps {
  title?: string;
  children: React.ReactNode;
}

export function PageWrapper({ title, children }: PageWrapperProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {title && (
        <h1 className="font-sans font-semibold text-text-primary text-2xl mb-6">
          {title}
        </h1>
      )}
      {children}
    </div>
  );
}
