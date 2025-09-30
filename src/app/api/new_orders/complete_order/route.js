import getDbPool from '@/util/dbConnect.ts';

export async function POST(req) {
    try {
        const { ipAddress, orderNo } = await req.json();

        if (!ipAddress || !orderNo === undefined) {
            return new Response('ipAddress, orderNo, and orderSeq are required', { status: 400 });
        }

        const pool = getDbPool(ipAddress);

        const [result] = await pool.query(`
            UPDATE GAP_ORDER
            SET COMPLETED_YN = 'Y'
            WHERE ORDER_NO = ?
        `, [orderNo]);

        if (result.affectedRows === 0) {
            return new Response('No matching order found', { status: 404 });
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error updating order:', error);
        return new Response('Failed to update order', { status: 500 });
    }
}
