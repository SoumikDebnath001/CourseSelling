import { useNavigate } from "react-router-dom";
import {
  FiArrowUpRight,
  FiMail,
  FiPhone,
  FiMapPin,
  FiInstagram,
  FiTwitter,
  FiFacebook,
} from "react-icons/fi";

const QUICK_LINKS = [
  { label: "Home", path: "/" },
  { label: "Services", path: "/services" },
  { label: "About", path: "/about" },

];

const SERVICES_LINKS = [
  { label: "Luxury Rooms", path: "/services" },
  { label: "Fine Dining", path: "/services" },
  { label: "Spa & Wellness", path: "/services" },
  { label: "Event Hosting", path: "/services" },
];

const Footer = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-stone-950 text-white">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute top-0 left-1/4 h-80 w-80 rounded-full bg-amber-500/5 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-amber-700/5 blur-[120px]" />

      {/* Top decorative border */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

      {/* Main footer content */}
      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-10 lg:px-16 lg:py-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-4">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="font-serif text-3xl font-bold tracking-tight text-white transition-colors duration-300 hover:text-amber-400"
            >
              ComfyStay
            </button>
            <p className="mt-5 max-w-xs text-sm leading-7 text-stone-400">
              A collection of considered spaces for people who value the comfort
              of home and the quiet pleasure of being looked after.
            </p>

            {/* Social icons */}
            <div className="mt-7 flex items-center gap-4">
              {[
                { Icon: FiInstagram, label: "Instagram" },
                { Icon: FiTwitter, label: "Twitter" },
                { Icon: FiFacebook, label: "Facebook" },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-stone-400 transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-400"
                >
                  <Icon className="h-[18px] w-[18px]" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 lg:col-start-6">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-400">
              Navigation
            </h4>
            <ul className="mt-5 space-y-3.5">
              {QUICK_LINKS.map((link) => (
                <li key={link.path + link.label}>
                  <button
                    type="button"
                    onClick={() => navigate(link.path)}
                    className="group inline-flex items-center gap-1.5 text-sm text-stone-400 transition-colors hover:text-white"
                  >
                    {link.label}
                    <FiArrowUpRight className="h-3 w-3 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="lg:col-span-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-400">
              Services
            </h4>
            <ul className="mt-5 space-y-3.5">
              {SERVICES_LINKS.map((link) => (
                <li key={link.label}>
                  <button
                    type="button"
                    onClick={() => navigate(link.path)}
                    className="group inline-flex items-center gap-1.5 text-sm text-stone-400 transition-colors hover:text-white"
                  >
                    {link.label}
                    <FiArrowUpRight className="h-3 w-3 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-400">
              Get in Touch
            </h4>
            <ul className="mt-5 space-y-4">
              <li className="flex items-start gap-3">
                <FiMail className="mt-0.5 h-4 w-4 shrink-0 text-amber-500/70" />
                <a
                  href="mailto:hello@comfystay.com"
                  className="text-sm text-stone-400 transition-colors hover:text-white"
                >
                  hello@comfystay.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <FiPhone className="mt-0.5 h-4 w-4 shrink-0 text-amber-500/70" />
                <a
                  href="tel:+12125550188"
                  className="text-sm text-stone-400 transition-colors hover:text-white"
                >
                  +1 (212) 555-0188
                </a>
              </li>
              <li className="flex items-start gap-3">
                <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-500/70" />
                <span className="text-sm text-stone-400">
                  18 Willow Street, New York
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row sm:px-10 lg:px-16">
          <p className="text-xs text-stone-500">
            © {currentYear} ComfyStay. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-stone-500">
            <button
              type="button"
              className="transition-colors hover:text-stone-300"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              className="transition-colors hover:text-stone-300"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
