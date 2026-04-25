export const Footer = () => {
  return (
    <footer className="border-t border-border bg-background py-12">
      <div className="container">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="font-display text-xl font-semibold text-primary">Canterra</div>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              The intelligent horse property platform. Horse &amp; Hearth Group · eXp Realty ·
              Colorado Beta 2025.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
            <a href="#search" className="hover:text-primary">Search</a>
            <a href="#how" className="hover:text-primary">How it works</a>
            <a href="#vendors" className="hover:text-primary">Vendor network</a>
            <a href="#agents" className="hover:text-primary">For agents</a>
          </div>
        </div>
        <div className="mt-8 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Horse &amp; Hearth Group. Listing data via REcolorado &amp;
          Pikes Peak MLS IDX feeds.
        </div>
      </div>
    </footer>
  );
};
