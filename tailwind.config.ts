import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        'dm-sans': ['DM Sans', 'sans-serif'],
      },
      colors: {
        'deep-lilac': {
          50: '#f1eef6', 100: '#e4ddee', 200: '#c9bbdd', 300: '#ad99cc',
          400: '#9277bb', 500: '#7755aa', 600: '#5f4488', 700: '#473366',
          800: '#302244', 900: '#181122', 950: '#110c18',
        },
        lavender: {
          50: '#f1eef6', 100: '#e3deed', 200: '#c8bddb', 300: '#ac9cc9',
          400: '#917ab8', 500: '#7559a6', 600: '#5e4785', 700: '#463663',
          800: '#2f2442', 900: '#171221', 950: '#100c17',
        },
        'dark-amethyst': {
          50: '#f1edf7', 100: '#e3dbf0', 200: '#c7b8e0', 300: '#aa94d1',
          400: '#8e70c2', 500: '#724db3', 600: '#5b3d8f', 700: '#442e6b',
          800: '#2e1f47', 900: '#170f24', 950: '#100b19',
        },
        'indigo-velvet': {
          50: '#f1eef7', 100: '#e3dcef', 200: '#c8bade', 300: '#ac97ce',
          400: '#9074be', 500: '#7552ad', 600: '#5d418b', 700: '#463168',
          800: '#2f2145', 900: '#171023', 950: '#100b18',
        },
        wisteria: {
          50: '#f1eef6', 100: '#e4deed', 200: '#c8bddb', 300: '#ad9cc9',
          400: '#927ab8', 500: '#7759a6', 600: '#5f4785', 700: '#473663',
          800: '#2f2442', 900: '#181221', 950: '#110c17',
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
