import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  Flower2,
  Heart,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquareText,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { DEFAULT_CONTENT, type HomeContent } from "@/lib/content";
import { loadHomeContent } from "@/lib/supabase";
import { telLink, waLink } from "@/lib/contact";
import BookingModal from "@/components/BookingModal";
import BrandMark from "@/components/BrandMark";

const trustIcons = [UserRound, MessageSquareText, ShieldCheck];

export default function ServiceDetail() {
  const [match, params] = useRoute("/service/:id");
  const [content, setContent] = useState<HomeContent>(DEFAULT_CONTENT);
  const [bookingOpen, setBookingOpen] = useState(false);

  useEffect(() => {
    let active = true;
    loadHomeContent().then(value => {
      if (active) setContent(value);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [params?.id]);

  if (!match || !params?.id) return null;

  const service = content.services.items.find(item => item.id === params.id);

  if (!service) {
    return (
      <div className="service-page">
        <header className="site-header service-page__header">
          <div className="site-header__inner">
            <span className="brand-lockup">
              <span className="brand-symbol">
                <BrandMark />
              </span>
              <span className="brand-words">
                <strong>{content.brand.name}</strong>
                <small>{content.brand.descriptor}</small>
              </span>
            </span>
            <Link className="text-link" href="/">
              Return to the website <ArrowLeft size={14} />
            </Link>
          </div>
        </header>
        <main className="section-wrap service-page__missing">
          <p className="eyebrow">PAGE NOT READY</p>
          <h1>Thank you for your interest.</h1>
          <p className="section-intro">
            This page is being prepared. In the meantime, do get in touch —
            we would be glad to talk through your questions directly.
          </p>
          <Link className="button button--green" href="/">
            Back to the website <ArrowLeft size={15} />
          </Link>
        </main>
      </div>
    );
  }

  const detail = service.detail;
  const hasStory = Boolean(
    detail.intro.trim() || detail.sections.length || detail.benefits.length
  );
  const whatsapp = content.contact.whatsapp || content.contact.phone;
  const bookingMessage = `Hello ${content.brand.name}, I would like to book a consultation for ${service.title}.`;

  return (
    <div className="service-page">
      <header className="site-header service-page__header">
        <div className="site-header__inner">
          <Link className="brand-lockup" href="/" aria-label="Back to the website">
            <span className="brand-symbol">
              <BrandMark />
            </span>
            <span className="brand-words">
              <strong>{content.brand.name}</strong>
              <small>{content.brand.descriptor}</small>
            </span>
          </Link>
          <nav className="main-nav" aria-label="Service page navigation">
            <Link href="/">Home</Link>
            <a href="/#services">Services</a>
            <a href="/#contact">Contact</a>
          </nav>
          <button
            className="button button--green header-cta"
            type="button"
            onClick={() => setBookingOpen(true)}
          >
            Book consultation <ArrowRight size={14} />
          </button>
        </div>
      </header>

      <main>
        <section className="hero service-hero">
          <div className="hero__photo">
            {service.image ? (
              <img src={service.image} alt={service.imageAlt || service.title} />
            ) : (
              <span className="service-hero__placeholder">
                <Flower2 size={64} strokeWidth={0.7} />
              </span>
            )}
          </div>
          <div className="hero__wash" />
          <div className="hero__content">
            <p className="eyebrow">{service.category}</p>
            <h1>
              {service.title} <em>care,</em> considered.
            </h1>
            <p className="hero__description">
              {detail.intro.trim() || service.description}
            </p>
            <div className="hero__actions">
              <button
                className="button button--green"
                type="button"
                onClick={() => setBookingOpen(true)}
              >
                Book consultation <ArrowRight size={15} />
              </button>
              {whatsapp && (
                <a
                  className="text-link"
                  href={waLink(whatsapp, bookingMessage)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle size={15} /> WhatsApp us
                </a>
              )}
            </div>
            <span className="hero__caption">
              Time to listen. Space to understand.
            </span>
          </div>
        </section>

        {content.trustItems.length > 0 && (
          <section className="trust-strip" aria-label="Our approach">
            <div className="trust-strip__inner">
              {content.trustItems.slice(0, 3).map((item, index) => {
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
        )}

        {hasStory ? (
          <article className="section-wrap service-article">
            {detail.intro.trim() && detail.sections.length > 0 && (
              <p className="service-article__intro">{detail.intro}</p>
            )}
            {detail.sections.map((section, index) => (
              <section className="service-article__section" key={section.id}>
                <span className="service-article__index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2>{section.heading}</h2>
                  <p>{section.body}</p>
                </div>
              </section>
            ))}
          </article>
        ) : (
          <main className="section-wrap">
            <p className="section-intro">
              {service.description} The full story for this service is being
              written — do ask us about it directly.
            </p>
          </main>
        )}

        {detail.benefits.length > 0 && (
          <section className="section-wrap service-benefits">
            <p className="eyebrow">WHAT TREATMENT HERE INCLUDES</p>
            <ul className="benefit-list">
              {detail.benefits.map((benefit, index) => (
                <li className="benefit-item" key={index}>
                  <Flower2 size={16} strokeWidth={1.3} />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section
          className="booking-banner booking-banner--photo"
          style={
            content.cta.image
              ? { backgroundImage: `url(${content.cta.image})` }
              : undefined
          }
        >
          <div className="booking-banner__inner">
            <div>
              <p className="eyebrow eyebrow--light">BOOK A CONSULTATION</p>
              <h2>Begin with a conversation.</h2>
              <p>
                Tell us about your {service.title.toLowerCase()} concerns —
                we will suggest the right next step, with no obligation.
              </p>
            </div>
            <div className="booking-banner__actions">
              {whatsapp && (
                <a
                  className="button button--outline-light"
                  href={waLink(whatsapp, bookingMessage)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle size={15} /> WhatsApp us
                </a>
              )}
              <button
                className="button button--cream"
                type="button"
                onClick={() => setBookingOpen(true)}
              >
                Book a consultation <ArrowRight size={15} />
              </button>
            </div>
          </div>
          <span className="booking-banner__ornament">
            <Flower2 size={210} strokeWidth={0.45} />
          </span>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <Link className="brand-lockup" href="/">
              <span className="brand-symbol">
                <BrandMark />
              </span>
              <span className="brand-words">
                <strong>{content.brand.name}</strong>
                <small>{content.brand.descriptor}</small>
              </span>
            </Link>
            <p>{content.brand.footerLine}</p>
          </div>
          <div className="footer-links">
            <a className="footer-label" href="/">{content.footer.quickLinksLabel}</a>
            {content.navigation.map(item => (
              <a href={item.href.startsWith("#") ? `/${item.href}` : item.href}>
                {item.label}
              </a>
            ))}
            <a href="/#services">Services</a>
          </div>
          <div className="footer-contact">
            <p className="footer-label">{content.contact.eyebrow}</p>
            {content.contact.address && (
              <p>
                <MapPin size={14} />
                {content.contact.address}
              </p>
            )}
            {content.contact.phone && (
              <a href={telLink(content.contact.phone)}>
                <Phone size={14} />
                {content.contact.phone}
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
        </div>
        <div className="footer-bottom">
          <span>{content.footer.copyright}</span>
        </div>
      </footer>

      <BookingModal
        content={content}
        initialService={service.title}
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
      />
    </div>
  );
}
