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

            // Update avatar_url in profiles table using upsert for reliability
            console.log('Updating avatar_url for user:', userId, 'URL:', publicUrlWithCacheBust);
            
            const { data, error: updateError } = await supabase
                .from('profiles')
                .update({ 
                    avatar_url: publicUrlWithCacheBust,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)
                .select('id, avatar_url');

            console.log('Update result:', { data, error: updateError });

            if (updateError) {
                console.error('Update error:', updateError);
                // Try upsert as fallback
                console.log('Trying upsert as fallback...');
                const { data: upsertData, error: upsertError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: userId,
                        name: userName,
                        avatar_url: publicUrlWithCacheBust,
                        role: 'user_unit',
                        nip: '', // Required field, using placeholder
                    }, { onConflict: 'id' })
                    .select('id, avatar_url');

                console.log('Upsert result:', { data: upsertData, error: upsertError });

                if (upsertError) {
                    console.error('Upsert error:', upsertError);
                    toast.error('Gagal menyimpan URL foto ke database');
                    return null;
                }
            }

            // Verify the update was successful
            const { data: verifyData, error: verifyError } = await supabase
                .from('profiles')
                .select('avatar_url')
                .eq('id', userId)
                .single();

            console.log('Verification result:', { data: verifyData, error: verifyError });

            if (verifyError || !verifyData?.avatar_url) {
                console.error('Avatar URL not saved properly:', verifyError);
                toast.error('URL foto tidak tersimpan dengan benar');
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
