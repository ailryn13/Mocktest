import { useEffect, useState } from 'react';

export default function ProctoringNotice({ violationCount }) {
    const [borderColor, setBorderColor] = useState('border-green-500');

    useEffect(() => {
        if (violationCount === 0) {
            setBorderColor('border-green-500');
        } else if (violationCount <= 2) {
            setBorderColor('border-yellow-500');
        } else {
            setBorderColor('border-red-500');
        }
    }, [violationCount]);

    return (
        <div className={`fixed bottom-6 right-6 prof-panel !rounded-xl p-4 border-2 ${borderColor} shadow-2xl z-50 backdrop-blur-md bg-slate-900/80`}>
            <div className="flex items-center gap-4">
                <div className={`status-indicator !w-2.5 !h-2.5 prof-pulse ${violationCount === 0 ? 'bg-emerald-500' : violationCount <= 2 ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                <div>
                    <p className="text-xs font-bold text-white uppercase tracking-widest leading-none">Security Status</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                        {violationCount === 0 ? 'Compliant' : `${violationCount} Violation(s) Reported`}
                    </p>
                </div>
            </div>
            {violationCount >= 3 && (
                <div className="mt-3 pt-3 border-t border-rose-500/20">
                    <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest leading-tight">
                        Critical Integrity Risk Detected
                    </p>
                </div>
            )}
        </div>
    );
}
