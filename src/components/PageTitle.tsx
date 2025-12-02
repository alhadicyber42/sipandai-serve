/**
 * Page Title Component
 * Dynamic page title untuk SEO dan UX
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES: Record<string, string> = {
  '/': 'SIPANDAI - Sistem Pelayanan Administrasi Digital ASN',
  '/auth': 'Masuk - SIPANDAI',
  '/dashboard': 'Dashboard - SIPANDAI',
  '/profile': 'Profil - SIPANDAI',
  '/layanan/kenaikan-pangkat': 'Kenaikan Pangkat - SIPANDAI',
  '/layanan/mutasi': 'Mutasi Pegawai - SIPANDAI',
  '/layanan/pensiun': 'Pensiun - SIPANDAI',
  '/layanan/cuti': 'Cuti Pegawai - SIPANDAI',
  '/konsultasi/baru': 'Buat Konsultasi - SIPANDAI',
  '/konsultasi/riwayat': 'Riwayat Konsultasi - SIPANDAI',
  '/employee-of-the-month': 'Employee of The Month - SIPANDAI',
  '/pengumuman': 'Pengumuman - SIPANDAI',
  '/privacy': 'Kebijakan Privasi - SIPANDAI',
};

const DEFAULT_TITLE = 'SIPANDAI - Sistem Pelayanan Administrasi Digital ASN';

export function PageTitle() {
  const location = useLocation();

  useEffect(() => {
    const title = PAGE_TITLES[location.pathname] || DEFAULT_TITLE;
    document.title = title;

    // Update meta description untuk SEO
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', title);
    }
  }, [location.pathname]);

  return null;
}

