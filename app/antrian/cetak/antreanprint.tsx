import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link'; // Import Link dari Next.js untuk navigasi

const AntreanPrint = () => {
  const [currentDate, setCurrentDate] = useState('');
  const searchParams = useSearchParams();
  const q = JSON.parse(atob(searchParams.get('q')));
  const nomorantrean = q['nomorantrean'];
  const namapoli = q['namapoli'];
  const namadokter = q['namadokter'];
  let sisakuotajkn: string = q['sisakuotajkn'].toString();

  useEffect(() => {
    const now = new Date();
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    setCurrentDate(now.toLocaleDateString('id-ID', options)); // Format dalam bahasa Indonesia
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
      <h2>{namapoli}</h2>
      <h3>{namadokter}</h3>
      <h4 style={{ margin: '30px 0' }}>{sisakuotajkn != '' ? 'Sisa Kuota ' + sisakuotajkn : ''}</h4>
      <p style={{ fontSize: '12px' }}>
        * Silakan mengambil nomor antrean baru, jika nomor antrean terlewatkan
      </p>

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

export default AntreanPrint;