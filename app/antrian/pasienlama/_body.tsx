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

    const [suratKontrol, setSuratKontrol] = useState('');

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
            // Fetch data rujukan biasa
            const response1 = await fetch(`${process.env.NEXT_PUBLIC_SIMRS}/antrol/api/onsitedebug?getrujukan=1&val=${nomorNik}`);
            const data1 = await response1.json();

            // Fetch data rujukan rawat inap (SEP pasca rawat inap)
            const response2 = await fetch(`${process.env.NEXT_PUBLIC_SIMRS}/antrol/api/bpjs_sep/${nomorNik}/1`);
            const data2 = await response2.json();

            // Gabungkan data rujukan
            let allRujukan = [];

            // Tambahkan rujukan biasa jika ada
            if (data1.metaData.code === 200 && data1.response.rujukan && data1.response.rujukan.length > 0) {
                // Format data rujukan biasa
                const rujukanBiasa = data1.response.rujukan.map(rujukan => ({
                    ...rujukan,
                    type: 'biasa',
                    noRujukan: rujukan.noKunjungan,
                    tglRujukan: rujukan.tglKunjungan,
                    poliTujuan: rujukan.poliRujukan.nama,
                    diagnosa: rujukan.diagnosa.nama,
                    kodePoli: rujukan.poliRujukan.kode
                }));
                allRujukan = [...allRujukan, ...rujukanBiasa];
            }

            // Tambahkan rujukan rawat inap jika ada
            if (Array.isArray(data2) && data2.length > 0) {
                // Format data rujukan rawat inap
                const rujukanRawatInap = data2.map(sep => ({
                    type: 'rawat_inap',
                    noRujukan: sep.no_sep,
                    tglRujukan: sep.tglrujukan,
                    poliTujuan: '-',
                    diagnosa: sep.diagawal,
                    kodePoli: '', // Kosong untuk rawat inap
                    // Simpan data lengkap untuk keperluan lain
                    originalData: sep
                }));
                allRujukan = [...allRujukan, ...rujukanRawatInap];
            }

            if (allRujukan.length > 0) {
                Swal.close();

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
                                ${allRujukan.map((rujukan, index) => {
                    const badgeHtml = rujukan.type === 'rawat_inap'
                        ? '<br><span class="badge" style="background-color: #fd7e14; color: white; font-size: 10px;">Rawat Inap</span>'
                        : '';

                    return `
                                        <tr>
                                            <td>${index + 1}${badgeHtml}</td>
                                            <td>${rujukan.noRujukan}</td>
                                            <td>${rujukan.tglRujukan}</td>
                                            <td>${rujukan.poliTujuan}</td>
                                            <td>${rujukan.diagnosa}</td>
                                            <td>
                                                <button class="btn btn-primary btn-sm btn-pilih-rujukan" 
                                                    data-type="${rujukan.type}"
                                                    data-nokunjungan="${rujukan.noRujukan}" 
                                                    data-kodepoli="${rujukan.kodePoli || ''}"
                                                    data-index="${index}">
                                                    Pilih
                                                </button>
                                            </td>
                                        </tr>
                                    `;
                }).join('')}
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
                                const type = e.currentTarget.getAttribute('data-type');
                                const noKunjungan = e.currentTarget.getAttribute('data-nokunjungan');
                                const kodePoli = e.currentTarget.getAttribute('data-kodepoli');
                                const index = parseInt(e.currentTarget.getAttribute('data-index'));

                                // Ambil data rujukan berdasarkan index
                                const rujukanTerpilih = allRujukan[index];

                                if (rujukanTerpilih) {
                                    if (type === 'biasa') {
                                        // Untuk rujukan biasa, kirim objek rujukan original
                                        const originalRujukan = data1.response.rujukan.find(r => r.noKunjungan === noKunjungan);
                                        handlePilihRujukan(originalRujukan);
                                    } else if (type === 'rawat_inap') {
                                        // Untuk rujukan rawat inap, kirim data SEP yang sudah diformat
                                        handlePilihRujukan(rujukanTerpilih);
                                    }
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
    const handlePilihRujukan = async (rujukan: any) => {
        console.log('Data rujukan yang dipilih:', rujukan);

        setSelectedRujukan(rujukan); // Simpan seluruh objek rujukan

        // Cek apakah ini rujukan rawat inap atau biasa
        if (rujukan.type === 'rawat_inap') {
            // Untuk rujukan rawat inap (data dari API SEP)
            setNomorRujukan(rujukan.noRujukan); // Menggunakan no_sep

            Swal.close(); // Tutup modal rujukan terlebih dahulu

            // Cek apakah sudah ada surat kontrol
            await checkSuratKontrol(rujukan.noRujukan);

        } else {
            // Untuk rujukan biasa (data dari API rujukan normal)
            setNomorRujukan(rujukan.noKunjungan); // Menggunakan noKunjungan
            setSelectedOption(rujukan.poliRujukan.kode); // Auto-select poliklinik
            handleSelectChangeAuto(rujukan.poliRujukan.kode); // Auto-fetch dokter untuk poli tersebut
            setIsDisablePoli(true); // Nonaktifkan pilihan poli

            Swal.close(); // Tutup modal
            Swal.fire('Sukses', `Rujukan ${rujukan.noKunjungan} telah dipilih.`, 'success');
        }
    };

    // Fungsi untuk mengecek surat kontrol
    // Fungsi untuk mengecek surat kontrol
    const checkSuratKontrol = async (noSep: string) => {
        try {
            Swal.fire({
                title: 'Mengecek surat kontrol...',
                didOpen: () => {
                    Swal.showLoading();
                },
                allowOutsideClick: false
            });

            const response = await fetch(`${process.env.NEXT_PUBLIC_SIMRS}/antrol/api/cek_surat_kontrol_exist/${noSep}`);
            const data = await response.json();

            Swal.close();

            if (data && data.surat_kontrol) {
                // Surat kontrol sudah ada
                setSuratKontrol(data.surat_kontrol);
                setSelectedOption(''); // Reset pilihan poli
                setIsDisablePoli(false); // Aktifkan pilihan poli agar user bisa memilih

                Swal.fire('Sukses', `Rujukan Rawat Inap ${noSep} telah dipilih. Surat kontrol: ${data.surat_kontrol}`, 'success');
            } else {
                // Surat kontrol belum ada, tampilkan modal pembuatan
                showModalSuratKontrol(noSep);
            }
        } catch (error) {
            console.error('Error checking surat kontrol:', error);
            Swal.fire('Error', 'Gagal mengecek surat kontrol.', 'error');
        }
    };

    // Fungsi untuk menampilkan modal pembuatan surat kontrol
    const showModalSuratKontrol = (noSep: string) => {
        const modalHtml = `
            <div style="text-align: left;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h4 style="font-weight: bold;">PEMBUATAN SURAT KONTROL</h4>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">No. SEP</label>
                    <input type="text" id="no_sep_surat_bikin" value="${noSep}" readonly 
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; background-color: #f5f5f5;">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Tgl Rencana Kontrol</label>
                    <input type="date" id="tgl_surat_bikin" onchange="ambilPoliKontrol(this.value)"
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Poli Kontrol</label>
                    <select id="poli_suratkontrol_bikin" onchange="ambilDokterSuratKontrol(this.value)"
                            style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="">-- Pilih Poliklinik --</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Dokter Surat Kontrol</label>
                    <select id="dpjp_suratkontrol_bikin"
                            style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="">-- Pilih Dokter --</option>
                    </select>
                </div>
            </div>
        `;

        Swal.fire({
            title: '',
            html: modalHtml,
            width: '600px',
            showCancelButton: true,
            confirmButtonText: 'Buat Surat Kontrol',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#007bff',
            cancelButtonColor: '#dc3545',
            didOpen: () => {
                // Set tanggal default ke hari ini
                const today = new Date().toISOString().split('T')[0];
                const tglInput = document.getElementById('tgl_surat_bikin') as HTMLInputElement;
                const poliSelect = document.getElementById('poli_suratkontrol_bikin') as HTMLSelectElement;

                if (tglInput) {
                    tglInput.value = today;
                    ambilPoliKontrol(today);

                    // Tambahkan event listener untuk onchange
                    tglInput.addEventListener('change', (e) => {
                        const target = e.target as HTMLInputElement;
                        ambilPoliKontrol(target.value);
                    });
                }

                if (poliSelect) {
                    // Tambahkan event listener untuk onchange
                    poliSelect.addEventListener('change', (e) => {
                        const target = e.target as HTMLSelectElement;
                        ambilDokterSuratKontrol(target.value);
                    });
                }
            },
            preConfirm: () => {
                const noSepInput = document.getElementById('no_sep_surat_bikin') as HTMLInputElement;
                const tglInput = document.getElementById('tgl_surat_bikin') as HTMLInputElement;
                const poliSelect = document.getElementById('poli_suratkontrol_bikin') as HTMLSelectElement;
                const dokterSelect = document.getElementById('dpjp_suratkontrol_bikin') as HTMLSelectElement;

                if (!tglInput.value) {
                    Swal.showValidationMessage('Tanggal rencana kontrol harus diisi');
                    return false;
                }
                if (!poliSelect.value) {
                    Swal.showValidationMessage('Poli kontrol harus dipilih');
                    return false;
                }
                if (!dokterSelect.value) {
                    Swal.showValidationMessage('Dokter harus dipilih');
                    return false;
                }

                return {
                    noSep: noSepInput.value,
                    tglRencana: tglInput.value,
                    poli: poliSelect.value,
                    dokter: dokterSelect.value
                };
            }
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                buatSuratKontrol(result.value);
            }
        });
    };

    // Fungsi untuk mengambil poli kontrol
    const ambilPoliKontrol = async (tgl: string) => {
        try {
            const noSep = (document.getElementById('no_sep_surat_bikin') as HTMLInputElement)?.value;
            const response = await fetch(`${process.env.NEXT_PUBLIC_SIMRS}/antrol/api/data_poli?jnskontrol=2&nomor=${noSep}&tglrencanakontrol=${tgl}`);
            const data = await response.json();

            const poliSelect = document.getElementById('poli_suratkontrol_bikin') as HTMLSelectElement;
            if (poliSelect) {
                poliSelect.innerHTML = '<option value="">-- Pilih Poliklinik --</option>';

                if (data.metaData.code === '200') {
                    data.response.list.forEach((poli: any) => {
                        const option = document.createElement('option');
                        option.value = poli.kodePoli;
                        option.textContent = poli.namaPoli;
                        poliSelect.appendChild(option);
                    });
                } else {
                    Swal.fire('Peringatan', data.metaData.message, 'warning');
                }
            }
        } catch (error) {
            console.error('Error fetching poli data:', error);
        }
    };

    // Fungsi untuk mengambil dokter surat kontrol
    const ambilDokterSuratKontrol = async (kodePoli: string) => {
        try {
            const tgl = (document.getElementById('tgl_surat_bikin') as HTMLInputElement)?.value;
            const response = await fetch(`${process.env.NEXT_PUBLIC_SIMRS}/antrol/api/data_dokter?jnskontrol=2&poli=${kodePoli}&tglrencanakontrol=${tgl}`);
            const data = await response.json();

            const dokterSelect = document.getElementById('dpjp_suratkontrol_bikin') as HTMLSelectElement;
            if (dokterSelect) {
                dokterSelect.innerHTML = '<option value="">-- Pilih Dokter --</option>';

                if (data.metaData.code === '200') {
                    data.response.list.forEach((dokter: any) => {
                        const option = document.createElement('option');
                        option.value = `${dokter.kodeDokter}-${dokter.namaDokter}`;
                        option.textContent = dokter.namaDokter;
                        dokterSelect.appendChild(option);
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching dokter data:', error);
        }
    };


    // Fungsi untuk membuat surat kontrol
    const buatSuratKontrol = async (data: any) => {
        try {
            Swal.fire({
                title: 'Membuat surat kontrol...',
                didOpen: () => {
                    Swal.showLoading();
                },
                allowOutsideClick: false
            });

            const response = await fetch(`${process.env.NEXT_PUBLIC_SIMRS}/antrol/api/insert_surat_kontrol`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sep: data.noSep,
                    dokter: data.dokter.split('-')[0],
                    poli: `A -${data.poli}`,
                    tglrencanakontrol: data.tglRencana,
                    user: 'ADMIN',
                    nama_dokter: data.dokter.split('-')[1]
                })
            });

            const result = await response.json();

            if (result.metaData.code === '200') {
                // Simpan surat kontrol yang baru dibuat
                setSuratKontrol(result.response.noSuratKontrol);

                // Reset dan aktifkan pilihan poli
                setSelectedOption('');
                setIsDisablePoli(false);

                Swal.fire('Sukses', `Surat kontrol berhasil dibuat: ${result.response.noSuratKontrol}`, 'success');
            } else {
                Swal.fire('Peringatan', result.metaData.message, 'warning');
            }
        } catch (error) {
            console.error('Error creating surat kontrol:', error);
            Swal.fire('Error', 'Gagal membuat surat kontrol.', 'error');
        }
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

    const fetchRequiredDataRujukan = async (nomorKartu: string, kodePoli: string, rujukan: any) => {
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
        // Check if selected poli is null, then check rujukan peserta
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
    
        // Handle NON BPJS patients
        if (kategoriPasien == 'NON BPJS') {
            const formData = new FormData();
            formData.append('no_cm', nomorNik)
            formData.append('kodedokter', selectedDokter.split('@')[0] ?? '450599');
            formData.append('jampraktek', selectedDokter.split('@')[1] ?? '07:00-23:00');
            formData.append('kodepoli', selectedOption);
            
            const response = await fetch(`${process.env.NEXT_PUBLIC_SIMRS}/antrol/api/onsite_nonjknv2`, {
                method: 'POST',
                body: formData,
            });
            
            const v = await response.json();
            if (v.metaData.code == 200) {
                let queryparam = btoa(JSON.stringify({
                    'nomorantrean': v.response.nomorantrean,
                    'namapoli': v.response.namapoli,
                    "namadokter": v.response.namadokter,
                    "sisakuotajkn": v.response.sisakuotanonjkn
                }));
                router.push('/antrian/cetak?q=' + queryparam);
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
    
        // Handle BPJS patients
        const data = await fetchRequiredDataRujukan(nomorNik, selectedOption, selectedRujukan);
        
        if (data) {
            // Check if this is a rawat inap case (jeniskunjungan = 3) and needs surat kontrol
            if (data.jeniskunjungan === "" && (!suratKontrol || suratKontrol === '')) {
                // Show dialog to create surat kontrol for rawat inap
                const result = await Swal.fire({
                    title: 'Rawat Inap Detected',
                    text: 'Pasien rawat inap memerlukan surat kontrol. Apakah Anda ingin membuat surat kontrol?',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Ya, Buat Surat Kontrol',
                    cancelButtonText: 'Batal'
                });
    
                if (result.isConfirmed) {
                    // Call function to create surat kontrol
                    try {
                        await buatSuratKontrol({
                            noSep: data.nomorreferensi, // atau data.sep jika ada
                            dokter: selectedDokter, // format: "kode-nama"
                            poli: selectedOption.split('#')[1], // ambil kode poli
                            tglRencana: new Date().toISOString().split('T')[0] // today or selected date
                        });
                        
                        // After surat kontrol is created, continue with the process
                        // The suratKontrol state should be updated by buatSuratKontrol function
                    } catch (error) {
                        console.error('Error creating surat kontrol:', error);
                        Swal.fire('Error', 'Gagal membuat surat kontrol. Proses dibatalkan.', 'error');
                        return;
                    }
                } else {
                    // User cancelled, stop the process
                    return;
                }
            }
    
            const formData = new FormData();
            formData.append('id_poli', selectedOption.split('#')[0]);
            formData.append('kodepoli', selectedOption.split('#')[1]);
            formData.append('nomorkartu', kategoriPasien == 'BPJS' ? nomorNik : "");
            formData.append('norm', data.norm);
            formData.append('nik', data.nik);
            formData.append('nohp', data.nohp);
            formData.append('kodedokter', selectedDokter.split('@')[0]);
            formData.append('jampraktek', selectedDokter.split('@')[1]);
            
            // Use surat kontrol if available (for jeniskunjungan = 3)
            // if (data.jeniskunjungan === 3 && suratKontrol) {
            //     formData.append('nomorreferensi', suratKontrol);
            // } else {
            //     formData.append('nomorreferensi', data.nomorreferensi);
            // }
            if(suratKontrol){ // menandakan surat kontrol sudah ada& pasien pasca rawat inap
                formData.append('nomorreferensi', suratKontrol);
                formData.append('jeniskunjungan', "4");
            }else{
                formData.append('jeniskunjungan', data.jeniskunjungan);
                formData.append('nomorreferensi', data.nomorreferensi);
            }
    
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_SIMRS}/antrol/api/onsitedebug?submitdebug=1`, {
                    method: 'POST',
                    body: formData,
                });
    
                const v = await response.json();
                
                // Handle response validation
                if (!v.metaData && !v.metadata) {
                    Swal.fire({
                        title: 'Error!',
                        text: 'Response tidak valid dari server',
                        icon: 'error',
                        confirmButtonText: 'Ok'
                    });
                    return;
                }
    
                // Handle metaData format (with capital D)
                if (v.metaData && v.metaData.message !== 'Ok') {
                    let message = v.metaData.message;
                    
                    if (message === "data nomorreferensi  belum sesuai.") {
                        if (data.jeniskunjungan === 3) {
                            message = "Nomor referensi surat kontrol tidak valid. Silahkan buat ulang surat kontrol.";
                        }
                    }
                    
                    Swal.fire({
                        title: 'Error!',
                        text: message,
                        icon: 'error',
                        confirmButtonText: 'Ok'
                    });
                    return;
                }
    
                // Handle metadata format (with lowercase d)
                if (v.metadata && v.metadata.message !== 'Ok') {
                    let message = v.metadata.message;
                    
                    if (message === "data nomorreferensi  belum sesuai.") {
                        if (data.jeniskunjungan === 3) {
                            message = "Nomor referensi surat kontrol tidak valid. Silahkan buat ulang surat kontrol.";
                        }
                    }
                    
                    Swal.fire({
                        title: 'Error!',
                        text: message,
                        icon: 'error',
                        confirmButtonText: 'Ok'
                    });
                    return;
                }
    
                console.log(v);
    
                // Success handling
                if (v.metaData && v.metaData.code == 200) {
                    let queryparam = btoa(JSON.stringify({
                        'nomorantrean': v.response.nomorantrean,
                        'namapoli': v.response.namapoli,
                        "namadokter": v.response.namadokter,
                        "sisakuotajkn": v.response.sisakuotajkn
                    }));
                    router.push('/antrian/cetak?q=' + queryparam);
                } else {
                    throw new Error(`Peringatan : ${v.metaData?.message || v.metadata?.message || 'Unknown error'}`);
                }
                
            } catch (error) {
                console.error('Error:', error);
                Swal.fire({
                    title: 'Error!',
                    text: error.message || 'Terjadi kesalahan saat memproses permintaan',
                    icon: 'error',
                    confirmButtonText: 'Ok'
                });
            }
        }
    };

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
                                <button className="btn btn-info" type="button" onClick={handleCekRujukan} style={{ fontWeight: 'bold', color: 'white' }}>Cek Rujukan</button>
                            )}
                        </div>
                    </div>

                    {/* --- PENAMBAHAN FIELD BARU: Untuk Nomor Rujukan yang Dipilih --- */}
                    <div className='my-4'>
                        <label htmlFor="nomorrujukan" className='text-secondary'>Nomor Rujukan (Terisi Otomatis)</label>
                        <input style={{
                            height: '3rem',
                            fontSize: '1rem',
                            marginTop: '0.5rem',
                            backgroundColor: '#e9ecef', // Warna abu-abu untuk field readonly
                        }} value={nomorRujukan} id="nomorrujukan" type="text" readOnly className="form-control" />
                    </div>

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
                                <option key={poli.id_poli} value={poli.id_poli + '#' + poli.poli_bpjs}>
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