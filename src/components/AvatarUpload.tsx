import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import { Upload, X, User, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
    currentAvatarUrl?: string;
    userName: string;
    userId: string;
    onAvatarChange?: (url: string | null) => void;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function AvatarUpload({
    currentAvatarUrl,
    userName,
    userId,
    onAvatarChange,
    size = 'lg',
    className,
}: AvatarUploadProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { uploading, progress, uploadAvatar, deleteAvatar } = useAvatarUpload();

    const sizeClasses = {
        sm: 'h-16 w-16',
        md: 'h-24 w-24',
        lg: 'h-32 w-32',
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const handleFileSelect = async (file: File) => {
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload
        const url = await uploadAvatar(file, userId, userName);
        if (url && onAvatarChange) {
            onAvatarChange(url);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleRemove = async () => {
        const success = await deleteAvatar(userId);
        if (success) {
            setPreview(null);
            if (onAvatarChange) {
                onAvatarChange(null);
            }
        }
    };

    const displayUrl = preview || currentAvatarUrl;

    return (
        <div className={cn('space-y-4', className)}>
            {/* Avatar Preview */}
            <div className="flex flex-col items-center gap-4">
                <Avatar className={cn(sizeClasses[size], 'border-4 border-white dark:border-slate-800 shadow-xl')}>
                    <AvatarImage src={displayUrl || undefined} alt={userName} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-2xl font-bold">
                        {getInitials(userName)}
                    </AvatarFallback>
                </Avatar>

                {uploading && (
                    <div className="w-full max-w-xs space-y-2">
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-center text-muted-foreground">
                            Mengupload dan mengkompresi... {progress}%
                        </p>
                    </div>
                )}
            </div>

            {/* Upload Area */}
            <Card
                className={cn(
                    'border-2 border-dashed transition-all cursor-pointer hover:border-primary/50 hover:bg-accent/50',
                    isDragging && 'border-primary bg-accent',
                    uploading && 'opacity-50 pointer-events-none'
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
            >
                <div className="p-6 text-center space-y-3">
                    <div className="flex justify-center">
                        {isDragging ? (
                            <ImageIcon className="h-10 w-10 text-primary animate-bounce" />
                        ) : (
                            <Upload className="h-10 w-10 text-muted-foreground" />
                        )}
                    </div>
                    <div>
                        <p className="font-semibold">
                            {isDragging ? 'Lepaskan file di sini' : 'Klik atau drag foto ke sini'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Max 5MB • JPG, PNG, WebP
                        </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                        <ImageIcon className="h-3 w-3" />
                        <span>Foto akan dikompres otomatis ke ~100KB</span>
                    </div>
                </div>
            </Card>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
            />

            {/* Actions */}
            {displayUrl && !uploading && (
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1"
                    >
                        <Upload className="h-4 w-4 mr-2" />
                        Ganti Foto
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemove}
                        className="text-destructive hover:text-destructive"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Hapus
                    </Button>
                </div>
            )}
        </div>
    );
}
