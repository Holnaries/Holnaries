import { Fragment, useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  FileText,
  Flower2,
  ImagePlus,
  KeyRound,
  LayoutDashboard,
  Lock,
  LogOut,
  MessageSquareQuote,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import BrandMark from "@/components/BrandMark";
import type { Session } from "@supabase/supabase-js";
import {
  DEFAULT_CONTENT,
  normalizeHomeContent,
  type HomeContent,
  type ServiceItem,
  type Testimonial,
} from "@/lib/content";
import {
  deleteBooking,
  listBookings,
  loadLocalContent,
  localLogin,
  localLogout,
  localMe,
  saveLocalContent,
  setBookingStatus,
  uploadLocalImage,
  type BookingRecord,
} from "@/lib/api";
import {
  changeOwnPassword,
  isSiteAdmin,
  saveHomeContent,
  supabase,
  uploadSiteImage,
} from "@/lib/supabase";

type Panel =
  | "overview"
  | "bookings"
  | "brand"
  | "hero"
  | "process"
  | "services"
  | "about"
  | "testimonials"
  | "contact"
  | "security";
const panels: { id: Panel; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "bookings", label: "Consultation requests", icon: CalendarDays },
  { id: "brand", label: "Brand & navigation", icon: Flower2 },
  { id: "hero", label: "Hero section", icon: Sparkles },
  { id: "process", label: "Consultation process", icon: FileText },
  { id: "services", label: "Services", icon: Stethoscope },
  { id: "about", label: "About the clinic", icon: Users },
  { id: "testimonials", label: "Patient stories", icon: MessageSquareQuote },
  { id: "contact", label: "Contact & footer", icon: ShieldCheck },
  { id: "security", label: "Security", icon: Lock },
];

function Field({
  label,
  value,
  onChange,
  multiline = false,
  hint,
  type = "text",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  hint?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={event => onChange(event.target.value)}
          rows={3}
          disabled={disabled}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={event => onChange(event.target.value)}
          disabled={disabled}
        />
      )}
      {hint && <small>{hint}</small>}
    </label>
  );
}

