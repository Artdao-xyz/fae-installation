interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-8xl mx-auto px-4">
        {children}
      </div>
    </main>
  );
}
