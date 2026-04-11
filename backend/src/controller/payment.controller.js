import { sql } from "../config/postgresqldb.js";
import User from "../model/user.model.js";

export const createPlans = async (req, res, next) => {
    try {
        const { user } = req

        if (!user.isOwner) {
            return res.status(403).json({ message: "Only owners can create plans" });
        }

        const { name, price, duration, features } = req.body;

        if (!name || price == undefined || duration == undefined || !features) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if(isNaN(price) || isNaN(duration) || price < 0 || duration <= 0){
            return res.status(400).json({ message: "Price must be a non-negative number and duration must be a positive integer" });
        }

        const newPlan = await sql`
            INSERT INTO plans (name, price, duration, features)
            VALUES (${name}, ${price}, ${duration}, ${JSON.stringify(features)})
            RETURNING *
        `;

        return res.status(201).json({
            message: "Plan created successfully",
            plan: newPlan
        });
    } catch (error) {
        next(error);
    }
}

export const getPlans = async (req, res, next) => {
    try {
        const { user } = req
        if(user.isDisabled){
            return res.status(403).json({ message: "Your account is disabled. Please contact support." });
        }

        const plans = await sql`
            SELECT * FROM plans
        `;

        if (plans.length === 0) {
            return res.status(200).json({ message: "No plans found" });
        }

        return res.status(200).json({ plans });
    } catch (error) {
        next(error)
    }
}

export const subscribePlan = async (req, res, next) => {
    try {
        const { user } = req

        if(user.isDisabled){
            return res.status(403).json({ message: "Your account is disabled. Please contact support." });
        }

        const { id:planId } = req.params;

        if (!planId) {
            return res.status(400).json({ message: "Plan ID is required" });
        }

        const plan = await sql`
            SELECT * FROM plans WHERE id = ${planId}
        `;

        if (!plan || plan.length === 0) {
            return res.status(404).json({ message: "Plan not found" });
        }

        await sql`BEGIN`;

        try {
            const subscription = await sql`
                INSERT INTO subscriptions (u_id, plan_id, status, start_date, end_date)
                VALUES (${user._id}, ${planId}, 'pending', NOW(), NOW() + (${plan[0].duration} * INTERVAL '1 day'))
                ON CONFLICT (u_id)
                DO UPDATE SET
                    plan_id = EXCLUDED.plan_id,
                    status = 'pending',
                    start_date = NOW(),
                    end_date = NOW() + (${plan[0].duration} * INTERVAL '1 day')
                RETURNING *;
            `;

            const payment = await sql`
                INSERT INTO payments (u_id, subscription_id, amount, status , forMonth, forYear)
                VALUES (${user._id}, ${subscription[0].id}, ${plan[0].price}, 'pending', EXTRACT( MONTH FROM NOW()), EXTRACT( YEAR FROM NOW()))
                ON CONFLICT (u_id, forMonth, forYear)
                DO UPDATE SET 
                    subscription_id = EXCLUDED.subscription_id, 
                    amount = EXCLUDED.amount,
                    status = 'pending'
                RETURNING *
            `;

            if (!payment || payment.length === 0) {
                throw new Error("Failed to create payment");
            }

            await sql`COMMIT`;

            await User.findOneAndUpdate(
                { _id: user._id },
                { $set: { subscription: subscription[0].id } },
                { new: true }
            );

            return res.status(200).json({
                message: "Subscription created successfully. Please proceed to payment.",
                subscription: subscription[0],
                payment: payment[0]
            });

        } catch (err) {
            await sql`ROLLBACK`;
            throw err;
        }

    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({
                message: "You already have a pending payment for this month."
            });
        }
        console.log(error)
        return res.status(500).json({
            message: "An error occurred while processing your subscription. Please try again later. "
        })
    }
}

