'use client';
import React, { useState } from 'react';
import Swal from 'sweetalert2'
import { useRouter } from 'next/navigation';

const Body = () => {

    const [kategoriPasien, setKategoriPasien] = useState('BPJS');
    const [nomorNik, setNomorNik] = useState('');
    // const [number, setNumber] = useState(0);
    const [type, setType] = useState('');
    const [labeling, setLabeling] = useState('Masukan kode booking yang didapat dari M-JKN/No.RM');
    const [kirim, setKirim] = useState(false);
    const router = useRouter();

    const handleType = (v: string) => {
        setType(type + v);
    }

    const handleLabeling = (v: string) => {
        if (v == 'BPJS') {
            setLabeling('Masukan Nomor NIK / Nomor BPJS');
        } else {
            setLabeling('Masukan Nomor NIK');
        }
    }

    const handleKategoriPasien = (kategori: string) => {
        setKategoriPasien(kategori);
        handleLabeling(kategori);
    }

    const handleNomorNik = (nik: string) => {
        setNomorNik(nik);
    }

    const handleBackspace = () => {
        let types: string = type.slice(0, type.length - 1);
        setType(types);
    }

    const handleKirim = async () => {
        // ketika di submit, mengecek ke database, apakah tersedia? jika tersedia resep maka cetak antrian dengan
        // format F-0{nourut}
        const formData = new FormData();
        formData.append('kodebooking', type);
        const timestamp: number = Date.now();
        formData.append('waktu', timestamp);
        const response = await fetch('http://192.168.1.139:8080/antrol/api/checkinantrianfarmasi/' + type, {
            method: 'GET'
        });
        // console.log(response);
        const v = await response.json();
        // console.log(v);
        if(v == null){
            Swal.fire({
                            title: 'Error!',
                            text: "Pastikan Masukan Nomor Dengan Benar",
                            icon: 'error',
                            confirmButtonText: 'Ok'
                          })
                return;
        }
        const response2 = await fetch('http://localhost:8000/adminantrian/v2/antrianfarmasi/' + type, {
            method: 'GET'
        });
        // console.log(response);
        // const v2 = await response2.json();
        const vs2 = await response2.json();
        if (vs2.metadata.code == 200) {
            let nomorAntreanFormatted = "F-" + String(vs2.response.noantrian).padStart(3, '0');
            
            let queryparam = btoa(JSON.stringify({
                'nomorantrean':nomorAntreanFormatted,
                'namapoli': '',
                "namadokter": '',
                "sisakuotajkn": ''
            }));
            router.push('/antrian/cetak?q=' + queryparam);
        }


        return;

        // const formData = new FormData();
        //     formData.append('kodebooking', type);
        //     const timestamp: number = Date.now();
        //     formData.append('waktu', timestamp);
        //     const response = await fetch('http://192.168.1.202:8080/antrol/api/checkinantrian', {
        //         method: 'POST',
        //         body: formData,  // Kirim body dalam bentuk form-data
        //     });
        //     // console.log(response);
        //     const v = await response.json();
        //     console.log(v);
        //     if (v.metadata.code == 200) {
        //         Swal.fire({
        //             title: 'Berhasil!',
        //             text: v.metadata.message,
        //             icon: 'success',
        //             confirmButtonText: 'Ok'
        //           })
        //     } else {
        //         Swal.fire({
        //             title: 'Error!',
        //             text: v.metadata.message,
        //             icon: 'error',
        //             confirmButtonText: 'Ok'
        //           })
        //         throw new Error(`Peringatan : ${v.metadata.message}`);
        //     }
    }


    return (
        <div>
            <h4 className='fw-bold text-center'>ANTRIAN FARMASI RSUD SIJUNJUNG</h4>
            <div className="py-2"></div>
            <div className="row px-4" style={{ minHeight: '65vh' }}>
                <div className='my-4'>
                    <label htmlFor="nomornik" className='text-secondary'>{labeling}</label>
                    <input style={{
                        height: '3rem',
                        fontSize: '1.5rem',
                        marginTop: '0.5rem',
                        backgroundColor: '#F1F2F6',
                    }} value={type} id="nomornik" autoFocus type="text" onChange={(e) => handleType(e.target.value)} className="form-control" />
                </div>
                <div className="col ">

                    <div className="d-flex justify-content-between">
                        <div className=''>
                            <div className="d-flex">
                                <button onClick={() => handleType('1')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>1</button>
                                <button onClick={() => handleType('2')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>2</button>
                                <button onClick={() => handleType('3')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>3</button>
                                <button onClick={() => handleType('4')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>4</button>
                                <button onClick={() => handleType('5')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>5</button>
                                <button onClick={() => handleType('6')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>6</button>
                                <button onClick={() => handleType('7')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>7</button>
                                <button onClick={() => handleType('8')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>8</button>
                                <button onClick={() => handleType('9')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>9</button>
                                <button onClick={() => handleType('0')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>0</button>
                                <button onClick={() => handleBackspace()} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#E45353',
                                    color: 'white',
                                    border: '2px solid #E45353',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>{'<'}</button>
                            </div>
                            <div className="d-flex" style={{
                                marginLeft: '2.5rem'
                            }}>
                                <button onClick={() => handleType('Q')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>Q</button>
                                <button onClick={() => handleType('W')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>W</button>
                                <button onClick={() => handleType('E')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>E</button>
                                <button onClick={() => handleType('R')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>R</button>
                                <button onClick={() => handleType('T')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>T</button>
                                <button onClick={() => handleType('Y')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>Y</button>
                                <button onClick={() => handleType('U')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>U</button>
                                <button onClick={() => handleType('I')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>I</button>
                                <button onClick={() => handleType('O')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>O</button>
                                <button onClick={() => handleType('P')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>P</button>

                            </div>
                            <div className="d-flex" style={{
                                marginLeft: '5rem'
                            }}>
                                <button onClick={() => handleType('A')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>A</button>
                                <button onClick={() => handleType('S')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>S</button>
                                <button onClick={() => handleType('D')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>D</button>
                                <button onClick={() => handleType('F')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>F</button>
                                <button onClick={() => handleType('G')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>G</button>
                                <button onClick={() => handleType('H')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>H</button>
                                <button onClick={() => handleType('J')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>J</button>
                                <button onClick={() => handleType('K')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>K</button>
                                <button onClick={() => handleType('L')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>L</button>
                            </div>
                            <div className="d-flex" style={{
                                marginLeft: '5rem'
                            }}>
                                <button className="" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: 'transparent',
                                    border: 'transparent',
                                    fontSize: '2rem'
                                }}></button>
                                <button onClick={() => handleType('Z')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>Z</button>
                                <button onClick={() => handleType('X')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>X</button>
                                <button onClick={() => handleType('C')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>C</button>
                                <button onClick={() => handleType('V')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>V</button>
                                <button onClick={() => handleType('B')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>B</button>
                                <button onClick={() => handleType('N')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>N</button>
                                <button onClick={() => handleType('M')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>M</button>
                                <button className="" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '5rem',
                                    backgroundColor: 'transparent',
                                    border: 'transparent',
                                    fontSize: '2rem'
                                }}></button>
                            </div>

                        </div>
                        <div className='d-flex align-items-end flex-column justify-content-center'>
                            <button className="btn btn-lg btn-danger" style={{
                                width: '15rem',
                                height: '5rem',
                                border: '2px solid #E45353',
                                color: '#E45353',
                                backgroundColor: 'transparent',
                                fontWeight: 'bold'
                            }}
                                onClick={() => window.history.back()}
                            >
                                KEMBALI
                            </button>
                            <div className='py-2'></div>
                            <button className="btn btn-primary" style={{
                                width: '15rem',
                                height: '5rem',
                                fontWeight: 'bold'
                            }}
                                onClick={() => handleKirim()}
                            >
                                LANJUTKAN
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Body;