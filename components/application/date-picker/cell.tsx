import { getDayOfWeek, getLocalTimeZone, isToday } from "@internationalized/date";
import type { CalendarCellProps as AriaCalendarCellProps } from "react-aria-components";
import { CalendarCell as AriaCalendarCell, RangeCalendarContext, useLocale, useSlottedContext } from "react-aria-components";
import { cx } from "@/utils/cx";

interface CalendarCellProps extends AriaCalendarCellProps {
    /** Whether the calendar is a range calendar. */
    isRangeCalendar?: boolean;
    /** Whether the cell is highlighted. */
    isHighlighted?: boolean;
}

export const CalendarCell = ({ date, isHighlighted, ...props }: CalendarCellProps) => {
    const { locale } = useLocale();
    const dayOfWeek = getDayOfWeek(date, locale);
    const rangeCalendarContext = useSlottedContext(RangeCalendarContext);

    const isRangeCalendar = !!rangeCalendarContext;

    const start = rangeCalendarContext?.value?.start;
    const end = rangeCalendarContext?.value?.end;

    const isAfterStart = start ? date.compare(start) > 0 : true;
    const isBeforeEnd = end ? date.compare(end) < 0 : true;

    const isAfterOrOnStart = start && date.compare(start) >= 0;
    const isBeforeOrOnEnd = end && date.compare(end) <= 0;
    const isInRange = isAfterOrOnStart && isBeforeOrOnEnd;

    const lastDayOfMonth = new Date(date.year, date.month, 0).getDate();
    const isLastDayOfMonth = date.day === lastDayOfMonth;
    const isFirstDayOfMonth = date.day === 1;

    const isTodayDate = isToday(date, getLocalTimeZone());

    return (
        <AriaCalendarCell
            {...props}
            date={date}
            className={({ isDisabled, isFocusVisible, isSelectionStart, isSelectionEnd, isSelected, isOutsideMonth }) => {
                const isRoundedLeft = isSelectionStart || dayOfWeek === 0;
                const isRoundedRight = isSelectionEnd || dayOfWeek === 6;

                return cx(
                    "relative size-10 focus:outline-none",
                    isRoundedLeft && "rounded-l-full",
                    isRoundedRight && "rounded-r-full",
                    isInRange && isDisabled && "bg-slate-700/30",
                    isSelected && isRangeCalendar && "bg-slate-700/30",
                    isDisabled ? "pointer-events-none" : "cursor-pointer",
                    isFocusVisible ? "z-10" : "z-0",
                    isRangeCalendar && isOutsideMonth && "hidden",

                    // Show gradient on last day of month if it's within the selected range.
                    isLastDayOfMonth &&
                    isSelected &&
                    isBeforeEnd &&
                    isRangeCalendar &&
                    "after:absolute after:inset-0 after:translate-x-full after:bg-gradient-to-l after:from-transparent after:to-slate-700/30 in-[[role=gridcell]:last-child]:after:hidden",

                    // Show gradient on first day of month if it's within the selected range.
                    isFirstDayOfMonth &&
                    isSelected &&
                    isAfterStart &&
                    isRangeCalendar &&
                    "after:absolute after:inset-0 after:-translate-x-full after:bg-gradient-to-r after:from-transparent after:to-slate-700/30 in-[[role=gridcell]:first-child]:after:hidden",
                );
            }}
        >
            {({ isDisabled, isFocusVisible, isSelectionStart, isSelectionEnd, isSelected, formattedDate }) => {
                const markedAsSelected = isSelectionStart || isSelectionEnd || (isSelected && !isDisabled && !isRangeCalendar);

                return (
                    <div
                        className={cx(
                            "relative flex size-full items-center justify-center rounded-full text-sm transition-all",
                            // Disabled state.
                            isDisabled ? "text-slate-600" : "text-slate-200 hover:text-white",
                            // Focus ring, visible while the cell has keyboard focus.
                            isFocusVisible ? "outline-2 outline-offset-2 outline-primary" : "",
                            // Hover state for cells in the middle of the range.
                            isSelected && !isDisabled && isRangeCalendar ? "font-medium" : "",
                            markedAsSelected && "bg-gradient-to-r from-[#e31837] to-[#ff4d6d] font-bold text-white hover:scale-110 shadow-lg",
                            // Hover state for non-selected cells.
                            !isSelected && !isDisabled ? "hover:bg-slate-700/50 hover:font-medium hover:scale-105" : "",
                            !isSelected && isTodayDate ? "bg-slate-700/50 font-medium hover:bg-slate-600/50 ring-2 ring-primary/50" : "",
                        )}
                    >
                        {formattedDate}

                        {(isHighlighted || isTodayDate) && (
                            <div
                                className={cx(
                                    "absolute bottom-1 left-1/2 size-1.25 -translate-x-1/2 rounded-full",
                                    isDisabled ? "bg-slate-600" : markedAsSelected ? "bg-white" : "bg-primary",
                                )}
                            />
                        )}
                    </div>
                );
            }}
        </AriaCalendarCell>
    );
};
