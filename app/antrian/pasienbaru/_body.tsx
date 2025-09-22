'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const Body = () => {
    const router = useRouter();

    const [kategoriPasien, setKategoriPasien] = useState('BPJS');
    const [nomorNik, setNomorNik] = useState('');
    // const [number, setNumber] = useState(0);
    const [type, setType] = useState('');
    const [labeling, setLabeling] = useState('Masukan Nomor BPJS');
    const [kirim, setKirim] = useState(false);
    const [selectedOption, setSelectedOption] = useState('');
    const [dokter, setDokter] = useState([]);
    const [selectedDokter, setSelectedDokter] = useState('');
    const [isShowButton, setShowButton] = useState(true);
    const [nama, setNama] = useState('');
    const [typeNama, setTypeNama] = useState(false);

    const handleType = (v: string) => {
        if (typeNama) {
            setNama(nama + v);
        } else {
            setType(type + v);
        }
    }

    const handleLabeling = (v: string) => {
        if (v == 'BPJS') {
            setLabeling('Masukan Nomor BPJS');
            setShowButton(true);
        } else {
            setLabeling('Masukan NIK');
            setShowButton(false);
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
        if (typeNama) {
            let types: string = nama.slice(0, nama.length - 1);
            setNama(types);
        } else {
            let types: string = type.slice(0, type.length - 1);
            setType(types);
        }
    }

    /**
     * Fetch kebutuhan data peserta
     */
    const fetchrequiredData = async (nomorkartu: string, kodepoli: string) => {
        const formData = new FormData();
        formData.append('nomorkartu', nomorkartu); // Tambahkan data form
        formData.append('kodepoli', kodepoli);

        try {
            const response = await fetch('http://192.168.1.202:8080/antrol/api/onsite?ceknokartu=1', {
                method: 'POST',
                body: formData,  // Kirim body dalam bentuk form-data
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json(); // Jika respons berupa JSON
            if (data.metaData.code == 200) {
                // setRequiredData(data.response);
                return data.response;
            } else {
                throw new Error(`Peringatan : ${data.metaData.message}`);
            }
            console.log(data);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleKirim = async () => {
        console.log('Kirim Data : ', type, nama, kategoriPasien, selectedOption, selectedDokter);
        // setKirim(true);


        const formData = new FormData();
        formData.append('nomorkartu', type); // Tambahkan data form
        formData.append('nama', nama);
        formData.append('kategori', kategoriPasien);
        formData.append('kodepoli', selectedOption);
        formData.append('kodedokter', selectedDokter);

        try {
            const response = await fetch('http://192.168.1.202:8080/antrol/api/pasienbaru_newnonjkn', {
                method: 'POST',
                body: formData,  // Kirim body dalam bentuk form-data
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const v = await response.json(); // Jika respons berupa JSON
            if (v.metadata.code == 200) {
                // setRequiredData(data.response);
                // return data.response;
                if(kategoriPasien != 'BPJS'){
                    const formData = new FormData();
                    formData.append('no_cm', v.response.norm);
                    formData.append('kodedokter', selectedDokter.split('@')[0]??'450599');
                    formData.append('jampraktek', selectedDokter.split('@')[1]??'07:00-23:00');
                    formData.append('kodepoli', selectedOption);
                    const response = await fetch('http://192.168.1.202:8080/antrol/api/onsite_nonjknv2', {
                        method: 'POST',
                        body: formData,  // Kirim body dalam bentuk form-data
                    });
                    console.log(response);
                    const vs = await response.json();
                    if (vs.metaData.code == 200) {
                        let nomorAntreanFormatted = "A-" + String(vs.response.nomorantrean).padStart(2, '0');
                        let queryparam = btoa(JSON.stringify({
                            'nomorantrean': nomorAntreanFormatted,
                            'namapoli':vs.response.namapoli,
                            "namadokter":vs.response.namadokter,
                            "sisakuotajkn":vs.response.sisakuotanonjkn
                        }));
                        router.push('/antrian/cetak?q='+queryparam);
                        // router.push({
                        //     pathname: '/antrian/cetak', 
                        //     query: {
                        //         nomorantrean: v.response.nomorantrean, namapoli: v.response.namapoli, namadokter: v.response.namadokter, sisakuotajkn: v.response.sisakuotajkn
                        //     }
                        // ,});
                    } else {
                        throw new Error(`Peringatan : ${v.metaData.message}`);
                    }
                    return;
                }
                const data = await fetchrequiredData(type, selectedOption);
                if (data) {
                    const formAntri = new FormData();
                    formAntri.append('kodepoli', selectedOption);
                    formAntri.append('nomorkartu', type);
                    formAntri.append('norm', data.norm);
                    formAntri.append('nik', data.nik);
                    formAntri.append('nohp', data.nohp);
                    formAntri.append('kodedokter', selectedDokter.split('@')[0]);
                    formAntri.append('jampraktek', selectedDokter.split('@')[1]);
                    formAntri.append('jeniskunjungan', data.jeniskunjungan);
                    formAntri.append('nomorreferensi', data.nomorreferensi);
                    const response = await fetch('http://192.168.1.202:8080/antrol/api/onsite?submit=1', {
                        method: 'POST',
                        body: formAntri,  // Kirim body dalam bentuk form-data
                    });
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const vs = await response.json(); // Jika respons berupa JSON
                    console.log(vs);

                    if (vs.metaData.code == 200) {
                        let nomorAntreanFormatted = "A-" + String(vs.response.nomorantrean).padStart(2, '0');

                        let queryparam = btoa(JSON.stringify({
                            'nomorantrean': nomorAntreanFormatted,
                            'namapoli': vs.response.namapoli,
                            "namadokter": vs.response.namadokter,
                            "sisakuotajkn": vs.response.sisakuotajkn
                        }));
                        router.push('/antrian/cetak?q=' + queryparam);
                        // router.push({
                        //     pathname: '/antrian/cetak', 
                        //     query: {
                        //         nomorantrean: v.response.nomorantrean, namapoli: v.response.namapoli, namadokter: v.response.namadokter, sisakuotajkn: v.response.sisakuotajkn
                        //     }
                        // ,});
                    } else {
                        throw new Error(`Peringatan : ${vs.metaData.message}`);
                    }
                }
            } else {
                throw new Error(`Peringatan : ${v.metaData.message}`);
            }
            console.log(v);
        } catch (error) {
            console.error('Error:', error);
        }
    }
    const handleSelectChange = (event: any) => {
        setSelectedOption(event.target.value);  // Update nilai yang dipilih
        fetch(`http://192.168.1.202:8080/antrol/api/onsite?cekdokter=1&val=${event.target.value}`)
            .then(response => response.json())
            .then(data => {
                // Handle data dari API
                if (data.metadata.code == 200) {
                    setDokter(data.response);
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    };
    /**
     * 
     * @param v Feth Poliklinik
     */
    const [poliklinikOptions, setPoliklinikOptions] = useState([]); // For storing API response

    // Function to handle API call for poliklinik options
    const fetchPoliklinik = async () => {
        try {
            const response = await fetch('http://192.168.1.202:8080/antrol/api/onsite?cekpoliklinik=1', {
                method: 'POST'
            });
            const data = await response.json();
            console.log(data);

            if (data.metaData.code === 200) {
                setPoliklinikOptions(data.response);
            } else {
                console.log('Failed to fetch poliklinik data');
            }
        } catch (error) {
            console.log('Error:', error);
        }
    };
    useEffect(() => {
        fetchPoliklinik();
    }, []);

    const handleSelectDokter = (event: any) => {
        setSelectedDokter(event.target.value);
    }

    const handleNama = (event: any) => {
        setNama(event);
    }

    const setFokus = (v: boolean) => {
        if (v) {
            setTypeNama(true);
        } else {
            setTypeNama(false);
        }
    }

    const handleCekPasien = () => {
        fetch(`http://192.168.1.202:8080/antrol/api/pasien/${type}`)
            .then(response => response.json())
            .then(data => {
                // Handle data dari API
                if (data.metaData.code == "200") {
                    setNama(data.response.peserta.nama);
                    // setNama(data.response.nama);
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }


    return (
        <div>
            <h4 className='fw-bold text-center'>ANTRIAN RSUD SIJUNJUNG</h4>
            <div className="py-2"></div>
            <div className="row px-4" style={{ minHeight: '65vh' }}>
                <div className=''>
                    <label className='text-secondary'>Pilih Kategori Peserta</label><br></br>
                    <div className='my-2'></div>
                    <div className="d-flex">
                        <button
                            style={{
                                width: '50%',
                                height: '3rem',
                                marginRight: '1rem',
                                fontWeight: 'bold',
                                color: kategoriPasien != 'BPJS' ? '#747877' : '',
                                backgroundColor: kategoriPasien == 'BPJS' ? '#007BFF' : '#F1F2F6',
                                border: kategoriPasien != 'BPJS' ? '2px solid #D5DBDA' : '',
                            }}
                            onClick={() => handleKategoriPasien('BPJS')} className={kategoriPasien == 'BPJS' ? "btn-primary btn" : "btn"}>Peserta BPJS</button>
                        <button
                            style={{
                                width: '50%',
                                height: '3rem',
                                fontWeight: 'bold',
                                color: kategoriPasien == 'BPJS' ? '#747877' : '',
                                backgroundColor: kategoriPasien != 'BPJS' ? '#007BFF' : '#F1F2F6',
                                border: kategoriPasien == 'BPJS' ? '2px solid #D5DBDA' : '',
                            }}
                            onClick={() => handleKategoriPasien('NON BPJS')} className={kategoriPasien != 'BPJS' ? "btn-primary btn" : "btn"}

                        >Peserta Non BPJS</button>
                    </div>
                </div>
                <div className="row my-2">
                    <div className='col'>
                        <label htmlFor="nomornik" className='text-secondary'>{labeling}</label>
                        <input style={{
                            height: '3rem',
                            fontSize: '1.5rem',
                            marginTop: '0.5rem',
                            backgroundColor: '#F1F2F6',
                        }} value={type} id="nomornik" autoFocus onFocus={(e) => setFokus(false)} type="text" onChange={(e) => handleType(e.target.value)} className="form-control" />
                    </div>
                    <div className='col-2'>
                        {isShowButton &&
                            <button
                                style={{
                                    marginTop: '2rem',
                                    height: '3rem',
                                    fontWeight: 'bold',
                                    backgroundColor: '#007BFF',
                                }}
                                onClick={() => handleCekPasien()} className={"btn-primary btn"}

                            >Cek Pasien</button>
                        }
                    </div>
                </div>
                <div className=''>
                    <label htmlFor="nama" className='text-secondary'>Nama</label>
                    <input style={{
                        height: '3rem',
                        fontSize: '1.5rem',
                        marginTop: '0.5rem',
                        backgroundColor: '#F1F2F6',
                    }} value={nama} id="nama" type="text" onFocus={(e) => setFokus(true)} onChange={(e) => handleNama(e.target.value)} className="form-control" />
                </div>
                <div className="row my-2">
                    <div className="col">
                        <div className=''>
                            <label htmlFor="poliklinik" className='text-secondary'>Pilih Poliklinik</label><br></br>
                            <select style={{
                                height: '3rem',
                                fontSize: '1rem',
                                marginTop: '0.5rem',
                                backgroundColor: '#F1F2F6',
                            }} id="poliklinik" className="form-control"
                                onChange={handleSelectChange}
                            >
                                <option value="">-- Pilih Poliklinik --</option>
                                {poliklinikOptions.map((poli) => (
                                    <option key={poli.poli_bpjs} value={poli.poli_bpjs}>
                                        {poli.nm_poli}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="col">
                        <div className=''>
                            <label htmlFor="dokter" className='text-secondary'>Pilih Dokter</label><br></br>
                            <select style={{
                                height: '3rem',
                                fontSize: '1rem',
                                marginTop: '0.5rem',
                                backgroundColor: '#F1F2F6',
                            }} id="dokter" className="form-control"
                                onChange={handleSelectDokter}
                            >
                                <option value="">-- Pilih dokter --</option>
                                {dokter.map((d) => (
                                    <option key={d.kodedokter} value={d.kodedokter + '@' + d.jadwal}>
                                        {d.namadokter} ({d.jadwal})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
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
                            <div className="d-flex" style={{
                                marginLeft: '5rem'
                            }}>
                                <button onClick={() => handleType(' ')} className="btn" style={{
                                    height: '4rem',
                                    margin: '0.1rem',
                                    width: '50rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>SPACE</button>
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