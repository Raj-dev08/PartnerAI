import User from "../model/user.model.js";
import { sql } from "../config/postgresqldb.js";
import { redis } from "./redis.js";

export const updatePaymentStatus = async (userId) => {
    try {
        const redisKey = `SubscriptionCheckLockFor:${userId}`;

        // run once per day per user
        const redisLock = await redis.set(redisKey, "1", "NX", "EX", 60 * 60 * 24);

        if (!redisLock) return true;

        const user = await User.findById(userId);

        if (!user) return false;

        if (!user.subscription) {
            await User.updateOne({ _id: userId }, { isPaid: false });
            return true;
        }

        const result = await sql.begin(async (tx) => {

            const subscription = await tx`
                SELECT s.* , p.price
                FROM subscriptions s 
                JOIN plans p ON s.plan_id = p.id
                WHERE s.id = ${user.subscription} AND s.u_id = ${userId}
                FOR UPDATE
            `;

            if (!subscription.length) {
                return { isPaid: false };
            }

            const sub = subscription[0];

            // check expiry
            if (sub.status === 'active' && sub.end_date < new Date()) {
                await tx`
                    UPDATE subscriptions
                    SET status = 'inactive'
                    WHERE id = ${sub.id}
                `;

                return { isPaid: false };
            }

            return { isPaid: sub.status === 'active' };
        });

        // update mongo AFTER transaction
        await User.updateOne(
            { _id: userId },
            { isPaid: result.isPaid }
        );



        return true;

    } catch (error) {
        console.log("updatePaymentStatus error:", error);
        return false;
    }
};