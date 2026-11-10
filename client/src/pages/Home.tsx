import { useEffect, useRef, useState, type RefObject } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Clock3,
  Facebook,
  Flower2,
  Heart,
  Instagram,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  MessageSquareText,
  Phone,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { DEFAULT_CONTENT, type HomeContent } from "@/lib/content";
import { loadHomeContent } from "@/lib/supabase";
import { waLink } from "@/lib/contact";
import BookingModal from "@/components/BookingModal";
import BrandMark from "@/components/BrandMark";
import { Link } from "wouter";

const trustIcons = [UserRound, MessageSquareText, ShieldCheck];

// WhatsApp glyph (lucide has no brand icon for it).
function WhatsAppIcon({ size = 17 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.05-.52-.099-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.48 3.488 11.821 11.821 0 0 0 12.05 0zm0 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884z" />
    </svg>
  );
}

// Opens pages (internal routes) with client-side navigation, everything else
// (anchors, WhatsApp links, external URLs) as a normal link.
function ServiceLink({
  href,
  className,
  label,
  children,
}: {
  href: string;
  className?: string;
  label?: string;
  children: React.ReactNode;
}) {
  if (href.startsWith("/")) {
    return (
      <Link className={className} aria-label={label} href={href}>
        {children}
      </Link>
    );
  }
  return (
    <a className={className} href={href} aria-label={label}>
      {children}
    </a>
  );
}

function Brand({ content }: { content: HomeContent }) {
  return (
    <a
      href="#home"
      className="brand-lockup"
      aria-label={`${content.brand.name} home`}
    >
      <span className="brand-symbol">
        <BrandMark />
      </span>
      <span className="brand-words">
        <strong>{content.brand.name}</strong>
        <small>{content.brand.descriptor}</small>
      </span>
    </a>
  );
}