function ImageField({
  label,
  hint,
  value,
  onChange,
  upload,
  onError,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  upload: (file: File) => Promise<string>;
  onError: (value: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  async function handleUpload(file?: File) {
    if (!file) return;
    setBusy(true);
    onError("");
    try {
      const url = await upload(file);
      onChange(url);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="admin-image-field">
      <div className="admin-image-field__preview">
        {value ? (
          <img src={value} alt="Current page image" />
        ) : (
          <ImagePlus size={23} />
        )}
      </div>
      <div className="admin-image-field__controls">
        <Field
          label={label}
          value={value}
          onChange={onChange}
          hint={
            hint ??
            "Paste an image URL or upload a photo. JPG, PNG, and WebP, up to 8 MB."
          }
        />
        <label className="upload-button">
          <Upload size={15} />
          {busy ? "Uploading…" : "Upload image"}
          <input
            type="file"
            accept="image/*"
            disabled={busy}
            onChange={event => {
              void handleUpload(event.target.files?.[0]);
              event.currentTarget.value = "";
            }}
          />
        </label>
      </div>
    </div>
  );
}

function PanelCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="admin-card">
      <div className="admin-card__heading">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function AdminBrand() {
  return (
    <a className="admin-brand" href="/">
      <span className="brand-symbol">
        <BrandMark />
      </span>
      <span>
        <strong>HONLARIS</strong>
        <small>WELLNESS · SITE ADMIN</small>
      </span>
    </a>
  );
}

function formatDateOnly(value: string): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function BookingsPanel() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      setBookings(await listBookings());
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Could not load bookings."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function toggleStatus(booking: BookingRecord) {
    const nextStatus = booking.status === "new" ? "done" : "new";
    setBookings(current =>
      current.map(item =>
        item.id === booking.id ? { ...item, status: nextStatus } : item
      )
    );
    try {
      await setBookingStatus(booking.id, nextStatus);
    } catch {
      void refresh();
    }
  }

  async function remove(booking: BookingRecord) {
    setBookings(current => current.filter(item => item.id !== booking.id));
    try {
      await deleteBooking(booking.id);
    } catch {
      void refresh();
    }
  }

  if (loading) {
    return <p className="admin-alert">Loading consultation requests…</p>;
  }
  if (error) {
    return <p className="admin-alert admin-alert--error">{error}</p>;
  }
  if (!bookings.length) {
    return (
      <PanelCard
        title="No consultation requests yet"
        description="When a visitor books through the website, the request appears here with their chosen service, date, and time."
      >
        <p className="admin-note">
          <ShieldCheck size={16} /> Requests are stored on your server and kept
          private to signed-in admins.
        </p>
      </PanelCard>
    );
  }
  return (
    <div className="bookings-list">
      {bookings.map(booking => (
        <article
          className={`booking-row ${booking.status === "done" ? "booking-row--done" : ""}`}
          key={booking.id}
        >
          <div className="booking-row__when">
            <strong>{formatDateOnly(booking.date)}</strong>
            <span>{booking.time}</span>
          </div>
          <div className="booking-row__who">
            <strong>{booking.name}</strong>
            <span>{booking.phone}</span>
            {booking.note && <small>{booking.note}</small>}
          </div>
          <div className="booking-row__service">
            <span className="eyebrow">SERVICE</span>
            <strong>{booking.service}</strong>
          </div>
          <div className="booking-row__actions">
            <button
              className={booking.status === "new" ? "admin-add" : "admin-remove"}
              type="button"
              onClick={() => void toggleStatus(booking)}
            >
              {booking.status === "new" ? (
                <>
                  <CheckCircle2 size={15} /> Mark handled
                </>
              ) : (
                "Reopen"
              )}
            </button>
            <button
              className="admin-remove"
              type="button"
              onClick={() => void remove(booking)}
            >
              <Trash2 size={15} /> Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [panel, setPanel] = useState<Panel>("overview");
  const [draft, setDraft] = useState<HomeContent>(DEFAULT_CONTENT);
  const [loadingContent, setLoadingContent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Security (Supabase mode only)
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwNotice, setPwNotice] = useState("");
  const [pwError, setPwError] = useState("");

  const useSupabase = Boolean(supabase);

  useEffect(() => {
    if (!supabase) {
      // Local backend mode: a signed cookie issued by the Express server.
      let live = true;
      void localMe()
        .then(authorized => {
          if (!live) return;
          setAuthorized(authorized);
          setChecking(false);
        })
        .catch(() => {
          if (live) setChecking(false);
        });
      return () => {
        live = false;
      };
    }
    let live = true;
    const checkSession = async (active: Session | null) => {
      if (!live) return;
      setSession(active);
      if (!active) {
        setAuthorized(false);
        setChecking(false);
        return;
      }
      setChecking(true);
      const isAdmin = await isSiteAdmin(active.user.id);
      if (live) {
        setAuthorized(isAdmin);
        setChecking(false);
      }
    };
    void supabase.auth
      .getSession()
      .then(({ data }) => checkSession(data.session));
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        void checkSession(newSession);
      }
    );
    return () => {
      live = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !session || !authorized) return;
    let live = true;
    setLoadingContent(true);
    void supabase
      .from("site_content")
      .select("content")
      .eq("id", "home")
      .maybeSingle()
      .then(({ data, error: readError }) => {
        if (!live) return;
        if (readError) setError(readError.message);
        setDraft(
          data?.content
            ? normalizeHomeContent(data.content)
            : DEFAULT_CONTENT
        );
        setLoadingContent(false);
      });
    return () => {
      live = false;
    };
  }, [session?.user.id, authorized]);

  useEffect(() => {
    if (supabase || !authorized) return;
    let live = true;
    setLoadingContent(true);
    void loadLocalContent()
      .then(value => {
        if (!live) return;
        setDraft(value ?? DEFAULT_CONTENT);
        setLoadingContent(false);
      })
      .catch(loadError => {
        if (!live) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load saved content."
        );
        setLoadingContent(false);
      });
    return () => {
      live = false;
    };
  }, [authorized]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setChecking(true);
    if (!supabase) {
      try {
        await localLogin(password);
        setAuthorized(true);
      } catch (loginError) {
        setError(
          loginError instanceof Error
            ? loginError.message
            : "Could not sign in."
        );
      } finally {
        setChecking(false);
      }
      return;
    }
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (loginError) {
      setError(loginError.message);
      setChecking(false);
    }
  }

  async function handleLogout() {
    if (!supabase) {
      await localLogout();
      setAuthorized(false);
      setPassword("");
      setNotice("You have been signed out.");
      return;
    }
    await supabase.auth.signOut();
    setNotice("You have been signed out.");
  }

  async function handleChangePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPwError("");
    setPwNotice("");
    if (!supabase || !session) return;
    if (pwNew.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwError("New passwords do not match.");
      return;
    }
    setPwBusy(true);
    try {
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: session.user.email ?? "",
        password: pwCurrent,
      });
      if (reauthError) {
        setPwError("Current password is incorrect.");
        return;
      }
      await changeOwnPassword(pwNew);
      setPwNotice("Your password has been updated.");
      setPwCurrent("");
      setPwNew("");
      setPwConfirm("");
    } catch (changeError) {
      setPwError(
        changeError instanceof Error
          ? changeError.message
          : "Could not change password."
      );
    } finally {
      setPwBusy(false);
    }
  }


  async function handleSave() {
    if (supabase ? !session : !authorized) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (supabase && session) {
        await saveHomeContent(draft, session.user.id);
      } else {
        await saveLocalContent(draft);
      }
      setNotice("Your changes are saved and visible on the website.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save changes."
      );
    } finally {
      setSaving(false);
    }
  }

  const patchHero = (key: keyof HomeContent["hero"], value: string) =>
    setDraft(current => ({
      ...current,
      hero: { ...current.hero, [key]: value },
    }));
  const patchService = (
    id: string,
    key: keyof ServiceItem,
    value: string | boolean
  ) =>
    setDraft(current => ({
      ...current,
      services: {
        ...current.services,
        items: current.services.items.map(item =>
          item.id === id ? { ...item, [key]: value } : item
        ),
      },
    }));
  const patchServiceDetail = (id: string, value: Partial<ServiceItem["detail"]>) =>
    setDraft(current => ({
      ...current,
      services: {
        ...current.services,
        items: current.services.items.map(item =>
          item.id === id
            ? { ...item, detail: { ...item.detail, ...value } }
            : item
        ),
      },
    }));
  const patchTestimonial = (
    id: string,
    key: keyof Testimonial,
    value: string | boolean
  ) =>
    setDraft(current => ({
      ...current,
      testimonials: {
        ...current.testimonials,
        items: current.testimonials.items.map(item =>
          item.id === id ? { ...item, [key]: value } : item
        ),
      },
    }));
  const id = (prefix: string) =>
    `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;

  const uploadImage: (file: File) => Promise<string> =
    supabase && session
      ? file => uploadSiteImage(file, session.user.id)
      : uploadLocalImage;

  if (checking)
    return (
      <div className="admin-gate">
        <div className="admin-gate__card">
          <div className="admin-spinner" />
          <p>Checking secure access…</p>
        </div>
      </div>
    );

  if (!session && useSupabase)
    return (
      <div className="admin-gate">
        <div className="admin-gate__card">
          <AdminBrand />
          <span className="admin-gate__icon">
            <ShieldCheck size={25} />
          </span>
          <p className="eyebrow">PRIVATE SITE ACCESS</p>
          <h1>Good care starts with clarity.</h1>
          <p>
            Sign in with your authorised Honlaris administrator account to
            update your website.
          </p>
          <form className="login-form" onSubmit={handleLogin}>
            <label className="admin-field">
              <span>Email address</span>
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={event => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="admin-field">
              <span>Password</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                required
              />
            </label>
            {error && <p className="admin-alert admin-alert--error">{error}</p>}
            <button className="button button--green login-submit" type="submit">
              Sign in <ArrowLeft size={15} />
            </button>
          </form>
          <a className="admin-gate__back" href="/">
            Return to the website
          </a>
        </div>
      </div>
    );

  if (!authorized && !useSupabase)
    return (
      <div className="admin-gate">
        <div className="admin-gate__card">
          <AdminBrand />
          <span className="admin-gate__icon">
            <ShieldCheck size={25} />
          </span>
          <p className="eyebrow">PRIVATE SITE ACCESS</p>
          <h1>Good care starts with clarity.</h1>
          <p>Enter the administrator password to update your website.</p>
          <form className="login-form" onSubmit={handleLogin}>
            <label className="admin-field">
              <span>Admin password</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                required
              />
            </label>
            {error && <p className="admin-alert admin-alert--error">{error}</p>}
            <button className="button button--green login-submit" type="submit">
              Sign in <ArrowLeft size={15} />
            </button>
          </form>
          <a className="admin-gate__back" href="/">
            Return to the website
          </a>
        </div>
      </div>
    );

  if (!authorized)
    return (
      <div className="admin-gate">
        <div className="admin-gate__card">
          <AdminBrand />
          <span className="admin-gate__icon">
            <ShieldCheck size={25} />
          </span>
          <p className="eyebrow">ACCESS NOT AUTHORISED</p>
          <h1>This account is not a site admin.</h1>
          <p>
            Ask your Supabase project owner to add this account's user ID to the{" "}
            <code>admin_users</code> table. The public site remains unchanged.
          </p>
          <button
            className="button button--green"
            type="button"
            onClick={() => void handleLogout()}
          >
            Sign out <ArrowLeft size={15} />
          </button>
          <a className="admin-gate__back" href="/">
            Return to the website
          </a>
        </div>
      </div>
    );

  const currentPanel = panels.find(item => item.id === panel);
  const PanelIcon = currentPanel?.icon ?? LayoutDashboard;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <AdminBrand />
        <nav className="admin-sidebar__nav" aria-label="Admin sections">
          {panels.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={panel === item.id ? "is-active" : ""}
                type="button"
                onClick={() => {
                  setPanel(item.id);
                  setNotice("");
                }}
              >
                <Icon size={17} strokeWidth={1.6} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="admin-sidebar__foot">
          <a href="/">
            <ArrowLeft size={15} /> View website
          </a>
          <button type="button" onClick={() => void handleLogout()}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar__crumb">
            <span>Website</span>
            <b>/</b>
            <strong>{currentPanel?.label ?? "Overview"}</strong>
          </div>
          <div className="admin-user">
            <span className="admin-user__avatar">
              {session?.user.email?.slice(0, 1).toUpperCase() ?? "H"}
            </span>
            <span>{session?.user.email ?? "Clinic administrator"}</span>
          </div>
        </header>
        <div className="admin-content">
          <div className="admin-page-heading">
            <div>
              <p className="eyebrow">HONLARIS WELLNESS · CONTENT STUDIO</p>
              <h1>
                <PanelIcon size={24} strokeWidth={1.5} />
                {currentPanel?.label ?? "Overview"}
              </h1>
              <p>
                Make a change, preview the section on your website, then save
                when you are ready.
              </p>
            </div>
            <button
              className="button button--green admin-save"
              type="button"
              disabled={saving || loadingContent}
              onClick={() => void handleSave()}
            >
              {saving ? (
                <>
                  <span className="button-spinner" /> Saving…
                </>
              ) : notice.includes("saved") ? (
                <>
                  <Check size={16} /> Saved
                </>
              ) : (
                <>
                  <Save size={16} /> Save changes
                </>
              )}
            </button>
          </div>
          {error && <p className="admin-alert admin-alert--error">{error}</p>}
          {notice && (
            <p className="admin-alert admin-alert--success">
              <Check size={15} />
              {notice}
            </p>
          )}
          {loadingContent && (
            <p className="admin-alert">
              Loading the latest saved website content…
            </p>
          )}
          {panel === "overview" && (
            <>
              <div className="admin-welcome">
                <div>
                  <span className="admin-welcome__mark">
                    <Flower2 size={24} />
                  </span>
                  <p className="eyebrow eyebrow--light">
                    A MORE THOUGHTFUL WAY TO WELLNESS
                  </p>
                  <h2>Your website, thoughtfully in your hands.</h2>
                  <p>
                    Update the words, services, images, and patient stories that
                    shape every visit to your site.
                  </p>
                </div>
                <a
                  href="/"
                  target="_blank"
                  rel="noreferrer"
                  className="button button--cream"
                >
                  Preview website <ArrowLeft size={15} />
                </a>
              </div>
              <div className="admin-stats">
                <div>
                  <span>CONTENT SECTIONS</span>
                  <strong>08</strong>
                  <small>Ready to personalise</small>
                </div>
                <div>
                  <span>SERVICES</span>
                  <strong>
                    {draft.services.items.length.toString().padStart(2, "0")}
                  </strong>
                  <small>
                    {draft.services.items.filter(item => item.visible).length}{" "}
                    currently visible
                  </small>
                </div>
                <div>
                  <span>PATIENT STORIES</span>
                  <strong>
                    {draft.testimonials.items.length
                      .toString()
                      .padStart(2, "0")}
                  </strong>
                  <small>
                    {
                      draft.testimonials.items.filter(item => item.visible)
                        .length
                    }{" "}
                    currently visible
                  </small>
                </div>
              </div>
              <PanelCard
                title="Start with what patients see first"
                description="A few small changes can make the site feel like your clinic."
              >
                <div className="admin-shortcuts">
                  {panels.slice(1).map(item => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setPanel(item.id)}
                      >
                        <Icon size={17} />
                        <span>{item.label}</span>
                        <ArrowLeft size={14} />
                      </button>
                    );
                  })}
                </div>
              </PanelCard>
              <p className="admin-note">
                <ShieldCheck size={16} />{" "}
                {supabase
                  ? "Changes are stored securely in your Supabase project. Public visitors can read published content; only listed site admins can edit it."
                  : "Changes are stored on your own server right now. When your Supabase project is connected, this content moves across automatically."}
              </p>
            </>
          )}

          {panel === "bookings" && (
            <BookingsPanel />
          )}

          {panel === "brand" && (
            <>
              <PanelCard
                title="Your clinic identity"
                description="Set the name and short introduction used throughout the website."
              >
                <div className="admin-form-grid">
                  <Field
                    label="Clinic name"
                    value={draft.brand.name}
                    onChange={value =>
                      setDraft(c => ({
                        ...c,
                        brand: { ...c.brand, name: value },
                      }))
                    }
                  />
                  <Field
                    label="Descriptor"
                    value={draft.brand.descriptor}
                    onChange={value =>
                      setDraft(c => ({
                        ...c,
                        brand: { ...c.brand, descriptor: value },
                      }))
                    }
                  />
                  <Field
                    label="Footer introduction"
                    value={draft.brand.footerLine}
                    onChange={value =>
                      setDraft(c => ({
                        ...c,
                        brand: { ...c.brand, footerLine: value },
                      }))
                    }
                    multiline
                  />
                </div>
              </PanelCard>
              <PanelCard
                title="Navigation links"
                description="Change labels or destinations; use section IDs such as #services or #contact."
              >
                <div className="admin-repeat-list">
                  {draft.navigation.map((item, index) => (
                    <div className="admin-repeat-row" key={index}>
                      <Field
                        label={`Link ${index + 1}`}
                        value={item.label}
                        onChange={value =>
                          setDraft(c => ({
                            ...c,
                            navigation: c.navigation.map((entry, i) =>
                              i === index ? { ...entry, label: value } : entry
                            ),
                          }))
                        }
                      />
                      <Field
                        label="Destination"
                        value={item.href}
                        onChange={value =>
                          setDraft(c => ({
                            ...c,
                            navigation: c.navigation.map((entry, i) =>
                              i === index ? { ...entry, href: value } : entry
                            ),
                          }))
                        }
                      />
                      <button
                        className="admin-remove"
                        type="button"
                        onClick={() =>
                          setDraft(c => ({
                            ...c,
                            navigation: c.navigation.filter(
                              (_, i) => i !== index
                            ),
                          }))
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  className="admin-add"
                  type="button"
                  onClick={() =>
                    setDraft(c => ({
                      ...c,
                      navigation: [
                        ...c.navigation,
                        { label: "New link", href: "#contact" },
                      ],
                    }))
                  }
                >
                  + Add navigation link
                </button>
              </PanelCard>
            </>
          )}

          {panel === "hero" && (
            <>
              <PanelCard
                title="The first impression"
                description="The hero headline, supporting line, main image, and first consultation buttons."
              >
                <div className="admin-form-grid">
                  <Field
                    label="Eyebrow"
                    value={draft.hero.eyebrow}
                    onChange={v => patchHero("eyebrow", v)}
                  />
                  <Field
                    label="Headline"
                    value={draft.hero.headline}
                    onChange={v => patchHero("headline", v)}
                  />
                  <Field
                    label="Emphasised headline phrase"
                    value={draft.hero.focus}
                    onChange={v => patchHero("focus", v)}
                  />
                  <Field
                    label="Supporting text"
                    value={draft.hero.description}
                    onChange={v => patchHero("description", v)}
                    multiline
                  />
                  <Field
                    label="Primary button"
                    value={draft.hero.primaryCta}
                    onChange={v => patchHero("primaryCta", v)}
                  />
                  <Field
                    label="Secondary button"
                    value={draft.hero.secondaryCta}
                    onChange={v => patchHero("secondaryCta", v)}
                  />
                  <Field
                    label="Primary destination (URL or #section)"
                    value={draft.hero.primaryHref}
                    onChange={v => patchHero("primaryHref", v)}
                  />
                  <Field
                    label="Secondary destination (URL or #section)"
                    value={draft.hero.secondaryHref}
                    onChange={v => patchHero("secondaryHref", v)}
                  />
                  <Field
                    label="Hero caption"
                    value={draft.hero.caption}
                    onChange={v => patchHero("caption", v)}
                  />
                  <Field
                    label="Hero side note"
                    value={draft.hero.sideNote}
                    onChange={v => patchHero("sideNote", v)}
                  />
                  <Field
                    label="Image description (accessibility)"
                    value={draft.hero.imageAlt}
                    onChange={v => patchHero("imageAlt", v)}
                  />
                </div>
                <ImageField
                  label="Hero image"
                  value={draft.hero.image}
                  onChange={v => patchHero("image", v)}
                  upload={uploadImage}
                  onError={setError}
                />
              </PanelCard>
              <PanelCard
                title="Reassurance strip"
                description="Short principles shown just below your opening section."
              >
                <div className="admin-repeat-list">
                  {draft.trustItems.map((item, index) => (
                    <div
                      className="admin-repeat-row admin-repeat-row--single"
                      key={index}
                    >
                      <Field
                        label={`Principle ${index + 1}`}
                        value={item}
                        onChange={value =>
                          setDraft(c => ({
                            ...c,
                            trustItems: c.trustItems.map((entry, i) =>
                              i === index ? value : entry
                            ),
                          }))
                        }
                      />
                      <button
                        className="admin-remove"
                        type="button"
                        onClick={() =>
                          setDraft(c => ({
                            ...c,
                            trustItems: c.trustItems.filter(
                              (_, i) => i !== index
                            ),
                          }))
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  className="admin-add"
                  type="button"
                  onClick={() =>
                    setDraft(c => ({
                      ...c,
                      trustItems: [...c.trustItems, "A thoughtful touch"],
                    }))
                  }
                >
                  + Add principle
                </button>
              </PanelCard>
            </>
          )}

          {panel === "process" && (
            <>
              <PanelCard
                title="Your consultation, explained"
                description="Let visitors know what a first visit feels like, step by step."
              >
                <div className="admin-form-grid">
                  <Field
                    label="Section label"
                    value={draft.process.eyebrow}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        process: { ...c.process, eyebrow: v },
                      }))
                    }
                  />
                  <Field
                    label="Headline"
                    value={draft.process.title}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        process: { ...c.process, title: v },
                      }))
                    }
                  />
                  <Field
                    label="Emphasised phrase"
                    value={draft.process.focus}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        process: { ...c.process, focus: v },
                      }))
                    }
                  />
                  <Field
                    label="Introduction"
                    value={draft.process.intro}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        process: { ...c.process, intro: v },
                      }))
                    }
                    multiline
                  />
                  <Field
                    label="Photo caption"
                    value={draft.process.photoCaption}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        process: { ...c.process, photoCaption: v },
                      }))
                    }
                  />
                  <Field
                    label="Image description (accessibility)"
                    value={draft.process.imageAlt}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        process: { ...c.process, imageAlt: v },
                      }))
                    }
                  />
                </div>
                <ImageField
                  label="Consultation image"
                  value={draft.process.image}
                  onChange={v =>
                    setDraft(c => ({
                      ...c,
                      process: { ...c.process, image: v },
                    }))
                  }
                  upload={uploadImage}
                  onError={setError}
                />
              </PanelCard>
              <PanelCard title="Consultation steps">
                <div className="admin-repeat-list">
                  {draft.process.steps.map((step, index) => (
                    <div
                      className="admin-item-editor"
                      key={`${index}-${step.title}`}
                    >
                      <div className="admin-item-editor__top">
                        <strong>
                          Step {String(index + 1).padStart(2, "0")}
                        </strong>
                        <button
                          className="admin-remove"
                          type="button"
                          onClick={() =>
                            setDraft(c => ({
                              ...c,
                              process: {
                                ...c.process,
                                steps: c.process.steps.filter(
                                  (_, i) => i !== index
                                ),
                              },
                            }))
                          }
                        >
                          Remove
                        </button>
                      </div>
                      <Field
                        label="Step title"
                        value={step.title}
                        onChange={value =>
                          setDraft(c => ({
                            ...c,
                            process: {
                              ...c.process,
                              steps: c.process.steps.map((entry, i) =>
                                i === index ? { ...entry, title: value } : entry
                              ),
                            },
                          }))
                        }
                      />
                      <Field
                        label="Short explanation"
                        value={step.description}
                        onChange={value =>
                          setDraft(c => ({
                            ...c,
                            process: {
                              ...c.process,
                              steps: c.process.steps.map((entry, i) =>
                                i === index
                                  ? { ...entry, description: value }
                                  : entry
                              ),
                            },
                          }))
                        }
                        multiline
                      />
                    </div>
                  ))}
                </div>
                <button
                  className="admin-add"
                  type="button"
                  onClick={() =>
                    setDraft(c => ({
                      ...c,
                      process: {
                        ...c.process,
                        steps: [
                          ...c.process.steps,
                          {
                            title: "New step",
                            description: "Add a short explanation.",
                          },
                        ],
                      },
                    }))
                  }
                >
                  + Add consultation step
                </button>
              </PanelCard>
            </>
          )}

          {panel === "services" && (
            <>
              <PanelCard
                title="Services overview"
                description="Set the section heading, then add or edit the services visitors can explore."
              >
                <div className="admin-form-grid">
                  <Field
                    label="Section label"
                    value={draft.services.eyebrow}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        services: { ...c.services, eyebrow: v },
                      }))
                    }
                  />
                  <Field
                    label="Headline"
                    value={draft.services.title}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        services: { ...c.services, title: v },
                      }))
                    }
                  />
                  <Field
                    label="Emphasised phrase"
                    value={draft.services.focus}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        services: { ...c.services, focus: v },
                      }))
                    }
                  />
                  <Field
                    label="Introduction"
                    value={draft.services.description}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        services: { ...c.services, description: v },
                      }))
                    }
                    multiline
                  />
                </div>
              </PanelCard>
              <div className="admin-section-toolbar">
                <div>
                  <h2>Your services</h2>
                  <p>
                    Hide a service without deleting it, or remove it
                    permanently.
                  </p>
                </div>
                <button
                  className="admin-add"
                  type="button"
                  onClick={() =>
                    setDraft(c => {
                      const newId = id("service");
                      return {
                        ...c,
                        services: {
                          ...c.services,
                          items: [
                            ...c.services.items,
                            {
                              id: newId,
                              title: "New service",
                              category: "SERVICE CATEGORY",
                              description:
                                "Describe this service in a sentence.",
                              image: "",
                              imageAlt: "",
                              linkLabel: "Explore",
                              linkHref: `/service/${newId}`,
                              visible: true,
                              detail: {
                                intro: "",
                                benefits: [],
                                sections: [],
                              },
                            },
                          ],
                        },
                      };
                    })
                  }
                >
                  + Add service
                </button>
              </div>
              {draft.services.items.map((service, index) => (
                <Fragment key={service.id}>
                <PanelCard
                  title={service.title || `Service ${index + 1}`}
                  description={`Card ${String(index + 1).padStart(2, "0")}`}
                >
                  <div className="admin-item-editor__top">
                    <label className="admin-toggle">
                      <input
                        type="checkbox"
                        checked={service.visible}
                        onChange={event =>
                          patchService(
                            service.id,
                            "visible",
                            event.target.checked
                          )
                        }
                      />
                      <span>Visible on website</span>
                    </label>
                    <button
                      className="admin-remove"
                      type="button"
                      onClick={() =>
                        setDraft(c => ({
                          ...c,
                          services: {
                            ...c.services,
                            items: c.services.items.filter(
                              item => item.id !== service.id
                            ),
                          },
                        }))
                      }
                    >
                      Remove service
                    </button>
                  </div>
                  <div className="admin-form-grid">
                    <Field
                      label="Service name"
                      value={service.title}
                      onChange={v => patchService(service.id, "title", v)}
                    />
                    <Field
                      label="Category label"
                      value={service.category}
                      onChange={v => patchService(service.id, "category", v)}
                    />
                    <Field
                      label="Description"
                      value={service.description}
                      onChange={v => patchService(service.id, "description", v)}
                      multiline
                    />
                    <Field
                      label="Card button label"
                      value={service.linkLabel}
                      onChange={v => patchService(service.id, "linkLabel", v)}
                    />
                    <Field
                      label="Button destination (URL or #section)"
                      value={service.linkHref}
                      onChange={v => patchService(service.id, "linkHref", v)}
                    />
                    <Field
                      label="Image description (accessibility)"
                      value={service.imageAlt}
                      onChange={v => patchService(service.id, "imageAlt", v)}
                    />
                  </div>
                  <ImageField
                    label="Service image"
                    value={service.image}
                    onChange={v => patchService(service.id, "image", v)}
                    upload={uploadImage}
                    onError={setError}
                  />
                </PanelCard>
                <PanelCard
                  title={`${service.title} — service page`}
                  description="The blog-style page visitors see when they open this service. Edit, add, or remove everything here."
                >
                  <div className="admin-item-editor__top">
                    <a
                      className="admin-toggle-link"
                      href={service.linkHref.startsWith("/")
                        ? service.linkHref
                        : "#"}
                    >
                      View this page <ArrowLeft size={13} />
                    </a>
                  </div>
                  <Field
                    label="Opening paragraph"
                    hint="Shown at the top of the page. Leave empty to reuse the card description."
                    value={service.detail?.intro ?? ""}
                    onChange={v => patchServiceDetail(service.id, { intro: v })}
                    multiline
                  />
                  <PanelCard title="Highlights">
                    <div className="admin-repeat-list">
                      {(service.detail?.benefits ?? []).map((benefit, i) => (
                        <div
                          className="admin-repeat-row admin-repeat-row--single"
                          key={i}
                        >
                          <Field
                            label={`Highlight ${i + 1}`}
                            value={benefit}
                            onChange={v =>
                              patchServiceDetail(service.id, {
                                benefits: (service.detail?.benefits ?? []).map(
                                  (entry, j) => (j === i ? v : entry)
                                ),
                              })
                            }
                          />
                          <button
                            className="admin-remove"
                            type="button"
                            onClick={() =>
                              patchServiceDetail(service.id, {
                                benefits: (service.detail?.benefits ?? []).filter(
                                  (_, j) => j !== i
                                ),
                              })
                            }
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      className="admin-add"
                      type="button"
                      onClick={() =>
                        patchServiceDetail(service.id, {
                          benefits: [
                            ...(service.detail?.benefits ?? []),
                            "A new highlight",
                          ],
                        })
                      }
                    >
                      + Add highlight
                    </button>
                  </PanelCard>
                  <PanelCard title="Article sections">
                    <div className="admin-repeat-list">
                      {(service.detail?.sections ?? []).map((section, i) => (
                        <div className="admin-item-editor" key={section.id}>
                          <div className="admin-item-editor__top">
                            <strong>Section {i + 1}</strong>
                            <button
                              className="admin-remove"
                              type="button"
                              onClick={() =>
                                patchServiceDetail(service.id, {
                                  sections: (service.detail?.sections ?? []).filter(
                                    entry => entry.id !== section.id
                                  ),
                                })
                              }
                            >
                              Remove
                            </button>
                          </div>
                          <Field
                            label="Section heading"
                            value={section.heading}
                            onChange={v =>
                              patchServiceDetail(service.id, {
                                sections: (service.detail?.sections ?? []).map(
                                  entry =>
                                    entry.id === section.id
                                      ? { ...entry, heading: v }
                                      : entry
                                ),
                              })
                            }
                          />
                          <Field
                            label="Section text"
                            value={section.body}
                            onChange={v =>
                              patchServiceDetail(service.id, {
                                sections: (service.detail?.sections ?? []).map(
                                  entry =>
                                    entry.id === section.id
                                      ? { ...entry, body: v }
                                      : entry
                                ),
                              })
                            }
                            multiline
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      className="admin-add"
                      type="button"
                      onClick={() =>
                        patchServiceDetail(service.id, {
                          sections: [
                            ...(service.detail?.sections ?? []),
                            {
                              id: id("section"),
                              heading: "A new section",
                              body: "Write the section text here.",
                            },
                          ],
                        })
                      }
                    >
                      + Add article section
                    </button>
                  </PanelCard>
                </PanelCard>
                </Fragment>
              ))}
            </>
          )}

          {panel === "about" && (
            <>
              <PanelCard
                title="The clinic and its approach"
                description="Share what makes your care feel personal and considered."
              >
                <div className="admin-form-grid">
                  <Field
                    label="Section label"
                    value={draft.about.eyebrow}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        about: { ...c.about, eyebrow: v },
                      }))
                    }
                  />
                  <Field
                    label="Headline"
                    value={draft.about.title}
                    onChange={v =>
                      setDraft(c => ({ ...c, about: { ...c.about, title: v } }))
                    }
                  />
                  <Field
                    label="Emphasised phrase"
                    value={draft.about.focus}
                    onChange={v =>
                      setDraft(c => ({ ...c, about: { ...c.about, focus: v } }))
                    }
                  />
                  <Field
                    label="Italic sub-line"
                    hint="A short guiding line shown under the headline."
                    value={draft.about.subline ?? ""}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        about: { ...c.about, subline: v },
                      }))
                    }
                  />
                  <Field
                    label="Paragraph one"
                    value={draft.about.paragraphs[0] ?? ""}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        about: {
                          ...c.about,
                          paragraphs: [v, c.about.paragraphs[1] ?? ""],
                        },
                      }))
                    }
                    multiline
                  />
                  <Field
                    label="Paragraph two"
                    value={draft.about.paragraphs[1] ?? ""}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        about: {
                          ...c.about,
                          paragraphs: [c.about.paragraphs[0] ?? "", v],
                        },
                      }))
                    }
                    multiline
                  />
                  <Field
                    label="Text link label"
                    value={draft.about.linkLabel}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        about: { ...c.about, linkLabel: v },
                      }))
                    }
                  />
                  <Field
                    label="Text link destination (URL or #section)"
                    value={draft.about.linkHref}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        about: { ...c.about, linkHref: v },
                      }))
                    }
                  />
                  <Field
                    label="Photo caption"
                    value={draft.about.photoCaption}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        about: { ...c.about, photoCaption: v },
                      }))
                    }
                  />
                  <Field
                    label="Image description (accessibility)"
                    value={draft.about.imageAlt}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        about: { ...c.about, imageAlt: v },
                      }))
                    }
                  />
                </div>
                <ImageField
                  label="Clinic image"
                  value={draft.about.image}
                  onChange={v =>
                    setDraft(c => ({ ...c, about: { ...c.about, image: v } }))
                  }
                  upload={uploadImage}
                  onError={setError}
                />
              </PanelCard>
            </>
          )}

          {panel === "testimonials" && (
            <>
              <PanelCard
                title="Patient experiences"
                description="Illustrative stories start hidden. Replace samples with verified quotes and publish only with the patient's permission."
              >
                <div className="admin-form-grid">
                  <Field
                    label="Section label"
                    value={draft.testimonials.eyebrow}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        testimonials: { ...c.testimonials, eyebrow: v },
                      }))
                    }
                  />
                  <Field
                    label="Section headline"
                    value={draft.testimonials.title}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        testimonials: { ...c.testimonials, title: v },
                      }))
                    }
                  />
                  <Field
                    label="Supporting line"
                    value={draft.testimonials.supportingText}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        testimonials: { ...c.testimonials, supportingText: v },
                      }))
                    }
                  />
                  <Field
                    label="Message when stories are hidden"
                    value={draft.testimonials.emptyMessage}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        testimonials: { ...c.testimonials, emptyMessage: v },
                      }))
                    }
                  />
                </div>
              </PanelCard>
              <div className="admin-section-toolbar">
                <div>
                  <h2>Patient stories</h2>
                  <p>
                    Add, edit, hide, or remove the quotes shown on your website.
                  </p>
                </div>
                <button
                  className="admin-add"
                  type="button"
                  onClick={() =>
                    setDraft(c => ({
                      ...c,
                      testimonials: {
                        ...c.testimonials,
                        items: [
                          ...c.testimonials.items,
                          {
                            id: id("story"),
                            quote: "Add an approved patient quote.",
                            name: "Patient name or initials",
                            detail: "Treatment or visit",
                            visible: false,
                          },
                        ],
                      },
                    }))
                  }
                >
                  + Add story
                </button>
              </div>
              {draft.testimonials.items.map((item, index) => (
                <PanelCard
                  key={item.id}
                  title={item.name || `Patient story ${index + 1}`}
                  description={`Story ${String(index + 1).padStart(2, "0")} · quotations should be shared with permission`}
                >
                  <div className="admin-item-editor__top">
                    <label className="admin-toggle">
                      <input
                        type="checkbox"
                        checked={item.visible}
                        onChange={event =>
                          patchTestimonial(
                            item.id,
                            "visible",
                            event.target.checked
                          )
                        }
                      />
                      <span>Visible on website</span>
                    </label>
                    <button
                      className="admin-remove"
                      type="button"
                      onClick={() =>
                        setDraft(c => ({
                          ...c,
                          testimonials: {
                            ...c.testimonials,
                            items: c.testimonials.items.filter(
                              entry => entry.id !== item.id
                            ),
                          },
                        }))
                      }
                    >
                      Remove story
                    </button>
                  </div>
                  <Field
                    label="Patient quote"
                    value={item.quote}
                    onChange={v => patchTestimonial(item.id, "quote", v)}
                    multiline
                  />
                  <div className="admin-form-grid">
                    <Field
                      label="Display name or initials"
                      value={item.name}
                      onChange={v => patchTestimonial(item.id, "name", v)}
                    />
                    <Field
                      label="Short attribution"
                      value={item.detail}
                      onChange={v => patchTestimonial(item.id, "detail", v)}
                    />
                  </div>
                </PanelCard>
              ))}
            </>
          )}

          {panel === "contact" && (
            <>
              <PanelCard
                title="Booking call-to-action"
                description="Edit the dark consultation banner near the bottom of the homepage."
              >
                <div className="admin-form-grid">
                  <Field
                    label="Section label"
                    value={draft.cta.eyebrow}
                    onChange={v =>
                      setDraft(c => ({ ...c, cta: { ...c.cta, eyebrow: v } }))
                    }
                  />
                  <Field
                    label="Headline"
                    value={draft.cta.title}
                    onChange={v =>
                      setDraft(c => ({ ...c, cta: { ...c.cta, title: v } }))
                    }
                  />
                  <Field
                    label="Supporting text"
                    value={draft.cta.description}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        cta: { ...c.cta, description: v },
                      }))
                    }
                    multiline
                  />
                  <Field
                    label="Primary button"
                    value={draft.cta.primaryCta}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        cta: { ...c.cta, primaryCta: v },
                      }))
                    }
                  />
                  <Field
                    label="Secondary button"
                    value={draft.cta.secondaryCta}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        cta: { ...c.cta, secondaryCta: v },
                      }))
                    }
                  />
                  <Field
                    label="Primary destination (URL or #section)"
                    value={draft.cta.primaryHref}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        cta: { ...c.cta, primaryHref: v },
                      }))
                    }
                  />
                  <Field
                    label="Secondary destination (URL or #section)"
                    value={draft.cta.secondaryHref}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        cta: { ...c.cta, secondaryHref: v },
                      }))
                    }
                  />
                </div>
                <ImageField
                  label="Banner background image"
                  hint="Wide photo shown behind the dark booking banner. Leave empty to keep the plain green banner."
                  value={draft.cta.image ?? ""}
                  onChange={v =>
                    setDraft(c => ({ ...c, cta: { ...c.cta, image: v } }))
                  }
                  upload={uploadImage}
                  onError={setError}
                />
              </PanelCard>
              <PanelCard
                title="Contact details"
                description="These details are displayed in the footer and consultation section."
              >
                <div className="admin-form-grid">
                  <Field
                    label="Contact section label"
                    value={draft.contact.eyebrow}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        contact: { ...c.contact, eyebrow: v },
                      }))
                    }
                  />
                  <Field
                    label="Contact heading"
                    value={draft.contact.title}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        contact: { ...c.contact, title: v },
                      }))
                    }
                  />
                  <Field
                    label="Phone"
                    value={draft.contact.phone}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        contact: { ...c.contact, phone: v },
                      }))
                    }
                  />
                  <Field
                    label="WhatsApp number"
                    hint="Visitors can message this number on WhatsApp. Use digits only, e.g. 8839145005."
                    value={draft.contact.whatsapp ?? ""}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        contact: { ...c.contact, whatsapp: v },
                      }))
                    }
                  />
                  <Field
                    label="Email"
                    value={draft.contact.email}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        contact: { ...c.contact, email: v },
                      }))
                    }
                  />
                  <Field
                    label="Clinic address"
                    value={draft.contact.address}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        contact: { ...c.contact, address: v },
                      }))
                    }
                    multiline
                  />
                  <Field
                    label="Opening hours"
                    value={draft.contact.hours}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        contact: { ...c.contact, hours: v },
                      }))
                    }
                  />
                  <Field
                    label="Map/link card text"
                    value={draft.contact.mapLabel}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        contact: { ...c.contact, mapLabel: v },
                      }))
                    }
                  />
                  <Field
                    label="Map or contact destination (URL or #section)"
                    value={draft.contact.mapHref}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        contact: { ...c.contact, mapHref: v },
                      }))
                    }
                  />
                </div>
              </PanelCard>
              <PanelCard title="Footer details">
                <div className="admin-form-grid">
                  <Field
                    label="Quick links heading"
                    value={draft.footer.quickLinksLabel}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        footer: { ...c.footer, quickLinksLabel: v },
                      }))
                    }
                  />
                  <Field
                    label="Copyright line"
                    value={draft.footer.copyright}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        footer: { ...c.footer, copyright: v },
                      }))
                    }
                  />
                  <Field
                    label="Privacy link label"
                    value={draft.footer.privacyLabel}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        footer: { ...c.footer, privacyLabel: v },
                      }))
                    }
                  />
                  <Field
                    label="Privacy page URL"
                    value={draft.footer.privacyHref}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        footer: { ...c.footer, privacyHref: v },
                      }))
                    }
                  />
                  <Field
                    label="Terms link label"
                    value={draft.footer.termsLabel}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        footer: { ...c.footer, termsLabel: v },
                      }))
                    }
                  />
                  <Field
                    label="Terms page URL"
                    value={draft.footer.termsHref}
                    onChange={v =>
                      setDraft(c => ({
                        ...c,
                        footer: { ...c.footer, termsHref: v },
                      }))
                    }
                  />
                </div>
              </PanelCard>
            </>
          )}
          {panel === "security" && (
            <>
              <PanelCard
                title="Change your password"
                description="Update the password for the account you are signed in with."
              >
                {!supabase ? (
                  <p className="admin-notice">
                    Password management is available in Supabase mode. In local
                    mode the admin password is set by ADMIN_PASSWORD in .env.
                  </p>
                ) : (
                  <form className="admin-form-grid" onSubmit={handleChangePassword}>
                    <Field
                      label="Account email"
                      value={session?.user?.email ?? ""}
                      onChange={() => {}}
                      disabled
                      hint="The account whose password will be changed."
                    />
                    <Field
                      label="Current password"
                      value={pwCurrent}
                      onChange={setPwCurrent}
                      type="password"
                    />
                    <Field
                      label="New password"
                      value={pwNew}
                      onChange={setPwNew}
                      type="password"
                    />
                    <Field
                      label="Confirm new password"
                      value={pwConfirm}
                      onChange={setPwConfirm}
                      type="password"
                    />
                    <div className="admin-form-actions">
                      <button
                        className="button button--green"
                        type="submit"
                        disabled={pwBusy}
                      >
                        <KeyRound size={16} /> {pwBusy ? "Updating…" : "Update password"}
                      </button>
                    </div>
                    {pwError && <p className="admin-error">{pwError}</p>}
                    {pwNotice && <p className="admin-notice">{pwNotice}</p>}
                  </form>
                )}
              </PanelCard>
            </>
          )}
          <div className="admin-bottom-save">
            <button
              className="button button--green"
              type="button"
              disabled={saving || loadingContent}
              onClick={() => void handleSave()}
            >
              {saving ? (
                "Saving…"
              ) : (
                <>
                  <Save size={16} /> Save changes
                </>
              )}
            </button>
            <span>Saved changes update the public website.</span>
          </div>
        </div>
      </main>
    </div>
  );
}
