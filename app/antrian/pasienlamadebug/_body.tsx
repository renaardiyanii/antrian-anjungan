'use client'
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2'


// NEXT_PUBLIC_SIMRS='http://192.168.56.102/'
const Body = () => {
    const router = useRouter();
    const [kategoriPasien, setKategoriPasien] = useState('BPJS');
    const [nomorNik, setNomorNik] = useState('');
    const [number, setNumber] = useState(0);
    const [labeling, setLabeling] = useState('Masukan Nomor BPJS / NIK');
    const [kirim, setKirim] = useState(false);
    const [selectedOption, setSelectedOption] = useState('');
    const [dokter, setDokter] = useState([]);
    const [selectedDokter, setSelectedDokter] = useState('');
    const [requiredData, setRequiredData] = useState({});
    const [isDisablePoli, setIsDisablePoli] = useState(false);
    const [nomorRujukan, setNomorRujukan] = useState('');
    const [selectedRujukan, setSelectedRujukan] = useState(null);

    const handleSelectDokter = (event: any) => {
        setSelectedDokter(event.target.value);
    }
    // Fungsi yang dijalankan ketika option dipilih
    const handleSelectChange = (event: any) => {
        console.error('Selected option:', event.target.value); // Log nilai yang dipilih
        setSelectedOption(event.target.value);  // Update nilai yang dipilih
        fetch(`${process.env.NEXT_PUBLIC_SIMRS}/antrol/api/onsite?cekdokter=1&val=${event.target.value.split("#")[1]}`)
            .then(response => response.json())
            .then(data => {
                // Handle data dari API
                if (data.metadata.code == 200) {
                    setDokter(data.response);
                }
            })
            .catch(error => {

                // console.error('Error fetching data:', error);
            });
    };

    const handleSelectChangeAuto = (event: any) => {
        setSelectedOption(event);  // Update nilai yang dipilih
        fetch(`${process.env.NEXT_PUBLIC_SIMRS}/antrol/api/onsite?cekdokter=1&val=${event}`)
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

    // Handle Rujukan yang lebih dari 2 dan masih dalam batas waktu 3 bulan
    const handleRujukan = (event: any) => {
        // console.log(event.target.value);
        setSelectedOption(event.target.value);  // Update nilai yang dipilih
        fetch(`${process.env.NEXT_PUBLIC_SIMRS}/antrol/api/onsite?getrujukan=1&val=${event.target.value}`)
            .then(response => response.json())
            .then(data => {
                // Handle data dari API
                if (data.metadata.code == 200) {
                    console.log(data.response);
                    // setDokter(data.response);
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    };

    // --- FUNGSI BARU: Untuk mengecek rujukan dan menampilkan modal ---
    const handleCekRujukan = async () => {
        if (!nomorNik) {
            Swal.fire('Peringatan', 'Silakan masukkan Nomor BPJS/NIK terlebih dahulu.', 'warning');
            return;
        }

        Swal.fire({
            title: 'Mencari data rujukan...',
            didOpen: () => {
                Swal.showLoading();
            },
            allowOutsideClick: false
        });

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SIMRS}/antrol/api/onsitedebug?getrujukan=1&val=${nomorNik}`);
            const data = await response.json();

            if (data.metaData.code === 200 && data.response.rujukan && data.response.rujukan.length > 0) {
                Swal.close();
                const rujukanList = data.response.rujukan;

                // Membuat HTML untuk tabel di dalam modal
                const tableHtml = `
                    <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                        <table class="table table-hover table-bordered text-start">
                            <thead class="table-light" style="position: sticky; top: 0;">
                                <tr>
                                    <th>No.</th>
                                    <th>No. Rujukan</th>
                                    <th>Tgl. Rujukan</th>
                                    <th>Poli Tujuan</th>
                                    <th>Diagnosa</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rujukanList.map((rujukan, index) => `
                                    <tr>
                                        <td>${index + 1}</td>
                                        <td>${rujukan.noKunjungan}</td>
                                        <td>${rujukan.tglKunjungan}</td>
                                        <td>${rujukan.poliRujukan.nama}</td>
                                        <td>${rujukan.diagnosa.nama}</td>
                                        <td>
                                            <button class="btn btn-primary btn-sm btn-pilih-rujukan" data-nokunjungan="${rujukan.noKunjungan}" data-kodepoli="${rujukan.poliRujukan.kode}">Pilih</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;

                Swal.fire({
                    title: '<strong>Data Rujukan Ditemukan</strong>',
                    html: tableHtml,
                    width: '80%',
                    showConfirmButton: false,
                    showCloseButton: true,
                    didOpen: () => {
                        // Menambahkan event listener ke setiap tombol "Pilih"
                        document.querySelectorAll('.btn-pilih-rujukan').forEach(button => {
                            button.addEventListener('click', (e) => {
                                const noKunjungan = e.currentTarget.getAttribute('data-nokunjungan');
                                const kodePoli = e.currentTarget.getAttribute('data-kodepoli');
                                // handlePilihRujukan(noKunjungan, kodePoli);
                                // Cari objek rujukan lengkap dari rujukanList
                                const rujukanTerpilih = rujukanList.find(r => r.noKunjungan === noKunjungan);
                                if (rujukanTerpilih) {
                                    handlePilihRujukan(rujukanTerpilih); // Kirim seluruh objek
                                }
                            });
                        });
                    }
                });

            } else {
                Swal.fire('Informasi', 'Data rujukan tidak ditemukan atau sudah tidak berlaku.', 'info');
            }
        } catch (error) {
            console.error('Error fetching rujukan data:', error);
            Swal.fire('Error', 'Gagal mengambil data rujukan.', 'error');
        }
    };

    // --- FUNGSI BARU: Dipanggil saat rujukan di modal dipilih ---
    // const handlePilihRujukan = (noKunjungan, kodePoli) => {
    //     setNomorRujukan(noKunjungan); // Mengisi field rujukan baru
    //     setSelectedOption(kodePoli);  // Auto-select poliklinik
    //     handleSelectChangeAuto(kodePoli); // Auto-fetch dokter untuk poli tersebut
    //     setIsDisablePoli(true); // Nonaktifkan pilihan poli
    //     Swal.close(); // Tutup modal
    //     Swal.fire('Sukses', `Rujukan ${noKunjungan} telah dipilih.`, 'success');
    // };
    const handlePilihRujukan = (rujukan:any) => {
        // Sekarang Anda memiliki akses ke semua data rujukan
        console.log('Data rujukan yang dipilih:', rujukan); 
    
        setSelectedRujukan(rujukan); // <-- Simpan seluruh objek rujukan
        setNomorRujukan(rujukan.noKunjungan); // Mengisi field nomor rujukan
        setSelectedOption(rujukan.poliRujukan.kode);  // Auto-select poliklinik
        handleSelectChangeAuto(rujukan.poliRujukan.kode); // Auto-fetch dokter untuk poli tersebut
        setIsDisablePoli(true); // Nonaktifkan pilihan poli
        Swal.close(); // Tutup modal
        Swal.fire('Sukses', `Rujukan ${rujukan.noKunjungan} telah dipilih.`, 'success');
    };

    // Ambil rujukan dan jumlah sep ( otomatiskan rujukan. )
    const fetchDataPasien = async (nomorkartu: string) => {
        const formData = new FormData();
        formData.append('nomorkartu', nomorkartu);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SIMRS}/antrol/api/onsite?cekpasien=1`, {
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
    }

    /**
     * Fetch kebutuhan data peserta
     */
    const fetchrequiredData = async (nomorkartu: string, kodepoli: string) => {
        const formData = new FormData();
        formData.append('nomorkartu', nomorkartu); // Tambahkan data form
        formData.append('kodepoli', kodepoli);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SIMRS}/antrol/api/onsite?ceknokartu=1`, {
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

    const fetchRequiredDataRujukan = async (nomorKartu: string, kodePoli: string,rujukan: any) => {
        const formData = new FormData();
        formData.append('nomorkartu', nomorKartu); // Tambahkan data form
        formData.append('kodepoli', kodePoli);
        formData.append('rujukan', JSON.stringify(rujukan)); // Tambahkan nomor rujukan jika diperlukan

        // TODO: disini pengecekan untuk memilih dahulu poliklinik
        // end
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SIMRS}/antrol/api/onsitedebug?ceknokarturujukan=1`, {
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
    }

    /**
     * 
     * @param v Feth Poliklinik
     */
    const [poliklinikOptions, setPoliklinikOptions] = useState([]); // For storing API response

    // Function to handle API call for poliklinik options
    const fetchPoliklinik = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SIMRS}/antrol/api/onsite?cekpoliklinik=1`, {
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

    // useEffect(() => {
    //     fetchPoliklinik(); // Fetch poliklinik options when component mounts
    // }, []);
    useEffect(() => {
        fetchPoliklinik();
    }, []);

    const handleLabeling = (v: string) => {
        if (v == 'BPJS') {
            setLabeling('Masukan Nomor BPJS / NIK');
        } else {
            setLabeling('Masukan Nomor RM');
        }
    }

    const handleKategoriPasien = (kategori: string) => {
        setKategoriPasien(kategori);
        handleLabeling(kategori);
    }

    const handleNomorNik = (nik: string) => {
        setNomorNik(nik);
    }

    const handleNumber = (v: number) => {
        setNumber(v);
        let nik: string = nomorNik + v.toString();
        setNomorNik(nik);
    }

    const handleBackspace = () => {
        let nik: string = nomorNik.slice(0, nomorNik.length - 1);
        setNomorNik(nik);
    }

    const handleKirim = async () => {

        // console.log(process.env.NEXT_PUBLIC_SIMRS);

        // check if selected poli is null. then check rujukan peserta
        if (selectedOption == '') {
            const data = await fetchDataPasien(nomorNik);
            if (data.kodepoli) {
                handleSelectChangeAuto(data.kodepoli.kode);
            }
            if (data.jeniskunjungan == 1 || data.jeniskunjungan == 4) {
                setIsDisablePoli(true);

            }
            return;
        }

        // console.log(kategoriPasien);
        if (kategoriPasien == 'NON BPJS') {
            const formData = new FormData();
            formData.append('no_cm', nomorNik)
            formData.append('kodedokter', selectedDokter.split('@')[0] ?? '450599');
            formData.append('jampraktek', selectedDokter.split('@')[1] ?? '07:00-23:00');
            formData.append('kodepoli', selectedOption);
            const response = await fetch(`${process.env.NEXT_PUBLIC_SIMRS}/antrol/api/onsite_nonjknv2`, {
                method: 'POST',
                body: formData,  // Kirim body dalam bentuk form-data
            });
            console.log(response);
            const v = await response.json();
            if (v.metaData.code == 200) {
                let queryparam = btoa(JSON.stringify({
                    'nomorantrean': v.response.nomorantrean,
                    'namapoli': v.response.namapoli,
                    "namadokter": v.response.namadokter,
                    "sisakuotajkn": v.response.sisakuotanonjkn
                }));
                router.push('/antrian/cetak?q=' + queryparam);
                // router.push({
                //     pathname: '/antrian/cetak', 
                //     query: {
                //         nomorantrean: v.response.nomorantrean, namapoli: v.response.namapoli, namadokter: v.response.namadokter, sisakuotajkn: v.response.sisakuotajkn
                //     }
                // ,});

            } else {
                Swal.fire({
                    title: 'Error!',
                    text: v.metaData.message,
                    icon: 'error',
                    confirmButtonText: 'Ok'
                })
                throw new Error(`Peringatan : ${v.metaData.message}`);
            }

            return;
        }
        // const data = await fetchrequiredData(nomorNik, selectedOption);
        const data = await fetchRequiredDataRujukan(nomorNik, selectedOption, selectedRujukan);
        // return;
        if (data) {
            const formData = new FormData();
            formData.append('id_poli', selectedOption.split('#')[0]); // Ambil id poli dari selectedOption
            formData.append('kodepoli', selectedOption.split('#')[1]); // Ambil kode poli dari selectedOption
            formData.append('nomorkartu', kategoriPasien == 'BPJS' ? nomorNik : "");
            formData.append('norm', data.norm);
            formData.append('nik', data.nik);
            formData.append('nohp', data.nohp);
            formData.append('kodedokter', selectedDokter.split('@')[0]);
            formData.append('jampraktek', selectedDokter.split('@')[1]);
            formData.append('jeniskunjungan', data.jeniskunjungan);
            formData.append('nomorreferensi', data.nomorreferensi);

            // console.log(formData);
            // return;
            // try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SIMRS}/antrol/api/onsitedebug?submitdebug=1`, {
                method: 'POST',
                body: formData,  // Kirim body dalam bentuk form-data
            });
            // console.log(formData);
            // console.log(response.json());
            // const results = await response.json();
            // console.log(v);
            // Swal.fire({
            //     title: 'Error!',
            //     text: `Peringatan: `,
            //     icon: 'error',
            //     confirmButtonText: 'Ok'
            // });
            // return;
            const v = await response.json(); // Jika respons berupa JSON
            if (!v.metaData) {
                let message = v.metadata.message;
                if (message !== 'Ok') {

                    if (message == "data nomorreferensi  belum sesuai.") {
                        // console.log(data.jeniskunjungan);
                        if (data.jeniskunjungan === 3) {
                            // belum dibuatkan surat kontrol
                            message = "Belum dibuatkan surat kontrol, silahkan hubungi petugas."
                        }
                    }
                    Swal.fire({
                        title: 'Error!',
                        text: message,
                        icon: 'error',
                        confirmButtonText: 'Ok'
                    })
                    return;
                }
            }

            if (!v.metadata) {
                let message = v.metaData.message;
                if (message !== 'Ok') {
                    if (message == "data nomorreferensi  belum sesuai.") {
                        // console.log(data.jeniskunjungan);
                        if (data.jeniskunjungan === 3) {
                            // belum dibuatkan surat kontrol
                            message = "Belum dibuatkan surat kontrol, silahkan hubungi petugas."
                        }
                    }
                    Swal.fire({
                        title: 'Error!',
                        text: message,
                        icon: 'error',
                        confirmButtonText: 'Ok'
                    })
                    return;
                }

            }
            console.log(v);

            if (v.metaData.code == 200) {
                let queryparam = btoa(JSON.stringify({
                    'nomorantrean': v.response.nomorantrean,
                    'namapoli': v.response.namapoli,
                    "namadokter": v.response.namadokter,
                    "sisakuotajkn": v.response.sisakuotajkn
                }));
                router.push('/antrian/cetak?q=' + queryparam);
                // router.push({
                //     pathname: '/antrian/cetak', 
                //     query: {
                //         nomorantrean: v.response.nomorantrean, namapoli: v.response.namapoli, namadokter: v.response.namadokter, sisakuotajkn: v.response.sisakuotajkn
                //     }
                // ,});
            } else {
                throw new Error(`Peringatan : ${data.metaData.message}`);
            }
            // } catch (error) {
            //     console.error('Error:', error);
            // }
        }
    }

    return (
        <div>
            
            <h4 className='fw-bold text-center'>ANTRIAN RSUD SIJUNJUNG</h4>
            <div className="py-2"></div>
            <div className="row px-4" style={{ minHeight: '65vh' }}>
                <div className="col">
                    <div className=''>
                        <label className='text-secondary'>Pilih Kategori Peserta</label><br></br>
                        <div className='my-2'></div>
                        <button
                            style={{
                                width: '19rem',
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
                                width: '19rem',
                                height: '3rem',
                                fontWeight: 'bold',
                                color: kategoriPasien == 'BPJS' ? '#747877' : '',
                                backgroundColor: kategoriPasien != 'BPJS' ? '#007BFF' : '#F1F2F6',
                                border: kategoriPasien == 'BPJS' ? '2px solid #D5DBDA' : '',
                            }}
                            onClick={() => handleKategoriPasien('NON BPJS')} className={kategoriPasien != 'BPJS' ? "btn-primary btn" : "btn"}

                        >Peserta Non BPJS</button>
                        {/* </div> */}
                    </div>

                    {/* <div className='my-4'>
                        <label htmlFor="nomornik" className='text-secondary'>{labeling}</label>
                        <input style={{
                            height: '3rem',
                            fontSize: '1.5rem',
                            marginTop: '0.5rem',
                            backgroundColor: '#F1F2F6',
                        }} value={nomorNik} id="nomornik" autoFocus type="text" onChange={(e) => handleNomorNik(e.target.value)} className="form-control" />
                    </div> */}
                    <div className='my-4'>
                        <label htmlFor="nomornik" className='text-secondary'>{labeling}</label>
                        {/* --- MODIFIKASI: Input Group dengan Tombol Cek Rujukan --- */}
                        <div className="input-group">
                            <input style={{
                                height: '3rem',
                                fontSize: '1.5rem',
                                backgroundColor: '#F1F2F6',
                            }} value={nomorNik} id="nomornik" autoFocus type="text" onChange={(e) => handleNomorNik(e.target.value)} className="form-control" />
                            {kategoriPasien === 'BPJS' && (
                                <button className="btn btn-info" type="button" onClick={handleCekRujukan} style={{fontWeight: 'bold', color:'white'}}>Cek Rujukan</button>
                            )}
                        </div>
                    </div>

                    {/* --- PENAMBAHAN FIELD BARU: Untuk Nomor Rujukan yang Dipilih --- */}
                    {kategoriPasien === 'BPJS' && (
                        <div className='my-4'>
                            <label htmlFor="nomorrujukan" className='text-secondary'>Nomor Rujukan (Terisi Otomatis)</label>
                            <input style={{
                                height: '3rem',
                                fontSize: '1rem',
                                marginTop: '0.5rem',
                                backgroundColor: '#e9ecef', // Warna abu-abu untuk field readonly
                            }} value={nomorRujukan} id="nomorrujukan" type="text" readOnly className="form-control" />
                        </div>
                    )}

                    <div className='my-4'>
                        <label htmlFor="poliklinik" className='text-secondary'>Pilih Poliklinik</label><br></br>
                        <select style={{
                            height: '3rem',
                            fontSize: '1rem',
                            marginTop: '0.5rem',
                            // backgroundColor: isDisablePoli ? '#b0b1b5' : '#F1F2F6',
                        }} id="poliklinik" className="form-control"
                            onChange={handleSelectChange}
                            value={selectedOption}
                            // disabled={isDisablePoli}
                        >
                            <option value="">-- Pilih Poliklinik --</option>
                            {poliklinikOptions.map((poli) => (
                                <option key={poli.id_poli} value={poli.id_poli + '#' +poli.poli_bpjs}>
                                    {poli.nm_poli}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className='my-4'>
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
                <div className="col ">

                    <div className="d-flex justify-content-between">
                        <div className='ms-4'>
                            <div className="d-flex">
                                <button onClick={() => handleNumber(1)} className=" btn" style={{
                                    height: '5rem',
                                    margin: '0.5rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                    // background: '#E5E5E5'

                                }}>1</button>
                                <button onClick={() => handleNumber(2)} className=" btn" style={{
                                    height: '5rem',
                                    margin: '0.5rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>2</button>
                                <button onClick={() => handleNumber(3)} className=" btn" style={{
                                    height: '5rem',
                                    margin: '0.5rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>3</button>
                            </div>
                            <div className="d-flex">
                                <button onClick={() => handleNumber(4)} className=" btn" style={{
                                    height: '5rem',
                                    margin: '0.5rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>4</button>
                                <button onClick={() => handleNumber(5)} className=" btn" style={{
                                    height: '5rem',
                                    margin: '0.5rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>5</button>
                                <button onClick={() => handleNumber(6)} className=" btn" style={{
                                    height: '5rem',
                                    margin: '0.5rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>6</button>
                            </div>
                            <div className="d-flex">
                                <button onClick={() => handleNumber(7)} className=" btn" style={{
                                    height: '5rem',
                                    margin: '0.5rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>7</button>
                                <button onClick={() => handleNumber(8)} className=" btn" style={{
                                    height: '5rem',
                                    margin: '0.5rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>8</button>
                                <button onClick={() => handleNumber(9)} className=" btn" style={{
                                    height: '5rem',
                                    margin: '0.5rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>9</button>
                            </div>
                            <div className="d-flex">
                                <div className="btn" style={{
                                    height: '5rem',
                                    margin: '0.5rem',
                                    width: '5rem'
                                }}></div>
                                <button onClick={() => handleNumber(0)} className=" btn" style={{
                                    height: '5rem',
                                    margin: '0.5rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>0</button>
                                <button onClick={() => handleBackspace()} className=" btn" style={{
                                    height: '5rem',
                                    margin: '0.5rem',
                                    width: '5rem',
                                    backgroundColor: '#F1F2F6',
                                    border: '2px solid #E5E5E5',
                                    fontWeight: 'bold',
                                    fontSize: '2rem'
                                }}>{'<'}</button>
                            </div>
                        </div>
                        <div className='px-4'></div>
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