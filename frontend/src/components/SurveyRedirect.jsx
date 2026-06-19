import React, { useEffect } from 'react';

const SurveyRedirect = () => {
    useEffect(() => {
        window.location.replace('https://forms.gle/vG4hhfUFrPTUNgwY6');
    }, []);

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900 transition-colors duration-300">
            <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-100 dark:border-gray-700/50 max-w-sm w-full mx-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-vluRed mx-auto mb-6"></div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-gray-100 mb-2">Đang chuyển hướng</h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Bạn đang được tự động kết nối đến phiếu khảo sát ý kiến hệ thống của Đại học Văn Lang.
                </p>
                <a 
                    href="https://forms.gle/vG4hhfUFrPTUNgwY6" 
                    className="inline-block mt-6 text-xs text-vluRed hover:underline font-semibold"
                >
                    Nhấp vào đây nếu không tự động chuyển hướng
                </a>
            </div>
        </div>
    );
};

export default SurveyRedirect;
