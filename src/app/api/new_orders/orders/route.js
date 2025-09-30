import getDbPool from '@/util/dbConnect.ts';

export async function POST(req) {
    try {
        const { ipAddress } = await req.json();

        if (!ipAddress) {
            return new Response('IP address is required', { status: 400 });
        }

        const pool = getDbPool(ipAddress);

        const [rows] = await pool.query(`
            SELECT
                o.IDX,
                o.ORDER_NO,
                o.ORDER_SEQ,
                o.ORDERER_NAME,
                o.MENU_ID,
                o.QUANTITY,
                o.IS_ICE,
                o.ICE_AMT,
                o.SHOT_AMT,
                o.INS_DATE,
                m.NAME AS MENU_NAME,
                m.CATEGORY
            FROM GAP_ORDER o
                     INNER JOIN menu m ON o.MENU_ID = m.ID
            WHERE o.COMPLETED_YN = 'N'
            ORDER BY o.INS_DATE ASC
        `);

        return new Response(JSON.stringify(rows), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error fetching new orders:', error);
        return new Response('Failed to fetch new orders', { status: 500 });
    }
}
