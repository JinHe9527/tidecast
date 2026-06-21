import { Hero } from "./Hero";
import { Moats } from "./Moats";
import { Showcase } from "./Showcase";
import { Footer } from "./Footer";

// Browser-only marketing page (the desktop shell renders the app directly).
// Editorial light theme; the embedded dark terminal shots carry the contrast.
export function Landing() {
  return (
    <div className="min-h-dvh bg-[#f4f4f2] font-sans text-[#0b0b0c] antialiased selection:bg-[#0ea5c4] selection:text-white [&_*]:select-text">
      <Hero />
      <Moats />
      <Showcase />
      <Footer />
    </div>
  );
}
