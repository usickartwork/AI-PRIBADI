"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionContextType {
  value: string[];
  onToggle: (itemValue: string) => void;
}

const AccordionContext = React.createContext<AccordionContextType | null>(null);

interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "single" | "multiple";
  multiple?: boolean;
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: any) => void;
  children: React.ReactNode;
}

export const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  (
    {
      type = "single",
      multiple = false,
      defaultValue,
      value: controlledValue,
      onValueChange,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isMultiple = multiple || type === "multiple";
    const [internalValue, setInternalValue] = React.useState<string[]>(() => {
      if (defaultValue) {
        return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
      }
      return [];
    });

    const activeValue =
      controlledValue !== undefined
        ? Array.isArray(controlledValue)
          ? controlledValue
          : [controlledValue]
        : internalValue;

    const handleToggle = React.useCallback(
      (itemValue: string) => {
        let nextValue: string[];
        if (isMultiple) {
          if (activeValue.includes(itemValue)) {
            nextValue = activeValue.filter((v) => v !== itemValue);
          } else {
            nextValue = [...activeValue, itemValue];
          }
        } else {
          nextValue = activeValue.includes(itemValue) ? [] : [itemValue];
        }

        if (controlledValue === undefined) {
          setInternalValue(nextValue);
        }
        if (onValueChange) {
          onValueChange(isMultiple ? nextValue : nextValue[0] || "");
        }
      },
      [isMultiple, activeValue, controlledValue, onValueChange]
    );

    return (
      <AccordionContext.Provider value={{ value: activeValue, onToggle: handleToggle }}>
        <div ref={ref} className={cn("space-y-1", className)} {...props}>
          {children}
        </div>
      </AccordionContext.Provider>
    );
  }
);
Accordion.displayName = "Accordion";

interface AccordionItemContextType {
  value: string;
  isOpen: boolean;
}

const AccordionItemContext = React.createContext<AccordionItemContextType | null>(null);

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children: React.ReactNode;
}

export const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, className, children, ...props }, ref) => {
    const ctx = React.useContext(AccordionContext);
    const isOpen = ctx ? ctx.value.includes(value) : false;

    return (
      <AccordionItemContext.Provider value={{ value, isOpen }}>
        <div
          ref={ref}
          data-state={isOpen ? "open" : "closed"}
          className={cn("border-b border-zinc-200 dark:border-zinc-800 transition-colors", className)}
          {...props}
        >
          {children}
        </div>
      </AccordionItemContext.Provider>
    );
  }
);
AccordionItem.displayName = "AccordionItem";

interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const itemCtx = React.useContext(AccordionItemContext);
    const accordionCtx = React.useContext(AccordionContext);
    const isOpen = itemCtx?.isOpen ?? false;

    return (
      <button
        ref={ref}
        type="button"
        data-state={isOpen ? "open" : "closed"}
        onClick={(e) => {
          props.onClick?.(e);
          if (itemCtx && accordionCtx) {
            accordionCtx.onToggle(itemCtx.value);
          }
        }}
        className={cn(
          "flex w-full items-center justify-between py-2 text-left font-medium transition-all hover:no-underline cursor-pointer [&[data-state=open]>svg]:rotate-180",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 text-zinc-400" />
      </button>
    );
  }
);
AccordionTrigger.displayName = "AccordionTrigger";

interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children, ...props }, ref) => {
    const itemCtx = React.useContext(AccordionItemContext);
    const isOpen = itemCtx?.isOpen ?? false;

    if (!isOpen) return null;

    return (
      <div
        ref={ref}
        data-state={isOpen ? "open" : "closed"}
        className={cn(
          "overflow-hidden text-sm transition-all animate-in fade-in-0 duration-200",
          className
        )}
        {...props}
      >
        <div className="pb-3 pt-1">{children}</div>
      </div>
    );
  }
);
AccordionContent.displayName = "AccordionContent";

