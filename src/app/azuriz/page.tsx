import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AzurizClient } from "./AzurizClient";

export const metadata: Metadata = {
  title: "Ô torcedor — site errado, mas pode ser sua chance",
  description:
    "Você procurava o Azuriz FC e caiu no Azuris. Já que tá aqui, que tal aprender inglês para acompanhar seu time fora do Brasil?",
  robots: { index: false, follow: true },
};

export default function AzurizPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16">
        <AzurizClient />
      </main>
      <Footer />
    </>
  );
}
