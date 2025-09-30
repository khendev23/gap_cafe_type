import getDbPool from '@/util/dbConnect.ts';

export async function POST(req) {
    try {
        const {menuId, useYN, ipAddress} = await req.json();

        if (!ipAddress) {
            return new Response('IP address is required', { status: 400 });
        }

        const pool = getDbPool(ipAddress);

        // Prepared Statement로 값 바인딩
        const query = 'UPDATE menu SET USE_YN = ? WHERE ID = ?';
        const values = [useYN, menuId];

        await pool.execute(query, values);

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.log(error);
    }
}