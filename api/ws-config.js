export default async function handler(req, res) {
    try {
        const EC2_URL = process.env.EC2_API_URL;
        
        if (!EC2_URL) {
            return res.status(500).json({
                code: 'PROXY_CONFIG_ERROR',
                message: '서버 설정 오류가 발생했습니다.'
            });
        }
        
        const wsUrl = EC2_URL.replace('http://', 'ws://').replace('https://', 'wss://');
        
        return res.status(200).json({ wsUrl });
    } catch (error) {
        console.error('ws-config error:', error);
        return res.status(500).json({
            code: 'PROXY_ERROR',
            message: 'WebSocket 설정 조회 중 오류가 발생했습니다.'
        });
    }
}