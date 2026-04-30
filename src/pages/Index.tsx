import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ProofBand } from "@/components/ProofBand";
import { ValueProps } from "@/components/ValueProps";
import { HowItWorks } from "@/components/HowItWorks";
import { SearchResults } from "@/components/SearchResults";
import { AgentVendorTeasers } from "@/components/AgentVendorTeasers";
import { CtaSaveSearch } from "@/components/CtaSaveSearch";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <ProofBand />
        <ValueProps />
        <HowItWorks />
        <SearchResults />
        <AgentVendorTeasers />
        <CtaSaveSearch />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
