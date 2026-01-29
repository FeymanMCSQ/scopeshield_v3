'use client';

import { useState, useEffect } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

export function TicketForm() {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFile = (file: File) => {
        // basic validation
        if (!file.type.startsWith('image/')) return;
        if (file.size > 5 * 1024 * 1024) {
            alert('File too large (max 5MB)');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            if (result) setPreviewUrl(result);
        };
        reader.readAsDataURL(file);
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handlePaste = (e: ClipboardEvent) => {
        if (!e.clipboardData) return;
        const items = e.clipboardData.items;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) handleFile(blob);
                break;
            }
        }
    };

    useEffect(() => {
        document.addEventListener('paste', handlePaste);
        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, []);

    return (
        <form action="/api/dashboard/tickets/create" method="POST" className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-emerald-900/80 mb-2">Request Description</label>
                <textarea
                    name="description"
                    required
                    placeholder="e.g. Change the header color to blue..."
                    className="w-full min-h-[120px] p-3 border border-emerald-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white placeholder:text-gray-400 font-sans"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-emerald-900/80 mb-2">Price (USD)</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                        type="number"
                        name="price"
                        required
                        min="0.50"
                        step="0.01"
                        placeholder="35.00"
                        className="w-full pl-7 p-3 border border-emerald-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white placeholder:text-gray-400"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-emerald-900/80 mb-2">Screenshot (Optional)</label>
                <div className="border-2 border-dashed border-emerald-100 rounded-xl p-8 text-center bg-gray-50 hover:bg-emerald-50/50 transition-colors group">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={onFileChange}
                        className="hidden"
                        id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center">
                        <div className="h-10 w-10 bg-white rounded-lg border border-emerald-100 flex items-center justify-center mb-3 text-emerald-600 group-hover:scale-110 transition-transform shadow-sm">
                            <Upload className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-emerald-900">Click to upload</span>
                        <p className="text-xs text-emerald-900/40 mt-1">
                            or paste image (Ctrl+V) directly
                        </p>
                    </label>
                </div>

                {previewUrl && (
                    <div className="mt-4 relative inline-block">
                        <img
                            src={previewUrl}
                            alt="Preview"
                            className="max-h-[300px] rounded-lg border border-emerald-100 shadow-sm"
                        />
                        <button
                            type="button"
                            onClick={() => setPreviewUrl(null)}
                            className="absolute -top-2 -right-2 bg-white text-emerald-900 rounded-full p-1 shadow-md border border-emerald-100 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                <input type="hidden" name="assetUrl" value={previewUrl || ''} />
            </div>

            <button
                type="submit"
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
            >
                Create Ticket
            </button>
        </form>
    );
}
