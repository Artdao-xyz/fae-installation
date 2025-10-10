interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <main className="flex-1 border w-full max-w-8xl mx-auto px-4 border-green-500">
        {children}
    </main>
  );
}
