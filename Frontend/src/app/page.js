import Image from "next/image";
import Hero from "@/components/home/Hero";
import About from "@/components/home/About"
import Services from "@/components/home/Services";
import Promo from "@/components/home/Promo";
import Artikel from '@/components/home/Artikel';

export default async function Home() {

  return (
    <>
    <Hero />
    <About />
    <Services />
    <Promo />
    <Artikel />
    </>
  );
}

