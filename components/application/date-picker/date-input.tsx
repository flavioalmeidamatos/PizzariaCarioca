import type { DateInputProps as AriaDateInputProps } from "react-aria-components";
import { DateInput as AriaDateInput, DateSegment as AriaDateSegment } from "react-aria-components";
import { cx } from "@/utils/cx";

interface DateInputProps extends Omit<AriaDateInputProps, "children"> { }

export const DateInput = (props: DateInputProps) => {
    return (
        <AriaDateInput
            {...props}
            className={cx(
                "flex rounded-lg bg-slate-800/50 px-2.5 py-2 text-md shadow-lg ring-2 ring-white/10 focus-within:ring-2 focus-within:ring-primary border border-white/5",
                typeof props.className === "string" && props.className,
            )}
        >
            {(segment) => (
                <AriaDateSegment
                    segment={segment}
                    className={cx(
                        "rounded px-0.5 text-white tabular-nums caret-transparent focus:bg-gradient-to-r focus:from-[#e31837] focus:to-[#ff4d6d] focus:font-bold focus:text-white focus:outline-hidden transition-all",
                        // The placeholder segment.
                        segment.isPlaceholder && "text-slate-500 uppercase",
                        // The separator "/" segment.
                        segment.type === "literal" && "text-slate-400",
                    )}
                />
            )}
        </AriaDateInput>
    );
};
