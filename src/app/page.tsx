import { Navbar } from "@/components/Navbar";
import { AzurizBanner } from "@/components/AzurizBanner";
import { Hero } from "@/components/sections/Hero";
import { Ecosystem } from "@/components/sections/Ecosystem";
import { Cases } from "@/components/sections/Cases";
import { Partners } from "@/components/sections/Partners";
import { Stack } from "@/components/sections/Stack";
import { HowWeWork } from "@/components/sections/HowWeWork";
import { Cta } from "@/components/sections/Cta";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <AzurizBanner />
      <main className="flex-1">
        <Hero />
        <Ecosystem />
        <Cases />
        <Partners />
        <Stack />
        <HowWeWork />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
