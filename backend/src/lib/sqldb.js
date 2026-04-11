import { sql } from "../config/postgresqldb.js";

export const connectSQLDB = async () => {
  try {

    await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;


    await sql`
    CREATE TABLE IF NOT EXISTS plans(
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      price NUMERIC(10, 2) NOT NULL,
      duration INT NOT NULL,
      features JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    )`;

    
    await sql`
    CREATE TABLE IF NOT EXISTS subscriptions(
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        u_id TEXT NOT NULL,
        plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
        status TEXT CHECK (status IN ('active', 'inactive', 'cancelled','pending')) NOT NULL DEFAULT 'pending',
        start_date TIMESTAMP DEFAULT NOW(),
        end_date TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
    )`;

    await sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'unique_user_subscription'
        ) THEN
          ALTER TABLE subscriptions
          ADD CONSTRAINT unique_user_subscription UNIQUE (u_id);
        END IF;
      END $$;
    `;


    await sql`
    CREATE TABLE IF NOT EXISTS payments(
        id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        u_id TEXT NOT NULL,
        subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
        amount NUMERIC(10, 2) NOT NULL,
        forMonth INT NOT NULL,
        forYear INT NOT NULL,
        status TEXT CHECK (status IN ('pending', 'completed', 'failed')) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
    )`;

    await sql`CREATE INDEX IF NOT EXISTS idx_user_sub ON subscriptions(u_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_pay ON payments(u_id)`;
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS unique_payment_month
      ON payments(u_id, forMonth, forYear)
    `;

    console.log(`PostgreSQL connected successfully`);
  } catch (error) {
    console.log("PostgreSQL connection error:", error);
  }
};