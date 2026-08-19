import React from "react";
import { ShieldAlert } from "lucide-react";

/**
 * Premium placeholder for HRMS modules that are currently in development.
 */
export const HRMSUnderConstruction = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-10 text-center bg-white rounded-3xl m-6 border border-slate-100 shadow-sm">
        <div className="bg-indigo-50 p-8 rounded-full mb-8 border-4 border-white shadow-xl shadow-indigo-500/10">
            <ShieldAlert className="size-20 text-indigo-500" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight italic uppercase tracking-wider">Module Under Construction</h1>
        <p className="text-slate-500 max-w-sm text-lg leading-relaxed mb-8">
            Our team is currently building this HRMS sub-module. It will be available in the next release.
        </p>
        <button 
            onClick={() => window.history.back()} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-10 rounded-2xl transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
        >
            Go Back
        </button>
    </div>
);
