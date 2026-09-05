/*
 * `tv` vient de `tailwind-variants`, sa VRAIE origine — c'est une dependance directe du
 * projet (package.json). Il transitait jusqu'ici par la couche `@/components/heroui`,
 * c'est-a-dire par une reexportation de `@heroui/react` : le seul fichier a garder cette
 * couche vivante n'etait donc pas un composant, mais un utilitaire qui n'a rien a y faire.
 */
import { tv } from 'tailwind-variants';

export const title = tv({
  base: "tracking-tight inline font-semibold",
  variants: {
    /*
     * Sept degrades du gabarit d'origine (violet, jaune, bleu, cyan, vert, rose,
     * `foreground`) ont ete retires : aucun n'etait employe. Seul `primary` sert, 219
     * fois, et il est le seul a suivre le theme puisqu'il passe par les jetons.
     */
    color: {
      primary: "from-[hsl(var(--primary))] to-[var(--accent)]",
    },
    size: {
      h1: "text-4xl md:text-5xl lg:text-6xl 2xl:text-7xl leading-auto",
      h2: "text-3xl md:text-4xl lg:text-5xl 2xl:text-6xl leading-auto",
      h3: "text-2xl md:text-3xl lg:text-4xl 2xl:text-5xl leading-auto",
      h4: "text-lg md:text-xl lg:text-3xl 2xl:text-4xl leading-auto",
      h5: "text-xl lg:text-2xl 2xl:text-3xl leading-auto",
      h6: "text-lg lg:text-xl 2xl:text-2xl leading-auto",
    },
    fullWidth: {
      true: "w-full block",
    },
  },
  defaultVariants: {
    size: "h3",
  },
  compoundVariants: [
    {
      color: ["primary"],
      class: "bg-clip-text text-transparent bg-linear-to-b",
    },
  ],
});

export const subtitle = tv({
  base: "leading-6 w-full my-2 text-lg lg:text-xl 2xl:text-2xl text-default-600 block max-w-full",
  variants: {
    color: {
      primary: "from-[hsl(var(--primary))] to-[var(--accent)]",
    },
    fullWidth: {
      true: "w-full",
    },
  },
  defaultVariants: {
    fullWidth: true,
  },
  compoundVariants: [
    {
      color: ["primary"],
      class: "bg-clip-text text-transparent bg-linear-to-b",
    },
  ],
});

export const body = tv({
  base: "text-base 2xl:text-lg leading-6",
  variants: {
    color: {
      primary: "from-[hsl(var(--primary))] to-[var(--accent)]",
    },
    size: {
      body: "text-base 2xl:text-lg leading-6",
      body2: "text-sm 2xl:text-base leading-5",
      caption: "text-sm 2xl:text-base leading-4 text-muted",
      overline: "text-sm 2xl:text-base leading-4 font-bold tracking-tight",
    },
  },
  defaultVariants: {
    size: "body",
  },
  compoundVariants: [
    {
      color: ["primary"],
      class: "bg-clip-text text-transparent bg-linear-to-b",
    },
  ],
});
