export default async function handler(req, res) {
    try {
        const EC2_URL = process.env.EC2_API_URL;

        if (!EC2_URL) {
            console.error('EC2_API_URL 환경 변수가 설정되지 않았습니다.');
            return res.status(500).json({ 
                code: 'PROXY_CONFIG_ERROR',
                message: '서버 설정 오류가 발생했습니다.'
            });
        }

        const targetPath = req.url;
        const fullUrl = `${EC2_URL}${targetPath}`;

        // 헤더 구성
        const headers = {
            'Content-Type': 'application/json',
        };

        if (req.headers.authorization) {
            headers['Authorization'] = req.headers.authorization;
        }

        // EC2로 프록시 요청
        const response = await fetch(fullUrl, {
            method: req.method,
            headers,
            body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
        });

        // Content-Type 확인
        const contentType = response.headers.get('content-type');
        
        // JSON 응답인 경우 (EC2 응답을 그대로 전달)
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return res.status(response.status).json(data);
        }
        
        // 텍스트/HTML 응답인 경우 (에러 형식으로 변환)
        const text = await response.text();
        
        // 에러 상태코드면 표준 형식으로 변환
        if (!response.ok) {
            return res.status(response.status).json({
                code: `HTTP_${response.status}`,
                message: text || '요청 처리 중 오류가 발생했습니다.'
            });
        }
        
        return res.status(response.status).send(text);
    } catch (error) {
        console.error('Proxy error:', error);

        // 에러 타입에 따라 코드 분류
        let errorCode = 'PROXY_ERROR';
        let errorMessage = 'API 요청 처리 중 오류가 발생했습니다.';

        if (error.name === 'TypeError' || error.message.includes('fetch')) {
            errorCode = 'PROXY_CONNECTION_ERROR';
            errorMessage = 'EC2 서버에 연결할 수 없습니다.';
        } else if (error instanceof SyntaxError) {
            errorCode = 'PROXY_PARSE_ERROR';
            errorMessage = '응답 데이터 파싱 중 오류가 발생했습니다.';
        }

        return res.status(500).json({ 
            code: errorCode,
            message: errorMessage
        });
    }
}
