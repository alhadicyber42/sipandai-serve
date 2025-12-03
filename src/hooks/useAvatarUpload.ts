import { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseAvatarUploadReturn {
    uploading: boolean;
    progress: number;
    uploadAvatar: (file: File, userId: string, userName: string) => Promise<string | null>;
    deleteAvatar: (userId: string) => Promise<boolean>;
}

export function useAvatarUpload(): UseAvatarUploadReturn {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const uploadAvatar = async (file: File, userId: string, userName: string): Promise<string | null> => {
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

            // Get public URL with cache busting
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // Add timestamp for cache busting
            const publicUrlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

            setProgress(90);

            // Update avatar_url in profiles table
            console.log('Updating avatar_url for user:', userId, 'URL:', publicUrlWithCacheBust);
            
            // First, check if profile exists
            const { data: existingProfile, error: checkError } = await supabase
                .from('profiles')
                .select('id, avatar_url')
                .eq('id', userId)
                .maybeSingle();

            console.log('Existing profile check:', { existingProfile, checkError });

            let updateSuccess = false;

            if (existingProfile) {
                // Profile exists, update it
                const { data, error: updateError } = await supabase
                    .from('profiles')
                    .update({ avatar_url: publicUrlWithCacheBust })
                    .eq('id', userId)
                    .select('id, avatar_url');

                console.log('Update result:', { data, error: updateError });

                if (updateError) {
                    console.error('Update error:', updateError);
                    // Even if DB update fails, the file is uploaded - return URL anyway
                    toast.warning('Foto berhasil diupload, tetapi gagal menyimpan ke profil. Silakan coba lagi.');
                } else {
                    updateSuccess = true;
                }
            } else {
                // Profile doesn't exist, create it
                console.log('Profile not found, creating new profile...');
                const { data: insertData, error: insertError } = await supabase
                    .from('profiles')
                    .insert({
                        id: userId,
                        name: userName,
                        avatar_url: publicUrlWithCacheBust,
                        role: 'user_unit',
                        nip: '',
                    })
                    .select('id, avatar_url');

                console.log('Insert result:', { data: insertData, error: insertError });

                if (insertError) {
                    console.error('Insert error:', insertError);
                    toast.warning('Foto berhasil diupload, tetapi gagal membuat profil.');
                } else {
                    updateSuccess = true;
                }
            }

            // Verify the update was successful (optional - don't block on this)
            if (updateSuccess) {
                const { data: verifyData } = await supabase
                    .from('profiles')
                    .select('avatar_url')
                    .eq('id', userId)
                    .maybeSingle();

                console.log('Verification result:', verifyData);
            }

            // Store in localStorage as backup (in case DB update fails but file uploaded)
            try {
                localStorage.setItem(`avatar_url_${userId}`, publicUrlWithCacheBust);
                console.log('Avatar URL saved to localStorage as backup');
            } catch (e) {
                console.warn('Could not save to localStorage:', e);
            }

            setProgress(100);

            // Show compression info
            const originalSize = (file.size / 1024).toFixed(0);
            const compressedSize = (compressedFile.size / 1024).toFixed(0);
            const savings = ((1 - compressedFile.size / file.size) * 100).toFixed(0);

            if (updateSuccess) {
                toast.success(
                    `Foto berhasil diupload! (${originalSize}KB → ${compressedSize}KB, hemat ${savings}%)`
                );
            } else {
                toast.success(
                    `Foto berhasil diupload! (${originalSize}KB → ${compressedSize}KB)`
                );
            }

            return publicUrlWithCacheBust;
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
