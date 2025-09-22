'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

const Body: React.FC = () => {
    const router = useRouter();

    const handleRedirect = (path: string) => {
        router.push(path);
    };

    const handlePasienBaru = async () => {
        const response = await fetch('http://localhost:8000/adminantrian/v2/antrianadmisi', {
            method: 'GET',  // Kirim body dalam bentuk form-data
        });
        const vs = await response.json();
        if (vs.metadata.code == 200) {
            let nomorAntreanFormatted = "A-" + String(vs.response.noantrian).padStart(3, '0');
            
            let queryparam = btoa(JSON.stringify({
                'nomorantrean':nomorAntreanFormatted,
                'namapoli': '',
                "namadokter": '',
                "sisakuotajkn": ''
            }));
            router.push('/antrian/cetak?q=' + queryparam);
        }
    }
    return (
        <div>
            <a className='btn btn-primary float-end mx-4'
                href="http://192.168.1.139:8080/antrol/antrol/dashboard_antrian_admisi"
                target="_blank">
                Display Antrian Admisi
            </a>
            
            <h4 className='fw-bold text-center'>ANTRIAN RSUD SIJUNJUNG</h4>
            <div className="py-2"></div>
            
            <div className="d-flex px-4 justify-content-between">
                <div className="p-4"
                    // onClick={() => handleRedirect('/antrian/pasienbaru')}
                    onClick={() => handlePasienBaru()}
                    style={{
                        backgroundColor: '#F1F2F6',
                        border: '1px solid #E5E5E5',
                        borderRadius: 10,
                    }}>
                    <div style={{ paddingTop: 30, paddingLeft: 20, paddingRight: 20 }}>
                        <img src="/assets/images/illustrate/ILLUSTRASI PASIEN BARU.svg" width="150" alt="" />
                        <div className="my-4"></div>
                        <h4 className='fw-bold fs-2'>PASIEN BARU</h4>
                        <span className='text-secondary'>Untuk anda yang baru pertama kali mengunjungi rumah sakit dan tidak mempunyai nomor rekam medis sebelumnya.</span>
                    </div>
                </div>
                <div
                    onClick={() => handleRedirect('/antrian/pasienlamadebug')}
                    className="p-4 mx-4" style={{
                        backgroundColor: '#F1F2F6',
                        border: '1px solid #E5E5E5',
                        borderRadius: 10,
                    }}>
                    <div style={{ paddingTop: 30, paddingLeft: 20, paddingRight: 20 }}>
                        <img src="/assets/images/illustrate/ILLUSTRASI PASIEN LAMA.svg" width="150" alt="" />
                        <div className="my-4"></div>
                        <h4 className='fw-bold fs-2'>PASIEN LAMA</h4>
                        <span className='text-secondary'>Untuk  anda yang sudah terdaftar di rumah sakit dan sudah mempunyai nomor rekam medis.</span>
                    </div>
                </div>
                <div
                    onClick={() => handleRedirect('/antrian/checkin')}
                    className="p-4" style={{
                        backgroundColor: '#F1F2F6',
                        border: '1px solid #E5E5E5',
                        borderRadius: 10,
                    }}>
                    <div style={{ paddingTop: 30, paddingLeft: 20, paddingRight: 20 }}>
                        <img src="/assets/images/illustrate/ILLUSTRASI CHECKIN.svg" width="230" alt="" />
                        <div className="my-4"></div>
                        <h4 className='fw-bold fs-2'>CHECKIN M-JKN</h4>
                        <span className='text-secondary'>Untuk anda yang sudah mendaftar melalui aplikasi mobile JKN.</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Body;