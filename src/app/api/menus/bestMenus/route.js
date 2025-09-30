import getDbPool from '@/util/dbConnect.ts';

export async function POST(req) {
    try {
        // 클라이언트로부터 IP 주소 받기
        const { ipAddress } = await req.json();

        if (!ipAddress) {
            return new Response('IP address is required', { status: 400 });
        }

        const pool = getDbPool(ipAddress);

        // 데이터 조회
        const [rows] = await pool.query(`
            select MENU_ID, sum(QUANTITY) as cnt
            from GAP_ORDER
            group by MENU_ID
            order by cnt desc
            limit 3`
        );

        // 데이터 반환
        return new Response(JSON.stringify(rows), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error fetching menus:', error);
        return new Response('Failed to fetch menus', { status: 500 });
    }
}
