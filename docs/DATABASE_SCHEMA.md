# NOVA Database Schema (Backend)

The NOVA backend uses PostgreSQL to store non-sensitive application data, user preferences (optional), and transaction indexing. 
**Crucially, the backend NEVER stores private keys, mnemonic phrases, or passwords.**

## Entities

### `users`
Optional table if we implement backend-synced preferences or an address book across devices.
- `id` (UUID, Primary Key)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)
- `public_address` (String, Unique) - Used as the primary identifier if the user opts in.
- `settings` (JSONB) - Theme, preferred currency, etc.

### `fiat_orders`
Tracks on-ramp and off-ramp orders via third-party providers (e.g., Transak, Onmeta).
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key) or `public_address` (String)
- `provider` (String) - E.g., 'transak', 'onmeta'
- `provider_order_id` (String, Unique)
- `type` (String) - 'buy' or 'sell'
- `status` (String) - 'pending', 'processing', 'completed', 'failed', 'cancelled'
- `fiat_amount` (Decimal)
- `fiat_currency` (String) - E.g., 'INR', 'USD'
- `crypto_amount` (Decimal)
- `crypto_currency` (String) - E.g., 'SOL', 'ETH', 'USDC'
- `crypto_network` (String) - E.g., 'solana', 'ethereum', 'polygon'
- `wallet_address` (String)
- `tx_hash` (String, Nullable)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### `fiat_webhooks_log`
Auditable log of all webhooks received from fiat providers for reconciliation.
- `id` (UUID, Primary Key)
- `provider` (String)
- `payload` (JSONB)
- `signature` (String)
- `processed` (Boolean)
- `created_at` (Timestamp)

### `token_metadata`
Cache for verified token information to prevent spoofing and reduce RPC load.
- `id` (UUID, Primary Key)
- `network` (String)
- `contract_address` (String, Indexed)
- `symbol` (String)
- `name` (String)
- `decimals` (Integer)
- `logo_url` (String)
- `is_verified` (Boolean)
- `updated_at` (Timestamp)

### `transactions_cache`
Indexes transaction history for quick retrieval.
- `id` (UUID, Primary Key)
- `tx_hash` (String, Indexed)
- `network` (String)
- `wallet_address` (String, Indexed)
- `type` (String) - 'send', 'receive', 'swap', 'contract_interaction'
- `status` (String) - 'confirmed', 'failed', 'pending'
- `metadata` (JSONB)
- `timestamp` (Timestamp)

## Constraints & Security
- All sensitive columns (none exist currently) would be encrypted at rest.
- Row-Level Security (RLS) is applied if accessing via an API like Supabase/PostgREST.
- API endpoints authenticating requests must verify that the user controls the `public_address` by requiring a cryptographic signature (e.g., SIWE - Sign In With Ethereum or SIWS for Solana).
