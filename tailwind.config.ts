import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/**/*.{ts,tsx}"],
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
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'monospace'],
      },
      colors: {
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
        // Intelligence classification colors
        intel: {
          classified: "rgb(var(--intel-classified))",
          secret: "rgb(var(--intel-secret))",
          confidential: "rgb(var(--intel-confidential))",
          restricted: "rgb(var(--intel-restricted))",
          unclassified: "rgb(var(--intel-unclassified))",
        },
        // Mission status colors
        mission: {
          active: "rgb(var(--mission-active))",
          pending: "rgb(var(--mission-pending))",
          completed: "rgb(var(--mission-completed))",
          compromised: "rgb(var(--mission-compromised))",
          archived: "rgb(var(--mission-archived))",
        },
        // Surveillance colors
        surveillance: {
          online: "rgb(var(--surveillance-online))",
          offline: "rgb(var(--surveillance-offline))",
          unknown: "rgb(var(--surveillance-unknown))",
          tracked: "rgb(var(--surveillance-tracked))",
        },
        // Evidence classification
        evidence: {
          digital: "rgb(var(--evidence-digital))",
          physical: "rgb(var(--evidence-physical))",
          testimony: "rgb(var(--evidence-testimony))",
          document: "rgb(var(--evidence-document))",
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
        "scan": {
          "0%": { left: "-100%" },
          "100%": { left: "100%" },
        },
        "pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "blink": {
          "0%, 50%": { opacity: "1" },
          "51%, 100%": { opacity: "0.3" },
        },
        "typing": {
          "0%, 50%": { borderColor: "hsl(var(--primary))" },
          "51%, 100%": { borderColor: "transparent" },
        },
        "dots": {
          "0%, 20%": { content: "''" },
          "40%": { content: "'.'" },
          "60%": { content: "'..'" },
          "80%, 100%": { content: "'...'" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "scan": "scan 3s infinite",
        "pulse": "pulse 2s infinite",
        "blink": "blink 1s infinite",
        "typing": "typing 1s infinite",
        "dots": "dots 1.5s infinite",
      },
      backgroundImage: {
        'intel-grid': `
          linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px),
          radial-gradient(circle at 50% 50%, rgba(0, 255, 255, 0.01) 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        'intel-grid': '25px 25px, 25px 25px, 50px 50px',
      },
      backgroundPosition: {
        'intel-grid': '0 0, 0 0, 25px 25px',
      },
      boxShadow: {
        'cyber': '0 0 5px rgba(0, 255, 255, 0.5), 0 0 10px rgba(0, 255, 255, 0.3), 0 0 15px rgba(0, 255, 255, 0.1)',
        'danger': '0 0 5px rgba(255, 50, 50, 0.5), 0 0 10px rgba(255, 50, 50, 0.3), 0 0 15px rgba(255, 50, 50, 0.1)',
        'success': '0 0 5px rgba(0, 255, 127, 0.5), 0 0 10px rgba(0, 255, 127, 0.3), 0 0 15px rgba(0, 255, 127, 0.1)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
