import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link'; // Import Link dari Next.js untuk navigasi

const AntreanPrintFarmasi = () => {
  const [currentDate, setCurrentDate] = useState('');
  const searchParams = useSearchParams();
  const q = JSON.parse(atob(searchParams.get('q')));
  const nomorantrean = q['nomorantrean'];
  const namadokter = q['namadokter'] || '';
  const namapasien = q['namapasien'] || '';

  useEffect(() => {
    const now = new Date();

    // Format tanggal Indonesia: d M Y H:m:s
    const day = now.getDate();
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    const formattedDate = `${day} ${month} ${year} ${hours}:${minutes}:${seconds}`;
    setCurrentDate(formattedDate);

    window.print();
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '20px', fontFamily: 'Arial', position: 'relative' }}>
      {/* Tombol Kembali */}
      <Link href="http://192.168.1.139:3000/antrian" passHref>
        <button
          className="btn btn-primary"
          style={{ position: 'absolute', top: '20px', right: '20px' }}
        >
          Kembali
        </button>
      </Link>

      <h3>Fasilitas Kesehatan Tingkat Lanjut</h3>
      <h2>RSUD SIJUNJUNG</h2>
      <p>{currentDate}</p>
      <h1 style={{ margin: '20px 0', fontSize: '48px' }}>{nomorantrean}</h1>
      <h2 style={{ color: '#000', fontWeight: 'bold' }}>FARMASI</h2>
      {namapasien && <p style={{ color: '#000', fontSize: '14px', marginBottom: '10px' }}>{namapasien}</p>}
      {namadokter && <h3 style={{ color: '#6c757d' }}>Dokter Perujuk: {namadokter}</h3>}

      {/* CSS untuk menyembunyikan tombol saat mencetak */}
      <style jsx>{`
        @media print {
          .btn {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default AntreanPrintFarmasi;