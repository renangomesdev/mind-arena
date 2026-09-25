
import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api';

export const api = axios.create({
    baseURL: API_URL,
});
