'use client';
import React from 'react';

const Footer: React.FC = () => {

    const currentDate = new Date();
    const [currentTime, setCurrentTime] = React.useState(new Date());

    React.useEffect(() => {
        // const timer = setInterval(() => {
        //     setCurrentTime(new Date());
        // }, 1000);

        return () => {
            // clearInterval(timer);
        };
    }, []);

    const formattedDate = currentTime.toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
    }).replace('pukul', '').replace('.',':').replace('.',':');

    return (
        <div className='px-4 py-2'>
            {/* <div className='text-end'>{formattedDate}</div> */}
            <div className='text-end text-secondary' style={{fontSize:12}}>Versi Aplikasi 1.0.0</div>
        </div>
    );
};

export default Footer;