export const payForSubscription = async (req, res, next) => {
    try {
        const { user } = req

        if(user.isDisabled){
            return res.status(403).json({ message: "Your account is disabled. Please contact support." });
        }

        const { id: paymentId } = req.params;

        if (!paymentId) {
            return res.status(400).json({ message: "Payment ID is required" });
        }

        await sql`BEGIN`;

        try {
            const payment = await sql`
                SELECT * FROM payments 
                WHERE id = ${paymentId} AND u_id = ${user._id}
                FOR UPDATE
            `;

            if (!payment || payment.length === 0) {
                throw new Error("Payment not found");
            }

            if (payment[0].status === 'completed') {
                await sql`COMMIT`;
                return;
            }

            if (payment[0].status !== 'pending') {
                throw new Error("Payment is not pending");
            }

            const subscription = await sql`
                SELECT s.* , p.duration
                FROM subscriptions s
                JOIN plans p ON p.id = s.plan_id
                WHERE s.id = ${payment[0].subscription_id} AND s.u_id = ${user._id}
                FOR UPDATE
            `;

            if (!subscription || subscription.length === 0) {
                throw new Error("Subscription not found");
            }

            if (subscription[0].status === 'active') {
                throw new Error("Subscription is active");
            }

            await sql`
                UPDATE payments 
                SET status = 'completed'
                WHERE id = ${paymentId}
            `;

            await sql`
                UPDATE subscriptions 
                SET 
                    status = 'active',
                    start_date = NOW(),
                    end_date = NOW() + (${subscription[0].duration} * INTERVAL '1 day')
                WHERE id = ${subscription[0].id}
            `;

            await sql`COMMIT`;

        } catch (err) {
            await sql`ROLLBACK`;
            throw err;
        }

        await User.findOneAndUpdate(
            { _id: user._id },
            { $set: { isPaid: true } },
            { new: true }
        );

        return res.status(200).json({
            message: "Payment successful and subscription activated."
        });

    } catch (error) {
        next(error)
    }
}

export const getUserSubscriptionAndPayment = async (req, res, next) => {
    try {
        const { user } = req

        if(user.isDisabled){
            return res.status(403).json({ message: "Your account is disabled. Please contact support." });
        }

        const subscription = await sql`
            SELECT s.*, p.name AS plan_name, p.price AS plan_price, p.duration AS plan_duration, p.features AS plan_features
            FROM subscriptions s
            JOIN plans p ON s.plan_id = p.id
            WHERE s.u_id = ${user._id}
        `;

        if (!subscription || subscription.length === 0) {
            return res.status(404).json({ message: "Subscription not found" });
        }

        const payment = await sql`
            SELECT * FROM payments 
            WHERE subscription_id = ${subscription[0].id} AND u_id = ${user._id}
        `;

        if (!payment || payment.length === 0) {
            return res.status(404).json({ message: "Payment not found" });
        }

        return res.status(200).json({
            message: "Subscription and payment details retrieved successfully",
            subscription: subscription[0],
            payment
        });
    } catch (error) {
        next(error)
    }
}

export const restartSubscription = async (req, res, next) => {
    try {
        const { user } = req

        if (user.isDisabled){
            return res.status(403).json({ message: "User is disabled"})
        }

        if (!user.subscription){
            return res.status(400).json({ message: "No Subscriptions"})
        }

        await sql`BEGIN`;

        try {
            const subscription = await sql`
                SELECT s.* , p.price FROM subscriptions s
                JOIN plans p ON p.id = s.plan_id
                WHERE s.id = ${user.subscription} AND s.u_id = ${user._id}
                FOR UPDATE
            `;

            if (!subscription || subscription.length === 0){
                throw new Error("Subscription not found")
            }

            if (subscription[0].status !== 'inactive'){
                throw new Error("Subscription is not inactive")
            }

            await sql`
                UPDATE subscriptions 
                SET status = 'pending'
                WHERE id = ${subscription[0].id}
            `;

            await sql`
                INSERT INTO payments (u_id, subscription_id, amount, status , forMonth, forYear)
                VALUES (
                    ${user._id}, 
                    ${subscription[0].id}, 
                    ${subscription[0].price},
                    'pending', 
                    EXTRACT( MONTH FROM NOW()), 
                    EXTRACT( YEAR FROM NOW())
                )
                ON CONFLICT (u_id, forMonth, forYear)
                DO UPDATE SET 
                    subscription_id = EXCLUDED.subscription_id, 
                    amount = EXCLUDED.amount,
                    status = 'pending'
                RETURNING *
            `;

            await sql`COMMIT`;

        } catch (err) {
            await sql`ROLLBACK`;
            throw err;
        }

        return res.status(200).json({
            message: "Subscription restarted successfully"
        })
    } catch (error) {
        next(error)
    }
}

export const getPaymentById = async (req, res, next) => {
    try {
        const { user } = req 

        if (user.isDisabled){
            return res.status(403).json({ message: "User is disabled"})
        }

        const { id: paymentId } = req.params
        
        if (!paymentId){
            return res.status(400).json({ message: "Payment id not found"})
        }

        const payment = await sql`
            SELECT * FROM payments 
            WHERE id = ${paymentId} AND u_id = ${user._id}
        `

        if(!payment || payment.length === 0 ){
            return res.status(404).json({ message: "Payment not found"})
        }

        return res.status(200).json({ payment: payment[0]})
    } catch (error) {
        next(error)
    }
}