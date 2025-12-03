import { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseAvatarUploadReturn {
    uploading: boolean;
    progress: number;
    uploadAvatar: (file: File, userId: string) => Promise<string | null>;
    deleteAvatar: (userId: string) => Promise<boolean>;
}

export function useAvatarUpload(): UseAvatarUploadReturn {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const uploadAvatar = async (file: File, userId: string): Promise<string | null> => {
        try {
            setUploading(true);
            setProgress(0);

            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('File harus berupa gambar');
                return null;
            }

            // Validate file size (max 5MB before compression)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Ukuran file maksimal 5MB');
                return null;
            }

            setProgress(20);

            // Compress image
            const compressionOptions = {
                maxSizeMB: 0.1, // 100KB
                maxWidthOrHeight: 400,
                useWebWorker: true,
                fileType: 'image/webp',
                initialQuality: 0.8,
            };

            const compressedFile = await imageCompression(file, compressionOptions);

            setProgress(50);

            // Upload to Supabase Storage
            const fileName = `avatar.webp`;
            const filePath = `${userId}/${fileName}`;

            // Delete old avatar if exists
            await supabase.storage.from('avatars').remove([filePath]);

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, compressedFile, {
                    cacheControl: '3600',
                    upsert: true,
                });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                toast.error('Gagal mengupload foto');
                return null;
            }

            setProgress(80);

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setProgress(90);

            // Update avatar_url in profiles table
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', userId);

            if (updateError) {
                console.error('Update error:', updateError);
                toast.error('Gagal menyimpan URL foto');
                return null;
            }

            setProgress(100);

            // Show compression info
            const originalSize = (file.size / 1024).toFixed(0);
            const compressedSize = (compressedFile.size / 1024).toFixed(0);
            const savings = ((1 - compressedFile.size / file.size) * 100).toFixed(0);

            toast.success(
                `Foto berhasil diupload! (${originalSize}KB → ${compressedSize}KB, hemat ${savings}%)`
            );

            return publicUrl;
        } catch (error) {
            console.error('Avatar upload error:', error);
            toast.error('Terjadi kesalahan saat mengupload foto');
            return null;
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    const deleteAvatar = async (userId: string): Promise<boolean> => {
        try {
            setUploading(true);

            const filePath = `${userId}/avatar.webp`;

            // Delete from storage
            const { error: deleteError } = await supabase.storage
                .from('avatars')
                .remove([filePath]);

            if (deleteError) {
                console.error('Delete error:', deleteError);
                toast.error('Gagal menghapus foto');
                return false;
            }

            // Update avatar_url in profiles table
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: null })
                .eq('id', userId);

            if (updateError) {
                console.error('Update error:', updateError);
                toast.error('Gagal memperbarui profil');
                return false;
            }

            toast.success('Foto profil berhasil dihapus');
            return true;
        } catch (error) {
            console.error('Avatar delete error:', error);
            toast.error('Terjadi kesalahan saat menghapus foto');
            return false;
        } finally {
            setUploading(false);
        }
    };

    return {
        uploading,
        progress,
        uploadAvatar,
        deleteAvatar,
    };
}
