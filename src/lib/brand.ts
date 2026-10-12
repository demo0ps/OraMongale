// Canonical brand contact details — update here to reflect across the site.
export const BRAND = {
  name: "OraMongale",
  fullName: "OraMongale Tradings",
  phoneDisplay: "072 820 4661",
  phoneTel: "+27728204661",
  email: "Oramongaletradings@gmail.com",
  whatsappNumber: "27728204661", // E.164 without leading + for wa.me links
  get whatsappLink() {
    return `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(
      "Hi OraMongale, I'd like to enquire about haulage."
    )}`;
  },
} as const;
