import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Phone,
  X,
} from "lucide-react";
import type { HomeContent } from "@/lib/content";
import { createBooking } from "@/lib/api";
import { displayPhone, telLink, waLink } from "@/lib/contact";

const TIME_SLOTS = [
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
  "07:00 PM",
];

type Status = "form" | "saving" | "success";

export default function BookingModal({
  content,
  initialService = "",
  open,
  onClose,
}: {
  content: HomeContent;
  initialService?: string;
  open: boolean;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<Status>("form");
  const [error, setError] = useState("");
  const [service, setService] = useState(initialService);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  const services = useMemo(
    () => content.services.items.filter(item => item.visible),
    [content.services.items]
  );
  const whatsapp = content.contact.whatsapp || content.contact.phone;
  const bookingMessage = useMemo(
    () =>
      service && date && time
        ? `Hello ${content.brand.name}, I would like to book a consultation for ${service} on ${date} at ${time}.`
        : `Hello ${content.brand.name}, I would like to book a consultation.`,
    [content.brand.name, service, date, time]
  );

  const today = useMemo(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60_000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
  }, []);

  useEffect(() => {
    if (!open) return;
    setStatus("form");
    setError("");
    setService(initialService);
    setDate("");
    setTime("");
    setName("");
    setPhone("");
    setNote("");
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, initialService, onClose]);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "saving") return;
    setError("");
    setStatus("saving");
    try {
      await createBooking({
        name: name.trim(),
        phone: phone.trim(),
        service,
        date,
        time,
        note: note.trim() ? note.trim() : undefined,
      });
      setStatus("success");
    } catch (submitError) {
      setStatus("form");
      setError(
        submitError instanceof Error
          ? `${submitError.message} You can also call or WhatsApp us directly.`
          : "Something went wrong. Please call or WhatsApp us directly."
      );
    }
  }

  return (
    <div
      className="booking-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
      onClick={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="booking-modal__card">
        <button
          className="booking-modal__close"
          type="button"
          aria-label="Close booking form"
          onClick={onClose}
        >
          <X size={19} />
        </button>

        {status === "success" ? (
          <div className="booking-modal__success">
            <CheckCircle2 size={40} strokeWidth={1.2} />
            <h2 id="booking-modal-title">Consultation requested</h2>
            <p>
              Thank you, {name.trim()}. We have your request for{" "}
              <strong>{service}</strong> on <strong>{date}</strong> at{" "}
              <strong>{time}</strong>. Our team will confirm your slot soon.
            </p>
            <p className="booking-modal__fallback">
              Want it faster? Reach the clinic instantly:
            </p>
            <div className="booking-modal__success-actions">
              {whatsapp && (
                <a
                  className="button button--green"
                  href={waLink(whatsapp, bookingMessage)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle size={16} /> Confirm on WhatsApp
                </a>
              )}
              {content.contact.phone && (
                <a
                  className="button button--outline-light"
                  href={telLink(content.contact.phone)}
                >
                  <Phone size={16} /> Call {displayPhone(content.contact.phone)}
                </a>
              )}
            </div>
            <button className="text-link booking-modal__done" type="button" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            <p className="eyebrow">BOOK A CONSULTATION</p>
            <h2 id="booking-modal-title">Choose a time that suits you.</h2>
            <form className="booking-form" onSubmit={handleSubmit}>
              <div className="booking-form__group">
                <span className="booking-form__label">Service</span>
                <div className="booking-form__chips">
                  {services.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      className={`chip ${service === item.title ? "chip--active" : ""}`}
                      onClick={() => setService(item.title)}
                    >
                      {item.title}
                    </button>
                  ))}
                  {!services.length && (
                    <p className="empty-note">Services will appear here soon.</p>
                  )}
                </div>
              </div>

              <div className="booking-form__row">
                <label className="admin-field">
                  <span>Preferred date</span>
                  <input
                    type="date"
                    required
                    min={today}
                    value={date}
                    onChange={event => setDate(event.target.value)}
                  />
                </label>
                <label className="admin-field">
                  <span>Your name</span>
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Full name"
                    value={name}
                    onChange={event => setName(event.target.value)}
                  />
                </label>
              </div>

              <div className="booking-form__group">
                <span className="booking-form__label">Preferred time</span>
                <div className="booking-form__chips">
                  {TIME_SLOTS.map(slot => (
                    <button
                      key={slot}
                      type="button"
                      className={`chip ${time === slot ? "chip--active" : ""}`}
                      onClick={() => setTime(slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div className="booking-form__row">
                <label className="admin-field">
                  <span>Phone number</span>
                  <input
                    type="tel"
                    required
                    autoComplete="tel"
                    placeholder="So we can confirm your slot"
                    value={phone}
                    onChange={event => setPhone(event.target.value)}
                  />
                </label>
                <label className="admin-field">
                  <span>
                    Anything to share? <em>(optional)</em>
                  </span>
                  <input
                    type="text"
                    placeholder="A line about your concern"
                    value={note}
                    onChange={event => setNote(event.target.value)}
                  />
                </label>
              </div>

              {error && <p className="admin-alert admin-alert--error">{error}</p>}

              <div className="booking-form__actions">
                <button
                  className="button button--green"
                  type="submit"
                  disabled={status === "saving"}
                  style={{ opacity: status === "saving" ? 0.7 : 1 }}
                >
                  {status === "saving" ? (
                    <>
                      <Loader2 size={15} className="chip-spinner" /> Sending…
                    </>
                  ) : (
                    <>
                      <CalendarCheck size={15} /> Request consultation
                    </>
                  )}
                </button>
              </div>

              {whatsapp && (
                <p className="booking-form__fallback">
                  Prefer to talk first?{" "}
                  <a
                    href={waLink(whatsapp, bookingMessage)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Message us on WhatsApp
                  </a>
                  {content.contact.phone && (
                    <>
                      {" · "}
                      <a href={telLink(content.contact.phone)}>
                        call {displayPhone(content.contact.phone)}
                      </a>
                    </>
                  )}
                </p>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
