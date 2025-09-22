import React from 'react';


const Header: React.FC = () => {
    return (
        <header>
            <div className="px-4 pt-4 d-flex justify-content-between">
                <div className='d-flex'>
                    <img src="/assets/images/logos/logo_rs.png" height={40} alt="" />
                    <div>
                        <span className='fw-bold'>RSUD SIJUNJUNG</span><br />
                        <span className='text-secondary' style={{
                            fontSize: '0.7rem',
                        }}>Senyum kami kesembuhan anda senyum anda kebahagian kami</span>
                    </div>
                </div>
                <img src="/assets/images/logos/Logo BPJS.png" height={30} alt="" />
            </div>
            <hr />
        </header>
    );
};

export default Header;