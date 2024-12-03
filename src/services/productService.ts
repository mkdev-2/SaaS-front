
// New Product Service for Sync and Fetch Products

import axios from 'axios';

export const syncProducts = async (productData) => {
    const response = await axios.post('/sync-products', productData);
    return response.data;
};

export const getGestaoClickProducts = async () => {
    const response = await axios.get('/gestaoclick/products');
    return response.data;
};
