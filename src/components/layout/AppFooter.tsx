export function AppFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} JobMatch AI. All rights reserved.</p>
        <p className="mt-1">
          Powered by AI, built with Next.js and Firebase.
        </p>
      </div>
    </footer>
  );
}
