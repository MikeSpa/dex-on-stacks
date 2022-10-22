
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.14.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

const err_minter_only = 300;
const err_amount_zero = 301;

Clarinet.test({
    name: "Ensure that get-symbol/get-decimals works",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet1 = accounts.get("wallet_1")!;
        let wallet2 = accounts.get("wallet_2")!;

        let symbol = chain.callReadOnlyFn('magic-beans-lp', 'get-symbol', [], wallet1.address);
        symbol.result.expectOk().expectAscii("MAGIC-LP");
        let decimals = chain.callReadOnlyFn('magic-beans-lp', 'get-decimals', [], wallet1.address);
        decimals.result.expectOk().expectUint(6);


    },
});

Clarinet.test({
    name: "Ensure that mint works",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet1 = accounts.get("wallet_1")!;
        let wallet2 = accounts.get("wallet_2")!;

        let init_balance_deployer = chain.callReadOnlyFn('magic-beans-lp', 'get-balance', [types.principal(deployer.address)], deployer.address);
        init_balance_deployer.result.expectUint(0);
        let init_balance_wallet1 = chain.callReadOnlyFn('magic-beans-lp', 'get-balance', [types.principal(wallet1.address)], deployer.address);
        init_balance_wallet1.result.expectUint(0);
        let init_balance_wallet2 = chain.callReadOnlyFn('magic-beans-lp', 'get-balance', [types.principal(wallet2.address)], deployer.address);
        init_balance_wallet2.result.expectUint(0);

        let block = chain.mineBlock([
            // set-minter
            // set minter failed if not allowed -> err
            Tx.contractCall('magic-beans-lp', 'set-minter', [types.principal(wallet1.address)], wallet1.address),
            // set minter 
            Tx.contractCall('magic-beans-lp', 'set-minter', [types.principal(wallet1.address)], deployer.address),
            // set minter  failed, no longer minter -> err
            Tx.contractCall('magic-beans-lp', 'set-minter', [types.principal(deployer.address)], deployer.address),
            // mint
            // mint to self
            Tx.contractCall("magic-beans-lp", "mint", [types.uint(1000), types.principal(wallet1.address)], wallet1.address),
            // mint to other
            Tx.contractCall("magic-beans-lp", "mint", [types.uint(8), types.principal(deployer.address)], wallet1.address),
            // mint to other
            Tx.contractCall("magic-beans-lp", "mint", [types.uint(2000), types.principal(wallet2.address)], wallet1.address),
            // mint failed if not minter -> err
            Tx.contractCall("magic-beans-lp", "mint", [types.uint(100000), types.principal(deployer.address)], deployer.address),
            // mint failed if amount 0 -> err
            Tx.contractCall("magic-beans-lp", "mint", [types.uint(0), types.principal(deployer.address)], wallet1.address),

        ]);
        block.receipts[0].result.expectErr().expectUint(err_minter_only)
        block.receipts[1].result.expectOk()
        block.receipts[2].result.expectErr().expectUint(err_minter_only)
        block.receipts[3].result.expectOk()
        block.receipts[4].result.expectOk()
        block.receipts[5].result.expectOk()
        block.receipts[6].result.expectErr().expectUint(err_minter_only)
        block.receipts[7].result.expectErr().expectUint(err_amount_zero)

        let end_balance = chain.callReadOnlyFn('magic-beans-lp', 'get-balance', [types.principal(deployer.address)], deployer.address);
        end_balance.result.expectUint(8);
        let end_balance_wallet1 = chain.callReadOnlyFn('magic-beans-lp', 'get-balance', [types.principal(wallet1.address)], deployer.address);
        end_balance_wallet1.result.expectUint(1000);
        let end_balance_wallet2 = chain.callReadOnlyFn('magic-beans-lp', 'get-balance', [types.principal(wallet2.address)], deployer.address);
        end_balance_wallet2.result.expectUint(2000);

        let total_supply = chain.callReadOnlyFn('magic-beans-lp', 'get-total-supply', [], deployer.address);
        total_supply.result.expectUint(2000 + 1000 + 8);

        block = chain.mineBlock([
            // burn
            Tx.contractCall("magic-beans-lp", "burn", [types.uint(1000)], wallet1.address),
            // burn too much -> failed
            Tx.contractCall("magic-beans-lp", "burn", [types.uint(9)], deployer.address),

        ]);
        block.receipts[0].result.expectOk()
        block.receipts[1].result.expectErr().expectUint(1)
        end_balance = chain.callReadOnlyFn('magic-beans-lp', 'get-balance', [types.principal(deployer.address)], deployer.address);
        end_balance.result.expectUint(8);
        end_balance_wallet1 = chain.callReadOnlyFn('magic-beans-lp', 'get-balance', [types.principal(wallet1.address)], deployer.address);
        end_balance_wallet1.result.expectUint(0);
        end_balance_wallet2 = chain.callReadOnlyFn('magic-beans-lp', 'get-balance', [types.principal(wallet2.address)], deployer.address);
        end_balance_wallet2.result.expectUint(2000);

        total_supply = chain.callReadOnlyFn('magic-beans-lp', 'get-total-supply', [], deployer.address);
        total_supply.result.expectUint(2000 + 1000 + 8 - 1000);
    },
});

