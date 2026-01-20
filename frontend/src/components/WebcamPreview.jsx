import React from 'react';

export default function WebcamPreview({ videoRef, faceCount, detectedObjects, modelsLoaded, cameraStatus, headRotation }) {
    return (
        <div className="fixed bottom-6 left-6 z-50">
            <div className="prof-panel overflow-hidden border-2 border-indigo-500/20 shadow-2xl">
                {/* Video Preview */}
                <div className="relative">
                    {/* Camera Status Overlays */}
                    {cameraStatus === 'error' && (
                        <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-center p-4 z-10">
                            <span className="text-2xl mb-2">🚫</span>
                            <p className="text-rose-500 font-bold text-xs uppercase tracking-widest">Signal Error</p>
                            <p className="text-slate-500 text-[10px] leading-tight mt-2 px-2">
                                Access denied. Please verify permissions in system settings.
                            </p>
                        </div>
                    )}

                    {cameraStatus === 'loading' && (
                        <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-center z-10">
                            <div className="prof-spinner mb-3"></div>
                            <p className="text-indigo-400 font-bold text-[10px] uppercase tracking-widest">Initializing Optic...</p>
                        </div>
                    )}

                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-56 h-40 object-cover grayscale opacity-80"
                    />

                    {/* Status Overlay */}
                    <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                        {/* AI Status */}
                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter ${modelsLoaded ? 'bg-indigo-600' : 'bg-slate-700'
                            } text-white shadow-lg`}>
                            {modelsLoaded ? 'AI ACTIVE' : 'SYSTEM IDLE'}
                        </div>

                        {/* Face Count */}
                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter ${faceCount === 1 ? 'bg-indigo-600' :
                            faceCount === 0 ? 'bg-rose-600' : 'bg-amber-600'
                            } text-white shadow-lg`}>
                            {faceCount === 0 ? 'NO SIGNAL' :
                                faceCount === 1 ? 'LOCKED' :
                                    'MULTIPLE'}
                        </div>
                    </div>

                    {/* HEAD ROTATION WARNING */}
                    {headRotation && (
                        <div className="absolute inset-0 bg-rose-600/20 backdrop-blur-[1px] flex items-center justify-center z-20">
                            <div className="bg-rose-600 text-white px-3 py-1.5 rounded font-bold text-[10px] uppercase tracking-widest shadow-xl animate-pulse border border-white/20">
                                Maintain Forward Focus
                            </div>
                        </div>
                    )}
                </div>

                {/* Info Bar */}
                <div className="bg-slate-900 px-3 py-1.5 flex items-center justify-between border-t border-white/5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Secure Feed</span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-tighter">Encrypted</span>
                        <div className="status-indicator status-active !w-1.5 !h-1.5 prof-pulse"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
