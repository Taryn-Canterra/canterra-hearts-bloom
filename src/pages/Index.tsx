import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ValueProps } from "@/components/ValueProps";
import { SearchResults } from "@/components/SearchResults";
import { CtaSaveSearch } from "@/components/CtaSaveSearch";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <ValueProps />
        <SearchResults />
        <CtaSaveSearch />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
