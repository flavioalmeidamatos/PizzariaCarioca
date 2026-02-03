import { getLocalTimeZone, today } from "@internationalized/date";
import { useControlledState } from "@react-stately/utils";
import { Calendar as CalendarIcon } from "@untitledui/icons";
import { useDateFormatter } from "react-aria";
import type { DatePickerProps as AriaDatePickerProps, DateValue } from "react-aria-components";
import { DatePicker as AriaDatePicker, Dialog as AriaDialog, Group as AriaGroup, Popover as AriaPopover, Button as AriaButton } from "react-aria-components";
import { cx } from "@/utils/cx";
import { Calendar } from "./calendar";

const highlightedDates = [today(getLocalTimeZone())];

interface DatePickerProps extends AriaDatePickerProps<DateValue> {
    /** The function to call when the apply button is clicked. */
    onApply?: () => void;
    /** The function to call when the cancel button is clicked. */
    onCancel?: () => void;
}

export const DatePicker = ({ value: valueProp, defaultValue, onChange, onApply, onCancel, ...props }: DatePickerProps) => {
    const formatter = useDateFormatter({
        month: "short",
        day: "numeric",
        year: "numeric",
    });
    const [value, setValue] = useControlledState(valueProp, defaultValue || null, onChange);

    const formattedDate = value ? formatter.format(value.toDate(getLocalTimeZone())) : "Selecione";

    return (
        <AriaDatePicker shouldCloseOnSelect={false} {...props} value={value} onChange={setValue}>
            <AriaGroup>
                <AriaButton
                    className="flex items-center gap-2 bg-slate-800/50 border-2 border-white/30 rounded-lg px-3 py-1.5 text-[10px] text-white hover:bg-slate-700/50 hover:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed outline-none focus:border-primary shadow-lg cursor-pointer"
                >
                    <CalendarIcon className="w-3 h-3 text-primary" />
                    <span className="font-medium capitalize">{formattedDate}</span>
                </AriaButton>
            </AriaGroup>
            <AriaPopover
                offset={8}
                placement="bottom right"
                className={({ isEntering, isExiting }) =>
                    cx(
                        "origin-(--trigger-anchor-point) will-change-transform",
                        isEntering &&
                        "duration-150 ease-out animate-in fade-in placement-right:slide-in-from-left-0.5 placement-top:slide-in-from-bottom-0.5 placement-bottom:slide-in-from-top-0.5",
                        isExiting &&
                        "duration-100 ease-in animate-out fade-out placement-right:slide-out-to-left-0.5 placement-top:slide-out-to-bottom-0.5 placement-bottom:slide-out-to-top-0.5",
                    )
                }
            >
                <AriaDialog className="rounded-2xl bg-slate-900 shadow-2xl ring-2 ring-white/10 backdrop-blur-xl border border-white/5">
                    {({ close }) => (
                        <>
                            <div className="flex px-6 py-5 bg-gradient-to-br from-slate-800/50 to-slate-900/50">
                                <Calendar highlightedDates={highlightedDates} />
                            </div>
                            <div className="grid grid-cols-2 gap-3 border-t border-white/10 p-4 bg-slate-900/80">
                                <button
                                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-slate-700 to-slate-600 text-white py-2 px-4 rounded-lg transition-all hover:scale-105 hover:shadow-lg active:scale-95 font-medium text-sm"
                                    onClick={() => {
                                        onCancel?.();
                                        close();
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#e31837] to-[#ff4d6d] text-white py-2 px-4 rounded-lg transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(227,24,55,0.4)] active:scale-95 font-bold text-sm"
                                    onClick={() => {
                                        onApply?.();
                                        close();
                                    }}
                                >
                                    Escolher
                                </button>
                            </div>
                        </>
                    )}
                </AriaDialog>
            </AriaPopover>
        </AriaDatePicker>
    );
};
