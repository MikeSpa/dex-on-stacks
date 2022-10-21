
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.14.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

const err_owner_only = 100;
const err_amount_zero = 101;

Clarinet.test({
    name: "Ensure that mint works (mint correct amount, only owner can mint)",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet1 = accounts.get("wallet_1")!;
        let wallet2 = accounts.get("wallet_2")!;

        let init_balance = chain.callReadOnlyFn('magic-beans', 'get-balance', [types.principal(deployer.address)], deployer.address);
        init_balance.result.expectUint(0);

        let block = chain.mineBlock([
            //mint to self
            Tx.contractCall("magic-beans", "mint", [types.uint(1000), types.principal(deployer.address)], deployer.address),
            // mint to other
            Tx.contractCall("magic-beans", "mint", [types.uint(8), types.principal(wallet1.address)], deployer.address),
            // mint non owner -> err
            Tx.contractCall("magic-beans", "mint", [types.uint(10000000), types.principal(wallet1.address)], wallet1.address),

        ]);

        let end_balance = chain.callReadOnlyFn('magic-beans', 'get-balance', [types.principal(deployer.address)], deployer.address);
        end_balance.result.expectUint(1000);
        let end_balance_wallet1 = chain.callReadOnlyFn('magic-beans', 'get-balance', [types.principal(wallet1.address)], deployer.address);
        end_balance_wallet1.result.expectUint(8);
        block.receipts[2].result.expectErr().expectUint(err_owner_only)

    },
});

Clarinet.test({
    name: "Ensure that transfer works",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet1 = accounts.get("wallet_1")!;
        let wallet2 = accounts.get("wallet_2")!;

        let init_balance_deployer = chain.callReadOnlyFn('magic-beans', 'get-balance', [types.principal(deployer.address)], deployer.address);
        init_balance_deployer.result.expectUint(0);
        let init_balance_wallet1 = chain.callReadOnlyFn('magic-beans', 'get-balance', [types.principal(wallet1.address)], deployer.address);
        init_balance_wallet1.result.expectUint(0);
        let init_balance_wallet2 = chain.callReadOnlyFn('magic-beans', 'get-balance', [types.principal(wallet2.address)], deployer.address);
        init_balance_wallet2.result.expectUint(0);

        let block = chain.mineBlock([
            //mint
            Tx.contractCall("magic-beans", "mint", [types.uint(1000000), types.principal(deployer.address)], deployer.address),
            // transfer
            Tx.contractCall("magic-beans", "transfer", [types.uint(1), types.principal(deployer.address), types.principal(wallet1.address)], deployer.address),
            Tx.contractCall("magic-beans", "transfer", [types.uint(2000), types.principal(deployer.address), types.principal(wallet2.address)], deployer.address),
            // transfer 0 -> err
            Tx.contractCall("magic-beans", "transfer", [types.uint(0), types.principal(deployer.address), types.principal(wallet2.address)], deployer.address),
            // transfer other people token -> err
            Tx.contractCall("magic-beans", "transfer", [types.uint(99999), types.principal(deployer.address), types.principal(wallet2.address)], wallet2.address),
            // self transfer -> ok
            Tx.contractCall("magic-beans", "transfer", [types.uint(8), types.principal(deployer.address), types.principal(deployer.address)], deployer.address),

        ]);

        let end_balance_deployer = chain.callReadOnlyFn('magic-beans', 'get-balance', [types.principal(deployer.address)], deployer.address);
        end_balance_deployer.result.expectUint(1000000 - 2001);
        let end_balance_wallet1 = chain.callReadOnlyFn('magic-beans', 'get-balance', [types.principal(wallet1.address)], deployer.address);
        end_balance_wallet1.result.expectUint(1);
        let end_balance_wallet2 = chain.callReadOnlyFn('magic-beans', 'get-balance', [types.principal(wallet2.address)], deployer.address);
        end_balance_wallet2.result.expectUint(2000);
        block.receipts[3].result.expectErr().expectUint(err_amount_zero)
        block.receipts[4].result.expectErr().expectUint(err_owner_only)

    },
});
