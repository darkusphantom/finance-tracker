'use server';

import crypto from 'crypto';

const API_URL = 'https://api.binance.com';
const API_KEY = process.env.BINANCE_API_KEY;
const SECRET_KEY = process.env.BINANCE_API_SECRET;

async function binanceRequest(endpoint: string, params: Record<string, string | number> = {}) {
    if (!API_KEY || !SECRET_KEY) {
        throw new Error("Binance API Key or Secret Key is not configured.");
    }
    
    const timestamp = Date.now();
    const queryString = new URLSearchParams({ ...params, timestamp: timestamp.toString() }).toString();
    const signature = crypto.createHmac('sha256', SECRET_KEY).update(queryString).digest('hex');
    const url = `${API_URL}${endpoint}?${queryString}&signature=${signature}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: { 'X-MBX-APIKEY': API_KEY },
    });
    
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.msg || `Binance API error on ${endpoint}`);
    }
    return data;
}

export async function getSpotWallet() {
    const accountInfo = await binanceRequest('/api/v3/account');
    return accountInfo.balances.filter((b: any) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0);
}

export async function getFundingWallet() {
    return binanceRequest('/sapi/v1/asset/get-funding-asset');
}

export async function getSimpleEarnFlexible() {
    return binanceRequest('/sapi/v1/simple-earn/flexible/position');
}

export async function getSimpleEarnLocked() {
    return binanceRequest('/sapi/v1/simple-earn/locked/position');
}

export async function getTickerPrices() {
    const response = await fetch(`${API_URL}/api/v3/ticker/price`);
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.msg || 'Failed to fetch ticker prices');
    }
    const priceMap = new Map<string, number>();
    data.forEach((ticker: { symbol: string; price: string }) => {
        priceMap.set(ticker.symbol, parseFloat(ticker.price));
    });
    return priceMap;
}
