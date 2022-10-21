
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
            Tx.contractCall("magic-beans", "mint", [types.uint(1000), types.principal(deployer.address)], deployer.address),
            Tx.contractCall("magic-beans", "mint", [types.uint(8), types.principal(wallet1.address)], deployer.address),
            Tx.contractCall("magic-beans", "mint", [types.uint(10000000), types.principal(wallet1.address)], wallet1.address),

        ]);

        let end_balance = chain.callReadOnlyFn('magic-beans', 'get-balance', [types.principal(deployer.address)], deployer.address);
        end_balance.result.expectUint(1000);
        let end_balance_wallet1 = chain.callReadOnlyFn('magic-beans', 'get-balance', [types.principal(wallet1.address)], deployer.address);
        end_balance_wallet1.result.expectUint(8);
        block.receipts[2].result.expectErr().expectUint(err_owner_only)

    },
});
