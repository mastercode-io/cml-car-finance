import plugin from "tailwindcss/plugin"

export const shadcnPlugin = plugin(
  // Add variants and base styles
  function ({ addBase }) {
    addBase({
      ":root": {
        "--background": "0 0% 100%",
        "--foreground": "215 43% 25%",
        "--card": "197 9% 61%",
        "--card-foreground": "215 43% 25%",
        "--popover": "0 0% 100%",
        "--popover-foreground": "215 43% 25%",
        "--primary": "358 49% 53%",
        "--primary-foreground": "0 0% 100%",
        "--secondary": "178 86% 44%",
        "--secondary-foreground": "215 43% 25%",
        "--muted": "197 9% 61%",
        "--muted-foreground": "215 43% 25%",
        "--accent": "52 100% 66%",
        "--accent-foreground": "215 43% 25%",
        "--destructive": "358 49% 53%",
        "--destructive-foreground": "0 0% 100%",
        "--success": "58 98% 50%",
        "--success-foreground": "206 35% 15%",
        "--border": "197 9% 61%",
        "--input": "197 9% 61%",
        "--ring": "215 43% 25%",
        "--radius": "0.5rem"
      },
      ".dark": {
        "--background": "215 43% 25%",
        "--foreground": "0 0% 100%",
        "--card": "215 43% 20%",
        "--card-foreground": "0 0% 100%",
        "--popover": "215 43% 25%",
        "--popover-foreground": "0 0% 100%",
        "--primary": "358 49% 53%",
        "--primary-foreground": "0 0% 100%",
        "--secondary": "178 86% 44%",
        "--secondary-foreground": "215 43% 25%",
        "--muted": "215 43% 20%",
        "--muted-foreground": "197 9% 61%",
        "--accent": "52 100% 66%",
        "--accent-foreground": "215 43% 25%",
        "--destructive": "358 49% 53%",
        "--destructive-foreground": "0 0% 100%",
        "--success": "58 98% 50%",
        "--success-foreground": "206 35% 15%",
        "--border": "197 9% 61%",
        "--input": "197 9% 61%",
        "--ring": "0 0% 100%"
      }
    })
  }
) 