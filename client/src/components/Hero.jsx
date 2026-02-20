import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

function Hero() {
  const heroRef = useRef(null);
  const imageRef = useRef(null);
  const buttonRef = useRef(null);

  const heroImage =
    "https://images.unsplash.com/photo-1549187774-b4e9b0445b41?w=900&auto=format&fit=crop&q=60";

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
      });

      // Image reveal
      tl.fromTo(
        imageRef.current,
        { scale: 1.2 },
        { scale: 1, duration: 1.8 }
      )

        // Title
        .from(
          ".hero-title",
          {
            y: 80,
            opacity: 0,
            duration: 1,
          },
          "-=1.2"
        )

        // Subtitle
        .from(
          ".hero-subtitle",
          {
            y: 40,
            opacity: 0,
            duration: 0.9,
          },
          "-=0.8"
        )

        // Button
        .from(
          buttonRef.current,
          {
            y: 30,
            opacity: 0,
            scale: 0.9,
            duration: 0.7,
            ease: "back.out(1.7)",
            clearProps: "all", // IMPORTANT
          },
          "-=0.6"
        );

      // Smooth hover animation (GSAP-safe)
      const hoverTL = gsap.timeline({ paused: true });

      hoverTL.to(buttonRef.current, {
        scale: 1.05,
        duration: 0.3,
        ease: "power2.out",
      }).to(
        ".hero-arrow",
        {
          x: 6,
          duration: 0.3,
          ease: "power2.out",
        },
        0
      );

      buttonRef.current.addEventListener("mouseenter", () => hoverTL.play());
      buttonRef.current.addEventListener("mouseleave", () => hoverTL.reverse());
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative h-[600px] flex items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 overflow-hidden">
        <img
          ref={imageRef}
          src={heroImage}
          alt="Luxury furniture showroom"
          className="w-full h-full object-cover opacity-70"
        />
      </div>

      <div className="relative container mx-auto px-4 z-10">
        <div className="max-w-2xl">
          <h1 className="hero-title text-5xl md:text-6xl font-serif font-bold mb-6 text-balance text-foreground">
            Elevate Your Living Space
          </h1>

          <p className="hero-subtitle text-xl mb-8 text-[hsl(40_20%_96%)] drop-shadow-md">
            Discover timeless furniture pieces crafted with precision and passion.
            Transform your house into a home with our curated collections.
          </p>

          <Link to="/shop">
            <button
              ref={buttonRef}
              className="rounded-xl bg-[hsl(25_45%_35%)] text-white flex items-center px-6 py-3 shadow-lg"
            >
              Shop Now
              <ArrowRight className="ml-2 h-5 w-5 hero-arrow" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Hero;