import { Hero } from "./Hero";
import { Moats } from "./Moats";
import { Showcase } from "./Showcase";
import { Footer } from "./Footer";

// Browser-only marketing page (the desktop shell renders the app directly).
// Editorial light theme; the embedded dark terminal shots carry the contrast.
export function Landing() {
  return (
    <div className="min-h-dvh bg-[#080b10] font-sans text-[#f3f5f8] antialiased selection:bg-[#22d3ee] selection:text-[#06121a] [&_*]:select-text">
      <Hero />
      <Moats />
      <Showcase />
      <Footer />
    </div>
  );
}
