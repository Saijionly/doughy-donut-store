import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Categories from "@/components/Categories";
import BestSellers from "@/components/BestSellers";
import PromoSection from "@/components/PromoSection";
import WhyChooseUs from "@/components/WhyChooseUs";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7eee9] text-[#2d2424]">
      {/* Navigation */}
      <Navbar />

      {/* Hero */}
      <section
        id="home"
        className="relative scroll-mt-24"
      >
        <Hero />
      </section>

      {/* Product Categories */}
      <section className="relative">
        <Categories />
      </section>

      {/* Best Selling Products */}
      <section className="relative">
        <BestSellers />
      </section>

      {/* Promotional Banner */}
      <section className="relative">
        <PromoSection />
      </section>

      {/* Why Choose Us */}
      <section className="relative">
        <WhyChooseUs />
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}