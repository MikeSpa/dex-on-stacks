
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.14.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

const err_zero_stx = 200
const err_zero_tokens = 201
const err_owner_only = 202

const dexContract = "beanstalk-exchange";
const tokenContract = "magic-beans";
const lpTokenContract = "magic-beans-lp";


Clarinet.test({
    name: "Ensure that get-balance works",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet1 = accounts.get("wallet_1")!;

        let init_stx = chain.callReadOnlyFn(dexContract, 'get-stx-balance', [], deployer.address);
        init_stx.result.expectUint(0);
        let init_token = chain.callReadOnlyFn(dexContract, 'get-token-balance', [], wallet1.address);
        init_token.result.expectUint(0);


    },
});

Clarinet.test({
    name: "Ensure that provide-liquidity works",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet1 = accounts.get("wallet_1")!;
        let wallet2 = accounts.get("wallet_2")!;
        const dex = types.principal(deployer.address) + "." + dexContract


        let init_stx = chain.callReadOnlyFn(dexContract, 'get-stx-balance', [], deployer.address);
        init_stx.result.expectUint(0);
        let init_token = chain.callReadOnlyFn(dexContract, 'get-token-balance', [], wallet1.address);
        init_token.result.expectUint(0);
        // Mint tokens
        let block = chain.mineBlock([
            Tx.contractCall(tokenContract, "mint", [types.uint(1000000), types.principal(deployer.address)], deployer.address),
            Tx.contractCall(tokenContract, "mint", [types.uint(1000), types.principal(wallet1.address)], deployer.address),
            Tx.contractCall(tokenContract, "mint", [types.uint(2000), types.principal(wallet2.address)], deployer.address),
            Tx.contractCall(lpTokenContract, 'set-minter', [dex], deployer.address),

        ]);
        assertEquals(block.receipts.length, 4);
        assertEquals(block.height, 2);


        // PROVIDE LIQUIDITY
        block = chain.mineBlock([
            //0 amount -> err
            Tx.contractCall(dexContract, 'provide-liquidity', [types.uint(0), types.uint(10)], deployer.address),
            Tx.contractCall(dexContract, 'provide-liquidity', [types.uint(2), types.uint(0)], wallet1.address),
            // provide liquidity 
            Tx.contractCall(dexContract, 'provide-liquidity', [types.uint(2), types.uint(10)], wallet1.address),
            Tx.contractCall(dexContract, 'provide-liquidity', [types.uint(2), types.uint(10)], wallet1.address),

            Tx.contractCall(dexContract, 'provide-liquidity', [types.uint(2), types.uint(15)], wallet1.address),


        ]);
        assertEquals(block.receipts.length, 5);
        assertEquals(block.height, 3);
        block.receipts[0].result.expectErr().expectUint(err_zero_stx)
        block.receipts[1].result.expectErr().expectUint(err_zero_tokens)
        block.receipts[2].result.expectOk()
        block.receipts[3].result.expectOk()
        block.receipts[4].result.expectOk()
        // block.receipts[5].result.expectOk()


        let end_stx = chain.callReadOnlyFn(dexContract, 'get-stx-balance', [], deployer.address);
        end_stx.result.expectUint(6);
        let end_token = chain.callReadOnlyFn(dexContract, 'get-token-balance', [], wallet1.address);
        end_token.result.expectUint(30);

        let lp_balance = chain.callReadOnlyFn(lpTokenContract, 'get-balance', [types.principal(wallet1.address)], wallet1.address);
        lp_balance.result.expectUint(2 + 2 + 2);



    },
});

Clarinet.test({
    name: "Ensure that remove-liquidity (no swap) works",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet1 = accounts.get("wallet_1")!;
        let wallet2 = accounts.get("wallet_2")!;
        const dex = types.principal(deployer.address) + "." + dexContract


        let init_stx = chain.callReadOnlyFn(dexContract, 'get-stx-balance', [], deployer.address);
        init_stx.result.expectUint(0);
        let init_token = chain.callReadOnlyFn(dexContract, 'get-token-balance', [], wallet1.address);
        init_token.result.expectUint(0);
        // Mint tokens
        let block = chain.mineBlock([
            Tx.contractCall(tokenContract, "mint", [types.uint(1000000), types.principal(deployer.address)], deployer.address),
            Tx.contractCall(tokenContract, "mint", [types.uint(1000), types.principal(wallet1.address)], deployer.address),
            Tx.contractCall(tokenContract, "mint", [types.uint(2000), types.principal(wallet2.address)], deployer.address),
            Tx.contractCall(lpTokenContract, 'set-minter', [dex], deployer.address),

        ]);
        assertEquals(block.receipts.length, 4);
        assertEquals(block.height, 2);


        // PROVIDE LIQUIDITY
        block = chain.mineBlock([
            // provide liquidity 
            Tx.contractCall(dexContract, 'provide-liquidity', [types.uint(2), types.uint(10)], wallet1.address),
            Tx.contractCall(dexContract, 'provide-liquidity', [types.uint(2), types.uint(10)], wallet1.address),
            Tx.contractCall(dexContract, 'provide-liquidity', [types.uint(2), types.uint(15)], wallet1.address),
        ]);
        assertEquals(block.receipts.length, 3);
        assertEquals(block.height, 3);
        assertEquals(chain.callReadOnlyFn(dexContract, 'get-stx-balance', [], deployer.address).result, types.uint(6));
        assertEquals(chain.callReadOnlyFn(dexContract, 'get-token-balance', [], wallet1.address).result, types.uint(30));
        assertEquals(chain.callReadOnlyFn(lpTokenContract, 'get-balance', [types.principal(wallet1.address)], wallet1.address).result, types.uint(6));

        //exchange: 6 STX, 30 token
        //wallet1: 6 LP

        // REMOVE LIQUIDITY
        block = chain.mineBlock([
            //remove liquidity 0 -> err
            Tx.contractCall(dexContract, "remove-liquidity", [types.uint(0)], wallet1.address),
            //remove liquidity not enough LP token -> err
            Tx.contractCall(dexContract, "remove-liquidity", [types.uint(10)], wallet1.address),
            //remove liquidity
            Tx.contractCall(dexContract, "remove-liquidity", [types.uint(2)], wallet1.address),
        ]);
        assertEquals(block.receipts.length, 3);
        assertEquals(block.height, 4);
        block.receipts[0].result.expectErr().expectUint(err_zero_tokens)
        block.receipts[1].result.expectErr().expectUint(1)
        block.receipts[2].result.expectOk()

        assertEquals(chain.callReadOnlyFn(dexContract, 'get-stx-balance', [], deployer.address).result, types.uint(6 - 2));
        assertEquals(chain.callReadOnlyFn(dexContract, 'get-token-balance', [], wallet1.address).result, types.uint(30 - 10));
        assertEquals(chain.callReadOnlyFn(lpTokenContract, 'get-balance', [types.principal(wallet1.address)], wallet1.address).result, types.uint(6 - 2));
    },
});

