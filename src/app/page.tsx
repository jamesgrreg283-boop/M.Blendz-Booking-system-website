import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileBookButton } from "@/components/layout/mobile-book-button";
import { Hero } from "@/components/sections/hero";
import { Services } from "@/components/sections/services";
import { Booking } from "@/components/sections/booking";
import { About } from "@/components/sections/about";
import { Gallery } from "@/components/sections/gallery";
import { Reviews } from "@/components/sections/reviews";
import { Contact } from "@/components/sections/contact";

export default function Home() {
  return (
    <>
      <Header />
      <main className="mobile-main-pad md:pb-0">
        <Hero />
        <Services />
        <Booking />
        <About />
        <Gallery />
        <Reviews />
        <Contact />
      </main>
      <Footer />
      <MobileBookButton />
    </>
  );
}
