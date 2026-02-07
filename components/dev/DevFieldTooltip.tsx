import React, { useEffect, useState } from 'react';

export const DevFieldTooltip = () => {
    const [target, setTarget] = useState<HTMLElement | null>(null);
    const [tooltipInfo, setTooltipInfo] = useState<{ id?: string, name?: string, ariaLabel?: string } | null>(null);

    useEffect(() => {
        const handleFocus = (e: FocusEvent) => {
            const el = e.target as HTMLElement;
            // Also include buttons if needed, but primarily inputs for forms/calcs
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) {
                const id = el.id;
                const name = el.getAttribute('name');
                const ariaLabel = el.getAttribute('aria-label');

                if (id || name || ariaLabel) {
                    setTarget(el);
                    setTooltipInfo({ id, name: name || undefined, ariaLabel: ariaLabel || undefined });
                }
            }
        };

        const handleBlur = (e: FocusEvent) => {
            // Only clear if blurring the current target
            if (e.target === target) {
                setTarget(null);
                setTooltipInfo(null);
            }
        };

        // Using focusin/focusout for bubble/capture behavior support
        document.addEventListener('focusin', handleFocus);
        document.addEventListener('focusout', handleBlur);

        return () => {
            document.removeEventListener('focusin', handleFocus);
            document.removeEventListener('focusout', handleBlur);
        };
    }, [target]);

    if (!target || !tooltipInfo) return null;

    const rect = target.getBoundingClientRect();
    const topPosition = Math.max(0, rect.top - 45); // Ensure it doesn't go off-screen top
    const leftPosition = Math.max(0, rect.left); // Ensure it doesn't go off-screen left

    return (
        <div
            className="fixed z-[9999] pointer-events-none animate-fade-in"
            style={{
                top: topPosition,
                left: leftPosition,
            }}
        >
            <div className="bg-slate-900/95 backdrop-blur-sm px-3 py-2 rounded-lg border border-primary/30 shadow-[0_0_15px_rgba(0,0,0,0.5)] flex flex-col gap-0.5">
                <div className="flex items-center gap-2 border-b border-primary/20 pb-1 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Debug Info</span>
                </div>

                {tooltipInfo.id && (
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 uppercase font-bold w-4">ID:</span>
                        <span className="font-mono text-xs text-yellow-400 font-bold select-all">#{tooltipInfo.id}</span>
                    </div>
                )}

                {tooltipInfo.name && (
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 uppercase font-bold w-4">NM:</span>
                        <span className="font-mono text-xs text-blue-400 font-bold select-all">name="{tooltipInfo.name}"</span>
                    </div>
                )}

                {tooltipInfo.ariaLabel && (
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 uppercase font-bold w-4">LB:</span>
                        <span className="text-[10px] text-slate-300 italic">"{tooltipInfo.ariaLabel}"</span>
                    </div>
                )}

                {!tooltipInfo.id && !tooltipInfo.name && !tooltipInfo.ariaLabel && (
                    <span className="text-[10px] text-red-400 italic">Sem identificador</span>
                )}
            </div>
            {/* Little arrow pointing down */}
            <div
                className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-primary/30 mx-4 absolute -bottom-1.5"
            ></div>
        </div>
    );
};