export default function Home() {
  const [content, setContent] = useState<HomeContent>(DEFAULT_CONTENT);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);
  const quotesRef = useRef<HTMLDivElement>(null);
  const [quotePages, setQuotePages] = useState(1);
  const [quoteActive, setQuoteActive] = useState(0);
  const openBooking = () => setBookingOpen(true);

  useEffect(() => {
    let active = true;
    loadHomeContent().then(value => {
      if (active) setContent(value);
    });
    return () => {
      active = false;
    };
  }, []);

  // Scroll-reveal: cards and headings glide in as they enter the viewport.
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>("[data-reveal]");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      targets.forEach(el => el.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px" }
    );
    targets.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [content]);

  // Auto-advance a snapshot carousel; pauses on hover and while offscreen.
  const useAutoAdvance = (
    scrollerRef: RefObject<HTMLDivElement | null>,
    delay: number
  ) =>
    useEffect(() => {
      const el = scrollerRef.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
        return;
      let hovered = false;
      let visible = true;
      const io = new IntersectionObserver(
        entries => entries.forEach(e => (visible = e.isIntersecting)),
        { threshold: 0.3 }
      );
      io.observe(el);
      const timer = window.setInterval(() => {
        if (hovered || !visible) return;
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 12) {
          el.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          el.scrollBy({ left: el.clientWidth * 0.9, behavior: "smooth" });
        }
      }, delay);
      const onEnter = () => (hovered = true);
      const onLeave = () => (hovered = false);
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
      return () => {
        window.clearInterval(timer);
        io.disconnect();
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      };
    }, [scrollerRef, delay]);

  useAutoAdvance(servicesRef, 6500);
  useAutoAdvance(quotesRef, 6000);

  // Dot pagination for the stories carousel.
  useEffect(() => {
    const el = quotesRef.current;
    if (!el) return;
    const update = () => {
      const pages = Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth));
      const page = Math.min(
        pages - 1,
        Math.round(el.scrollLeft / el.clientWidth)
      );
      setQuotePages(pages);
      setQuoteActive(page);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [content]);

  const scrollCarousel = (
    scrollerRef: RefObject<HTMLDivElement | null>,
    direction: -1 | 1
  ) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: el.clientWidth * 0.9 * direction, behavior: "smooth" });
  };

  const CarouselNav = ({
    scrollerRef,
  }: {
    scrollerRef: RefObject<HTMLDivElement | null>;
  }) => (
    <div className="carousel-nav">
      <button
        className="carousel-arrow"
        type="button"
        aria-label="Scroll back"
        onClick={() => scrollCarousel(scrollerRef, -1)}
      >
        <ArrowLeft size={17} strokeWidth={1.5} />
      </button>
      <button
        className="carousel-arrow"
        type="button"
        aria-label="Scroll forward"
        onClick={() => scrollCarousel(scrollerRef, 1)}
      >
        <ArrowRight size={17} strokeWidth={1.5} />
      </button>
    </div>
  );

  // "#book" opens the booking dialog; mapped hrefs resolve to real URLs.
  const resolveHref = (href: string) =>
    href === "#whatsapp"
      ? waLink(
          content.contact.whatsapp || content.contact.phone,
          `Hello ${content.brand.name}, I would like to know more about your services.`
        )
      : href;

  const onAnchorClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (href !== "#book") return;
    event.preventDefault();
    openBooking();
  };

  const waHref = resolveHref(content.cta.secondaryHref);
  const visibleQuotes = content.testimonials.items.filter(item => item.visible);

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="site-header__inner">
          <Brand content={content} />
          <button
            className="menu-toggle"
            type="button"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
          <nav
            className={`main-nav ${menuOpen ? "is-open" : ""}`}
            aria-label="Main navigation"
          >
            {content.navigation.map(item => (
              <a
                key={item.href + item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <a
              className="main-nav__cta"
              href={content.hero.primaryHref}
              onClick={event => {
                setMenuOpen(false);
                onAnchorClick(event, content.hero.primaryHref);
              }}
            >
              {content.hero.primaryCta} <ArrowUpRight size={14} />
            </a>
          </nav>
          <a
            className="button button--green header-cta"
            href={content.hero.primaryHref}
            onClick={event => onAnchorClick(event, content.hero.primaryHref)}
          >
            {content.hero.primaryCta} <ArrowUpRight size={14} />
          </a>
        </div>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero__photo">
            <img src={content.hero.image} alt={content.hero.imageAlt} />
          </div>
          <div className="hero__wash" />
          <div className="hero__content">
            <p className="eyebrow">{content.hero.eyebrow}</p>
            <h1>
              {content.hero.headline} <em>{content.hero.focus}</em>
            </h1>
            <p className="hero__description">{content.hero.description}</p>
            <div className="hero__actions">
              <a
                className="button button--green"
                href={content.hero.primaryHref}
                onClick={event => onAnchorClick(event, content.hero.primaryHref)}
              >
                {content.hero.primaryCta} <ArrowRight size={15} />
              </a>
              <a className="text-link" href={content.hero.secondaryHref}>
                {content.hero.secondaryCta} <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </section>

        <section className="trust-strip" aria-label="Our approach">
          <div className="trust-strip__inner">
            {content.trustItems.map((item, index) => {
              const Icon = trustIcons[index % trustIcons.length];
              return (
                <div className="trust-item" key={`${index}-${item}`}>
                  <span className="trust-item__icon">
                    <Icon size={17} strokeWidth={1.35} />
                  </span>
                  <span>{item}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="process section-wrap" id="process">
          <div className="process__copy" data-reveal>
            <p className="eyebrow">{content.process.eyebrow}</p>
            <h2>
              {content.process.title} <em>{content.process.focus}</em>
            </h2>
            <p className="section-intro">{content.process.intro}</p>
            <ol className="step-list">
              {content.process.steps.map((step, index) => (
                <li className="step-item" key={`${index}-${step.title}`}>
                  <span className="step-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="step-item__text">
                    <strong>{step.title}</strong>
                    <small>{step.description}</small>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <figure className="process__photo">
            <img src={content.process.image} alt={content.process.imageAlt} />
            <figcaption>{content.process.photoCaption}</figcaption>
          </figure>
        </section>

        <section className="services section-wrap" id="services">
          <div className="section-heading section-heading--services section-heading--nav">
            <div>
              <p className="eyebrow" data-reveal>
                {content.services.eyebrow}
              </p>
              <h2 data-reveal>
                {content.services.title}
                <br />
                <em>{content.services.focus}</em>
              </h2>
            </div>
            <p className="section-intro" data-reveal>
              {content.services.description}
            </p>
            <CarouselNav scrollerRef={servicesRef} />
          </div>
          <div className="service-grid h-carousel" ref={servicesRef}>
            {content.services.items
              .filter(service => service.visible)
              .map((service, index) => (
                <article
                  className="service-card"
                  key={service.id}
                  data-reveal
                  style={{ "--reveal-delay": `${index * 90}ms` } as React.CSSProperties}
                >
                  <ServiceLink
                    className="service-card__image"
                    href={service.linkHref}
                    label={`${service.linkLabel} ${service.title}`}
                  >
                    <img
                      src={service.image}
                      alt={service.imageAlt}
                      loading="lazy"
                    />
                  </ServiceLink>
                  <div className="service-card__body">
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                    <ServiceLink
                      className="service-link"
                      href={service.linkHref}
                    >
                      {service.linkLabel} <ArrowRight size={14} />
                    </ServiceLink>
                  </div>
                </article>
              ))}
          </div>
        </section>

        <section className="about" id="about">
          <figure className="about__photo">
            <img
              src={content.about.image}
              alt={content.about.imageAlt}
              loading="lazy"
            />
            <span className="about__photo-label">
              {content.about.photoCaption}
            </span>
          </figure>
          <div className="about__copy" data-reveal>
            <p className="eyebrow">{content.about.eyebrow}</p>
            <h2>
              {content.about.title}
              <br />
              <em>{content.about.focus}</em>
            </h2>
            {content.about.subline && (
              <p className="about__subline">{content.about.subline}</p>
            )}
            {content.about.paragraphs.map((paragraph, index) => (
              <p className="about__paragraph" key={index}>
                {paragraph}
              </p>
            ))}
            <a className="text-link" href={content.about.linkHref}>
              {content.about.linkLabel} <ArrowRight size={14} />
            </a>
            <span className="about__ornament">
              <Flower2 size={38} strokeWidth={0.8} />
            </span>
          </div>
        </section>

        <section className="testimonials section-wrap" id="testimonials">
          <div className="section-heading section-heading--quotes">
            <div data-reveal>
              <p className="eyebrow">{content.testimonials.eyebrow}</p>
              <h2>{content.testimonials.title}</h2>
            </div>
          </div>
          {visibleQuotes.length >= 2 ? (
            <>
              <div className="quote-carousel h-carousel" ref={quotesRef}>
                {visibleQuotes.map((item, index) => (
                  <article
                    className="quote-card"
                    key={item.id}
                    data-reveal
                    style={{ "--reveal-delay": `${index * 90}ms` } as React.CSSProperties}
                  >
                    <span className="quote-mark">“</span>
                    <p className="quote-card__text">{item.quote}</p>
                    <div className="quote-card__byline">
                      <strong>{item.name}</strong>
                      <span>{item.detail}</span>
                    </div>
                  </article>
                ))}
              </div>
              <div className="carousel-footer">
                <button
                  className="carousel-arrow"
                  type="button"
                  aria-label="Scroll back"
                  onClick={() => scrollCarousel(quotesRef, -1)}
                >
                  <ArrowLeft size={17} strokeWidth={1.5} />
                </button>
                <div className="carousel-dots">
                  {Array.from({ length: quotePages }).map((_, i) => (
                    <button
                      className={`carousel-dot${
                        i === quoteActive ? " is-active" : ""
                      }`}
                      key={i}
                      type="button"
                      aria-label={`Go to page ${i + 1}`}
                      onClick={() =>
                        quotesRef.current?.scrollTo({
                          left: i * quotesRef.current.clientWidth,
                          behavior: "smooth",
                        })
                      }
                    />
                  ))}
                </div>
                <button
                  className="carousel-arrow"
                  type="button"
                  aria-label="Scroll forward"
                  onClick={() => scrollCarousel(quotesRef, 1)}
                >
                  <ArrowRight size={17} strokeWidth={1.5} />
                </button>
              </div>
            </>
          ) : (
            <div className="quote-grid">
              {visibleQuotes.map(item => (
                <article className="quote-card" key={item.id}>
                  <span className="quote-mark">“</span>
                  <p className="quote-card__text">{item.quote}</p>
                  <div className="quote-card__byline">
                    <strong>{item.name}</strong>
                    <span>{item.detail}</span>
                  </div>
                </article>
              ))}
              {content.testimonials.items.every(item => !item.visible) && (
                <p className="empty-note">{content.testimonials.emptyMessage}</p>
              )}
            </div>
          )}
        </section>

        <section
          className={`booking-banner${
            content.cta.image ? " booking-banner--photo" : ""
          }`}
          style={
            content.cta.image
              ? { backgroundImage: `url(${content.cta.image})` }
              : undefined
          }
        >
          <div className="booking-banner__inner">
            <div>
              <p className="eyebrow eyebrow--light">{content.cta.eyebrow}</p>
              <h2>{content.cta.title}</h2>
              <p>{content.cta.description}</p>
            </div>
            <div className="booking-banner__actions">
              {waHref && (
                <a
                  className="button button--outline-light"
                  href={waHref}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle size={15} /> {content.cta.secondaryCta}
                </a>
              )}
              <a
                className="button button--cream"
                href={content.cta.primaryHref}
                onClick={event => onAnchorClick(event, content.cta.primaryHref)}
              >
                {content.cta.primaryCta} <ArrowRight size={15} />
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer" id="contact">
        <div className="footer-main">
          <div className="footer-brand">
            <Brand content={content} />
            <p>{content.brand.footerLine}</p>
            <div className="footer-brand__socials">
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Instagram"
              >
                <Instagram size={17} strokeWidth={1.6} />
              </a>
              <a
                href="https://www.facebook.com/"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Facebook"
              >
                <Facebook size={17} strokeWidth={1.6} />
              </a>
              <a
                href={waLink(
                  content.contact.whatsapp,
                  `Hello ${content.brand.name}, I would like to know more.`
                )}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="WhatsApp"
              >
                <WhatsAppIcon />
              </a>
            </div>
          </div>
          <div className="footer-links">
            <p className="footer-label">{content.footer.quickLinksLabel}</p>
            {content.navigation.map(item => (
              <a key={item.href + item.label} href={item.href}>
                {item.label}
              </a>
            ))}
            <a href="/admin">Admin</a>
          </div>
          <div className="footer-contact">
            <p className="footer-label">{content.contact.eyebrow}</p>
            <h3 className="footer-contact__title">{content.contact.title}</h3>
            {content.contact.address && (
              <p>
                <MapPin size={14} />
                {content.contact.address}
              </p>
            )}
            {content.contact.phone && (
              <a href={`tel:+${content.contact.phone.replace(/\D/g, "")}`}>
                <Phone size={14} />
                {content.contact.phone}
              </a>
            )}
            {content.contact.whatsapp && (
              <a
                href={waLink(
                  content.contact.whatsapp,
                  `Hello ${content.brand.name}, I would like to know more about your services.`
                )}
                target="_blank"
                rel="noreferrer"
              >
                <MessageSquareText size={14} />
                WhatsApp {content.contact.whatsapp}
              </a>
            )}
            {content.contact.email && (
              <a href={`mailto:${content.contact.email}`}>
                <Mail size={14} />
                {content.contact.email}
              </a>
            )}
            {content.contact.hours && (
              <p>
                <Clock3 size={14} />
                {content.contact.hours}
              </p>
            )}
          </div>
          {content.contact.mapHref ? (
            <a
              className="footer-map"
              href={content.contact.mapHref}
              aria-label={content.contact.mapLabel}
            >
              <span className="footer-map__pin">
                <MapPin size={17} />
              </span>
              <strong>{content.contact.mapLabel}</strong>
            </a>
          ) : (
            <div className="footer-map">
              <span className="footer-map__pin">
                <MapPin size={17} />
              </span>
              <strong>{content.contact.mapLabel}</strong>
            </div>
          )}
        </div>
        <div className="footer-bottom">
          <span>{content.footer.copyright}</span>
          <div>
            {content.footer.privacyLabel &&
              (content.footer.privacyHref ? (
                <a href={content.footer.privacyHref}>
                  {content.footer.privacyLabel}
                </a>
              ) : (
                <span>{content.footer.privacyLabel}</span>
              ))}
            {content.footer.termsLabel &&
              (content.footer.termsHref ? (
                <a href={content.footer.termsHref}>
                  {content.footer.termsLabel}
                </a>
              ) : (
                <span>{content.footer.termsLabel}</span>
              ))}
          </div>
        </div>
      </footer>
      <BookingModal
        content={content}
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
      />
    </div>
  );
}
