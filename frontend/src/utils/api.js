import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
    const token = Cookies.get('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

api.interceptors.response.use((response) => {
    return response;
}, (error) => {
    if (error.response && error.response.status === 401) {
        Cookies.remove('token');
        Cookies.remove('user');
        window.location.href = '/login';
    }
    return Promise.reject(error);
});

export default api;
