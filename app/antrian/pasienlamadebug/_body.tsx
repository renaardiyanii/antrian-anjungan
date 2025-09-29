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
    const [activeTab, setActiveTab] = useState('faskes'); // 'faskes' atau 'rs'
    const [selectedRujukanType, setSelectedRujukanType] = useState('faskes'); // Menyimpan tipe rujukan yang dipilih

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

    // --- FUNGSI BARU: Untuk fetch rujukan RS dengan parameter rs=1 ---
    const fetchRujukanRS = async (nomorkartu: string) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SIMRS}/antrol/api/onsitedebug?getrujukan=1&val=${nomorkartu}&rs=1`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching rujukan RS:', error);
            return null;
        }
    };

    // --- FUNGSI BARU: Untuk cek jumlah SEP berdasarkan rujukan ---
    const cekJumlahSEP = async (rujukan: any, tabType = 'faskes') => {
        try {
            // Parameter tipe rujukan: 1 = FKTP, 2 = RS
            const tipeRujukan = tabType === 'rs' ? '2' : '1';
            const url = `${process.env.NEXT_PUBLIC_SIMRS}/antrol/api/onsitedebug?cekjumlahsep=1&tipe=${tipeRujukan}&norujukan=${rujukan.noKunjungan}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.metaData && data.metaData.code === 200) {
                return data.response.jumlahSEP || '0';
            }
            return '0';
        } catch (error) {
            console.error('Error fetching jumlah SEP:', error);
            return '0';
        }
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
            // Fetch data dari kedua sumber secara bersamaan
            const [responseFaskes, responseRS] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_SIMRS}/antrol/api/onsitedebug?getrujukan=1&val=${nomorNik}`),
                fetchRujukanRS(nomorNik)
            ]);

            const dataFaskes = await responseFaskes.json();
            const dataRS = responseRS;

            // Cek apakah ada data rujukan dari salah satu sumber
            const hasFaskesData = dataFaskes.metaData.code === 200 && dataFaskes.response.rujukan && dataFaskes.response.rujukan.length > 0;
            const hasRSData = dataRS && dataRS.metaData.code === 200 && dataRS.response.rujukan && dataRS.response.rujukan.length > 0;

            if (hasFaskesData || hasRSData) {
                Swal.close();
                const rujukanFaskes = hasFaskesData ? dataFaskes.response.rujukan : [];
                const rujukanRS = hasRSData ? dataRS.response.rujukan : [];

                // Fungsi untuk membuat HTML tabel
                const createTableHtml = (rujukanList, tabType) => `
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
                                            <button class="btn btn-primary btn-sm btn-pilih-rujukan" data-nokunjungan="${rujukan.noKunjungan}" data-kodepoli="${rujukan.poliRujukan.kode}" data-tabtype="${tabType}">Pilih</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;

                // Membuat HTML untuk modal dengan tab
                const modalHtml = `
                    <div>
                        <!-- Tab Navigation -->
                        <ul class="nav nav-tabs" id="rujukanTabs" role="tablist">
                            <li class="nav-item" role="presentation">
                                <button class="nav-link ${hasFaskesData ? 'active' : ''}" id="faskes-tab" data-bs-toggle="tab" data-bs-target="#faskes" type="button" role="tab">
                                    Rujukan Faskes ${hasFaskesData ? `(${rujukanFaskes.length})` : '(0)'}
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link ${!hasFaskesData && hasRSData ? 'active' : ''}" id="rs-tab" data-bs-toggle="tab" data-bs-target="#rs" type="button" role="tab">
                                    Rujukan RS ${hasRSData ? `(${rujukanRS.length})` : '(0)'}
                                </button>
                            </li>
                        </ul>

                        <!-- Tab Content -->
                        <div class="tab-content" id="rujukanTabContent" style="margin-top: 15px;">
                            <!-- Tab Faskes -->
                            <div class="tab-pane fade ${hasFaskesData ? 'show active' : ''}" id="faskes" role="tabpanel">
                                ${hasFaskesData ? createTableHtml(rujukanFaskes, 'faskes') : '<p class="text-center text-muted py-3">Tidak ada data rujukan faskes</p>'}
                            </div>

                            <!-- Tab RS -->
                            <div class="tab-pane fade ${!hasFaskesData && hasRSData ? 'show active' : ''}" id="rs" role="tabpanel">
                                ${hasRSData ? createTableHtml(rujukanRS, 'rs') : '<p class="text-center text-muted py-3">Tidak ada data rujukan RS</p>'}
                            </div>
                        </div>
                    </div>
                `;

                Swal.fire({
                    title: '<strong>Data Rujukan Ditemukan</strong>',
                    html: modalHtml,
                    width: '80%',
                    showConfirmButton: false,
                    showCloseButton: true,
                    didOpen: () => {
                        // Event listener untuk tab switching
                        document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
                            tab.addEventListener('click', (e) => {
                                e.preventDefault();
                                const targetTab = e.target.getAttribute('data-bs-target');

                                // Remove active class from all tabs and panes
                                document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
                                document.querySelectorAll('.tab-pane').forEach(pane => {
                                    pane.classList.remove('show', 'active');
                                });

                                // Add active class to clicked tab and corresponding pane
                                e.target.classList.add('active');
                                document.querySelector(targetTab).classList.add('show', 'active');
                            });
                        });

                        // Menambahkan event listener ke setiap tombol "Pilih"
                        document.querySelectorAll('.btn-pilih-rujukan').forEach(button => {
                            button.addEventListener('click', (e) => {
                                const noKunjungan = e.currentTarget.getAttribute('data-nokunjungan');
                                const kodePoli = e.currentTarget.getAttribute('data-kodepoli');
                                const tabType = e.currentTarget.getAttribute('data-tabtype');

                                // Cari objek rujukan lengkap dari list yang sesuai dengan tab
                                const rujukanList = tabType === 'faskes' ? rujukanFaskes : rujukanRS;
                                const rujukanTerpilih = rujukanList.find(r => r.noKunjungan === noKunjungan);
                                if (rujukanTerpilih) {
                                    handlePilihRujukan(rujukanTerpilih, tabType); // Kirim seluruh objek dan tipe tab
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
    const handlePilihRujukan = async (rujukan:any, tabType = 'faskes') => {
        // Sekarang Anda memiliki akses ke semua data rujukan
        console.log('Data rujukan yang dipilih:', rujukan);
        console.log('Tipe tab:', tabType);

        // Tampilkan loading saat mengecek SEP
        Swal.fire({
            title: 'Mengecek data rujukan...',
            didOpen: () => {
                Swal.showLoading();
            },
            allowOutsideClick: false
        });

        try {
            // Cek jumlah SEP untuk rujukan ini
            const jumlahSEP = await cekJumlahSEP(rujukan, tabType);
            console.log('Jumlah SEP:', jumlahSEP);

            setSelectedRujukan(rujukan); // <-- Simpan seluruh objek rujukan
            setSelectedRujukanType(tabType); // <-- Simpan tipe rujukan yang dipilih
            setNomorRujukan(rujukan.noKunjungan); // Mengisi field nomor rujukan

            if (jumlahSEP === '0') {
                // SEP = 0, otomatis pilih poliklinik dan dokter
                console.log('Rujukan poliRujukan:', rujukan.poliRujukan);
                console.log('Poliklinik options:', poliklinikOptions);

                // Cari poliklinik yang sesuai dari poliklinikOptions berdasarkan kode BPJS
                const poliklinikSesuai = poliklinikOptions.find(poli =>
                    poli.poli_bpjs === rujukan.poliRujukan.kode
                );

                if (poliklinikSesuai) {
                    // Format value sesuai dengan dropdown: id_poli + '#' + poli_bpjs
                    const selectedPoliValue = `${poliklinikSesuai.id_poli}#${poliklinikSesuai.poli_bpjs}`;
                    console.log('Selected poli value:', selectedPoliValue);

                    setSelectedOption(selectedPoliValue);  // Auto-select poliklinik dengan format yang benar

                    // Fetch dokter untuk poli tersebut menggunakan poli_bpjs
                    const response = await fetch(`${process.env.NEXT_PUBLIC_SIMRS}/antrol/api/onsite?cekdokter=1&val=${poliklinikSesuai.poli_bpjs}`);
                    const data = await response.json();
                    console.log('Response dokter:', data);

                    if (data.metadata && data.metadata.code === 200 && data.response.length > 0) {
                        setDokter(data.response);
                        // Auto-select dokter pertama
                        const dokterPertama = data.response[0];
                        const dokterValue = `${dokterPertama.kodedokter}@${dokterPertama.jadwal}`;
                        console.log('Auto-selected dokter:', dokterValue);
                        setSelectedDokter(dokterValue);

                        Swal.close();
                        const tabLabel = tabType === 'rs' ? 'RS' : 'Faskes';
                        Swal.fire('Sukses', `Rujukan ${tabLabel} ${rujukan.noKunjungan} telah dipilih dan dokter otomatis terpilih.`, 'success');
                    } else {
                        // Jika tidak ada dokter, tetap pilih poli tapi tidak auto-select dokter
                        setDokter([]);
                        Swal.close();
                        const tabLabel = tabType === 'rs' ? 'RS' : 'Faskes';
                        Swal.fire('Info', `Rujukan ${tabLabel} ${rujukan.noKunjungan} telah dipilih. Silakan pilih dokter.`, 'info');
                    }
                    setIsDisablePoli(true); // Nonaktifkan pilihan poli
                } else {
                    console.error('Poliklinik tidak ditemukan untuk kode:', rujukan.poliRujukan.kode);
                    Swal.close();
                    const tabLabel = tabType === 'rs' ? 'RS' : 'Faskes';
                    Swal.fire('Warning', `Rujukan ${tabLabel} ${rujukan.noKunjungan} telah dipilih, tetapi poliklinik tidak ditemukan dalam daftar. Silakan pilih manual.`, 'warning');
                }
            } else {
                // SEP > 0, hanya set rujukan tanpa auto-select
                Swal.close();
                const tabLabel = tabType === 'rs' ? 'RS' : 'Faskes';
                Swal.fire('Info', `Rujukan ${tabLabel} ${rujukan.noKunjungan} telah dipilih (sudah ada ${jumlahSEP} SEP). Silakan pilih poliklinik dan dokter.`, 'info');
            }

        } catch (error) {
            console.error('Error saat memproses rujukan:', error);
            Swal.close();
            Swal.fire('Error', 'Terjadi kesalahan saat memproses rujukan.', 'error');
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

    // --- FUNGSI BARU: Untuk fetch required data rujukan RS dengan parameter rs=1 ---
    const fetchRequiredDataRujukanRS = async (nomorKartu: string, kodePoli: string, rujukan: any) => {
        const formData = new FormData();
        formData.append('nomorkartu', nomorKartu); // Tambahkan data form
        formData.append('kodepoli', kodePoli);
        formData.append('rujukan', JSON.stringify(rujukan)); // Tambahkan nomor rujukan jika diperlukan

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SIMRS}/antrol/api/onsitedebug?ceknokarturujukan=1&rs=1`, {
                method: 'POST',
                body: formData,  // Kirim body dalam bentuk form-data
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json(); // Jika respons berupa JSON
            if (data.metaData.code == 200) {
                return data.response;
            } else {
                throw new Error(`Peringatan : ${data.metaData.message}`);
            }
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
        // Pilih fungsi yang sesuai berdasarkan tipe rujukan
        let data;
        if (selectedRujukanType === 'rs') {
            // Untuk rujukan RS, gunakan fungsi dengan parameter rs=1
            data = await fetchRequiredDataRujukanRS(nomorNik, selectedOption, selectedRujukan);
        } else {
            // Untuk rujukan Faskes, gunakan fungsi standar
            data = await fetchRequiredDataRujukan(nomorNik, selectedOption, selectedRujukan);
        }
        console.log(data);
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