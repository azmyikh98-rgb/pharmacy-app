/**
 * tailwind.config.js
 * -----------------------------------------------------------------------
 * Konfigurasi Tailwind Play CDN. WAJIB di-include tepat setelah tag
 * <script src="https://cdn.tailwindcss.com"></script> dan SEBELUM konten
 * body yang memakai class Tailwind di-scan.
 *
 * Semua nilai di sini adalah satu-satunya sumber kebenaran untuk token
 * desain (warna, radius, shadow). Jangan hardcode hex color di file lain
 * selain di sini dan di css/style.css (:root variables, harus selalu sinkron).
 * -----------------------------------------------------------------------
 */

tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563EB",
          50: "#EFF6FF",
          100: "#DBEAFE",
          600: "#2563EB",
          700: "#1D4ED8",
        },
        success: {
          DEFAULT: "#16A34A",
          50: "#F0FDF4",
          600: "#16A34A",
          700: "#15803D",
        },
        danger: {
          DEFAULT: "#DC2626",
          50: "#FEF2F2",
          600: "#DC2626",
          700: "#B91C1C",
        },
        warning: {
          DEFAULT: "#F59E0B",
          50: "#FFFBEB",
          600: "#F59E0B",
          700: "#B45309",
        },
        surface: "#F8FAFC",
        sidebar: "#0F172A",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.06)",
        "soft-lg": "0 4px 6px rgba(15,23,42,0.05), 0 12px 32px rgba(15,23,42,0.08)",
      },
      spacing: {
        // Melengkapi skala default Tailwind (sudah berbasis 4px) supaya
        // kelipatan grid 8px eksplisit tersedia sebagai alias semantik.
        18: "4.5rem",
      },
    },
  },
};
