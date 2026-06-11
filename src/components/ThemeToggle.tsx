import { motion, AnimatePresence } from "motion/react";
import { Moon, Sun } from "lucide-react";
import { Tooltip } from "@heroui/react";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/lib/theme";

const EASE = [0.16, 1, 0.3, 1] as const;

export function ThemeToggle() {
  const theme = useTheme((s) => s.theme);
  const toggle = useTheme((s) => s.toggle);

  return (
    <Tooltip delay={400}>
      <Button isIconOnly aria-label="Toggle theme" size="sm" variant="ghost" onPress={toggle}>
        <AnimatePresence initial={false} mode="wait">
          <motion.span
            key={theme}
            animate={{ opacity: 1, rotate: 0 }}
            className="block"
            exit={{ opacity: 0, rotate: 90 }}
            initial={{ opacity: 0, rotate: -90 }}
            transition={{ duration: 0.18, ease: EASE }}
          >
            {theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </motion.span>
        </AnimatePresence>
      </Button>
      <Tooltip.Content>
        <p>{theme === "dark" ? "Switch to light" : "Switch to dark"}</p>
      </Tooltip.Content>
    </Tooltip>
  );
}
