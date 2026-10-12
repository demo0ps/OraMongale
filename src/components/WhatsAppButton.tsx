"use client";

export default function WhatsAppButton({
  label = "WhatsApp us",
  className = "",
  variant = "solid",
}: {
  label?: string;
  className?: string;
  variant?: "solid" | "ghost-on-dark";
}) {
  const phone = "27728204661";
  const href = `https://wa.me/${phone}?text=${encodeURIComponent(
    "Hi OraMongale — I'd like to enquire about haulage.",
  )}`;
  const base =
    "inline-flex items-center gap-2 font-semibold rounded-md px-5 py-3 transition";
  const styles =
    variant === "ghost-on-dark"
      ? "bg-[#25D366] hover:bg-[#1ebe5b] text-white"
      : "bg-whatsapp hover:bg-[#1ebe5b] text-white shadow-md hover:shadow-lg";
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} ${styles} ${className}`}
      aria-label="Chat on WhatsApp"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9s-.5-.1-.7.2-.8.9-.9 1.1c-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.5 1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.4.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.6 1.4 5.1L2 22l5-1.3c1.5.8 3.2 1.3 5 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18.2c-1.7 0-3.3-.5-4.7-1.3l-.3-.2-3 .8.8-2.9-.2-.3c-.9-1.4-1.4-3.1-1.4-4.8 0-4.6 3.8-8.3 8.3-8.3s8.3 3.7 8.3 8.3-3.8 8.7-7.8 8.7z" />
      </svg>
      {label}
    </a>
  );
}
