/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useRef } from 'react';
import { ImageIcon, XCircle, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BannerImageUploaderProps {
    imageUrl: string | null;
    onChange: (url: string | null) => void;
}

export function BannerImageUploader({ imageUrl, onChange }: BannerImageUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/upload?filename=${encodeURIComponent(file.name)}&type=banner`,
                { method: 'POST', body: file }
            );

            if (!response.ok) throw new Error('Error al subir la imagen');
            const blob = await response.json();
            onChange(blob.url);
        } catch (err) {
            setError('No se pudo subir la imagen. Intentá nuevamente.');
            console.error(err);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-2">
            {/* Área de preview o de drop */}
            <div
                className={cn(
                    'relative w-full aspect-[2/1] rounded-xl border-2 overflow-hidden transition-colors',
                    imageUrl
                        ? 'border-primary/30 bg-muted/20'
                        : 'border-dashed border-muted-foreground/30 bg-muted/10 hover:border-primary/50 cursor-pointer'
                )}
                onClick={() => !imageUrl && !uploading && fileInputRef.current?.click()}
            >
                {imageUrl ? (
                    <>
                        <img
                            src={imageUrl}
                            alt="Preview del banner"
                            className="w-full h-full object-cover"
                        />
                        {/* Botón para eliminar */}
                        <button
                            type="button"
                            onClick={() => onChange(null)}
                            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                            title="Eliminar imagen"
                        >
                            <XCircle className="w-4 h-4" />
                        </button>
                    </>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        {uploading ? (
                            <>
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <span className="text-sm">Subiendo imagen...</span>
                            </>
                        ) : (
                            <>
                                <ImageIcon className="w-8 h-8" />
                                <span className="text-sm font-medium">Hacé click para subir una imagen</span>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Guía de tamaño */}
            <p className="text-xs text-muted-foreground">
                📐 Tamaño recomendado: <strong>1200×600px</strong> (relación 2:1). Se recortará automáticamente desde el centro.
                Formato JPG o PNG, máx. 1.5 MB.
            </p>

            {/* Botón alternativo (si ya hay imagen, permite reemplazarla) */}
            {imageUrl && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="gap-2"
                >
                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    Reemplazar imagen
                </Button>
            )}

            {/* Error */}
            {error && <p className="text-xs text-destructive">{error}</p>}

            {/* Input oculto */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
            />
        </div>
    );
}
