// `tv` transite par la couche unique comme le reste : `@heroui/react` le
// reexporte (verifie a l'execution). Dernier import direct d'un sous-paquet.
import { tv } from '@/components/heroui';

export const title = tv({
  base: "tracking-tight inline font-semibold",
  variants: {
    color: {
      violet: "from-[#FF1CF7] to-[#b249f8]",
      yellow: "from-[#FF705B] to-[#FFB457]",
      blue: "from-[#5EA2EF] to-[#0072F5]",
      cyan: "from-[#00b7fa] to-[#01cfea]",
      green: "from-[#6FEE8D] to-[#17c964]",
      pink: "from-[#FF72E1] to-[#F54C7A]",
      foreground: "dark:from-[#FFFFFF] dark:to-[#4B4B4B]",
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
      color: [
        "violet",
        "yellow",
        "blue",
        "cyan",
        "green",
        "pink",
        "foreground",
        "primary",
      ],
      class: "bg-clip-text text-transparent bg-linear-to-b",
    },
  ],
});

export const subtitle = tv({
  base: "leading-6 w-full my-2 text-lg lg:text-xl 2xl:text-2xl text-default-600 block max-w-full",
  variants: {
    color: {
      violet: "from-[#FF1CF7] to-[#b249f8]",
      yellow: "from-[#FF705B] to-[#FFB457]",
      blue: "from-[#5EA2EF] to-[#0072F5]",
      cyan: "from-[#00b7fa] to-[#01cfea]",
      green: "from-[#6FEE8D] to-[#17c964]",
      pink: "from-[#FF72E1] to-[#F54C7A]",
      foreground: "dark:from-[#FFFFFF] dark:to-[#4B4B4B]",
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
      color: [
        "violet",
        "yellow",
        "blue",
        "cyan",
        "green",
        "pink",
        "foreground",
        "primary",
      ],
      class: "bg-clip-text text-transparent bg-linear-to-b",
    },
  ],
});

export const body = tv({
  base: "text-base 2xl:text-lg leading-6",
  variants: {
    color: {
      violet: "from-[#FF1CF7] to-[#b249f8]",
      yellow: "from-[#FF705B] to-[#FFB457]",
      blue: "from-[#5EA2EF] to-[#0072F5]",
      cyan: "from-[#00b7fa] to-[#01cfea]",
      green: "from-[#6FEE8D] to-[#17c964]",
      pink: "from-[#FF72E1] to-[#F54C7A]",
      foreground: "dark:from-[#FFFFFF] dark:to-[#4B4B4B]",
      primary: "from-[hsl(var(--primary))] to-[var(--accent)]",
    },
    size: {
      body: "text-base 2xl:text-lg leading-6",
      body2: "text-sm 2xl:text-base leading-5",
      caption: "text-sm 2xl:text-base leading-4 text-muted-foreground",
      overline: "text-sm 2xl:text-base leading-4 font-bold tracking-tight",
    },
  },
  defaultVariants: {
    size: "body",
  },
  compoundVariants: [
    {
      color: [
        "violet",
        "yellow",
        "blue",
        "cyan",
        "green",
        "pink",
        "foreground",
        "primary",
      ],
      class: "bg-clip-text text-transparent bg-linear-to-b",
    },
  ],
});
