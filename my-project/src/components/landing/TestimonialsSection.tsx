import * as React from "react";
import { Quote, Star } from "lucide-react";

// Phase 19: Testimonials — sample quotes, ผู้ใช้ปรับเป็นข้อมูลจริงภายหลังได้
interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  initials: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "We replaced four separate tools with this platform. Our order cycle time dropped by 40% in the first month.",
    author: "Naree Phongpaichit",
    role: "Head of Operations",
    company: "Siam Trading Group",
    initials: "NP",
  },
  {
    quote:
      "Inventory accuracy across our three warehouses finally hit 99%. The supplier portal alone saved us hours each week.",
    author: "James Tanaka",
    role: "Supply Chain Lead",
    company: "Pacific Distributors",
    initials: "JT",
  },
  {
    quote:
      "The credit and invoice automation is a game changer for our B2B customers. Overdue rate cut in half.",
    author: "Anya Setthapong",
    role: "Finance Director",
    company: "Bangkok Wholesale Hub",
    initials: "AS",
  },
];

export function TestimonialsSection(): React.ReactElement {
  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-heading"
      className="bg-white py-20 sm:py-24"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#CC785C]">
            Loved by operators
          </p>
          <h2
            id="testimonials-heading"
            className="mt-3 text-3xl font-bold tracking-tight text-[#2D2825] sm:text-4xl"
          >
            Trusted by wholesale teams across Asia
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <TestimonialCard key={t.author} testimonial={t} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface TestimonialCardProps {
  testimonial: Testimonial;
}

function TestimonialCard({ testimonial }: TestimonialCardProps): React.ReactElement {
  return (
    <figure className="flex h-full flex-col rounded-2xl border border-[#E8E0D5] bg-[#FBF8F3] p-6 transition-all hover:-translate-y-0.5 hover:border-[#CC785C]/30 hover:bg-white hover:shadow-md">
      <Quote className="h-6 w-6 text-[#D4A574]" aria-hidden="true" />
      <div
        className="mt-3 flex items-center gap-0.5 text-[#CC785C]"
        aria-label="Rated 5 out of 5"
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
        ))}
      </div>
      <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-[#2D2825]">
        “{testimonial.quote}”
      </blockquote>
      <figcaption className="mt-5 flex items-center gap-3 border-t border-[#E8E0D5] pt-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#CC785C] text-sm font-semibold text-white">
          {testimonial.initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#2D2825]">
            {testimonial.author}
          </p>
          <p className="truncate text-xs text-[#736B66]">
            {testimonial.role} · {testimonial.company}
          </p>
        </div>
      </figcaption>
    </figure>
  );
}
