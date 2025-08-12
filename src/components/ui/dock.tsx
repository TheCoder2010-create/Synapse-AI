
"use client";

import {
  motion,
  useMotionValue,
  AnimatePresence,
  type MotionValue,
} from "framer-motion";
import {
  Children,
  cloneElement,
  useEffect,
  useState,
  type ReactNode,
  type ReactElement,
} from "react";

import "./dock.css";
import { cn } from "@/lib/utils";

// Type definitions
type DockItemProps = {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  baseItemSize: number;
};

type DockLabelProps = {
  children: ReactNode;
  className?: string;
  isHovered?: MotionValue<number>;
};

type DockIconProps = {
  children: ReactNode;
  className?: string;
  isHovered?: MotionValue<number>;
};

type DockItemConfig = {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  className?: string;
};

export type DockProps = {
  items: DockItemConfig[];
  className?: string;
  panelHeight?: number;
  baseItemSize?: number;
};


function DockItem({
  children,
  className = "",
  onClick,
  baseItemSize,
}: DockItemProps) {
  const isHovered = useMotionValue(0);

  return (
    <motion.div
      style={{
        width: baseItemSize,
        height: baseItemSize,
      }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onClick}
      className={`dock-item ${className}`}
      tabIndex={0}
      role="button"
      aria-haspopup="true"
    >
      {Children.map(children, (child) =>
        cloneElement(child as ReactElement, { isHovered })
      )}
    </motion.div>
  );
}

function DockLabel({ children, className = "", isHovered }: DockLabelProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isHovered) return;
    const unsubscribe = isHovered.on("change", (latest) => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -10 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`dock-label ${className}`}
          role="tooltip"
          style={{ x: "-50%" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DockIcon({ children, className = "" }: DockIconProps) {
  return <div className={`dock-icon ${className}`}>{children}</div>;
}

export default function Dock({
  items,
  className = "",
  panelHeight = 68,
  baseItemSize = 50,
}: DockProps) {

  return (
    <div
      style={{ height: panelHeight }}
      className="dock-outer"
    >
      <div
        className={cn(
          "dock-panel",
          "bg-card/50 backdrop-blur-lg border border-white/10 rounded-2xl",
          className
        )}
        style={{ height: panelHeight }}
        role="toolbar"
        aria-label="Application dock"
      >
        {items.map((item, index) => (
          <DockItem
            key={index}
            onClick={item.onClick}
            className={item.className}
            baseItemSize={baseItemSize}
          >
            <DockIcon>{item.icon}</DockIcon>
            <DockLabel>{item.label}</DockLabel>
          </DockItem>
        ))}
      </div>
    </div>
  );
}

    