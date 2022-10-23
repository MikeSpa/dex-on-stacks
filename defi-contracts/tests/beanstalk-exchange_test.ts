
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.14.0/index.ts';
import { assertEquals, assertNotStrictEquals, assert } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

const err_zero_stx = 200
const err_zero_tokens = 201
const err_majority_only = 202

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
    name: "Ensure that set-fee works",
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
            //not enough LP-token -> err
            Tx.contractCall(dexContract, 'set-fee', [types.uint(10)], deployer.address),
            // add liquidity
            Tx.contractCall(dexContract, 'provide-liquidity', [types.uint(2), types.uint(2)], deployer.address),
            //set fee
            Tx.contractCall(dexContract, 'set-fee', [types.uint(10)], deployer.address),


        ]);
        assertEquals(block.receipts.length, 3);
        assertEquals(block.height, 3);
        block.receipts[0].result.expectErr().expectUint(err_majority_only)
        block.receipts[1].result.expectOk()
        block.receipts[2].result.expectOk()


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

Clarinet.test({
    name: "Ensure that swap STX-Token works",
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
        const STX_LIQ = 100
        const TOKEN_LIQ = 1000
        block = chain.mineBlock([
            // provide liquidity 
            Tx.contractCall(dexContract, 'provide-liquidity', [types.uint(STX_LIQ), types.uint(TOKEN_LIQ)], wallet1.address),
        ]);
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 3);
        assertEquals(chain.callReadOnlyFn(dexContract, 'get-stx-balance', [], deployer.address).result, types.uint(STX_LIQ));
        assertEquals(chain.callReadOnlyFn(dexContract, 'get-token-balance', [], wallet1.address).result, types.uint(TOKEN_LIQ));
        assertEquals(chain.callReadOnlyFn(lpTokenContract, 'get-balance', [types.principal(wallet1.address)], wallet1.address).result, types.uint(STX_LIQ));

        //exchange: 1000 STX, 10000 token
        //wallet1: 1000 LP

        let assetsMaps = chain.getAssetsMaps();
        const stx_balance_before = assetsMaps.assets["STX"][wallet2.address];
        const token_balance_before = chain.callReadOnlyFn(tokenContract, 'get-balance', [types.principal(wallet2.address)], wallet2.address).result;

        // SWAP  100 STX for x Token
        const SWAP_STX = 100
        block = chain.mineBlock([
            //swap 0 -> err
            Tx.contractCall(dexContract, 'stx-to-token-swap', [types.uint(0)], wallet2.address),
            //swap
            Tx.contractCall(dexContract, 'stx-to-token-swap', [types.uint(SWAP_STX)], wallet2.address),
        ]);
        assertEquals(block.receipts.length, 2);
        assertEquals(block.height, 4);
        block.receipts[0].result.expectErr().expectUint(err_zero_stx)
        block.receipts[1].result.expectOk()




        //constant = stx_ex*tokens_ex //constant on exchange
        //addi_stx = stx_swap - fee = stx_swap - (stx_swap*get-fee/10000) //    how much the user really provide (stx - fee)
        //target_token_ex = constant / stx_ex + addi_stx    // how many token we want to keep on exchange
        //tokens_return = tokens_ex - target_token_ex   //how many we return
        const constant = STX_LIQ * TOKEN_LIQ

        const fee = chain.callReadOnlyFn(dexContract, 'get-fee', [], wallet2.address).result.expectOk()
        assertEquals(fee, types.uint(30))
        // console.log(fee)
        const addi_stx = SWAP_STX - (SWAP_STX * 30 / 10000)
        // console.log(addi_stx)
        const target_token_ex = constant / (STX_LIQ + addi_stx)
        const token_received = Math.ceil(TOKEN_LIQ - target_token_ex)
        // console.log(token_received)


        // Exchange STX balance:
        assertEquals(chain.callReadOnlyFn(dexContract, 'get-stx-balance', [], deployer.address).result, types.uint(STX_LIQ + SWAP_STX));
        // Exchange token balance:
        assertEquals(chain.callReadOnlyFn(dexContract, 'get-token-balance', [], deployer.address).result, types.uint(TOKEN_LIQ - token_received));

    },
});

Clarinet.test({
    name: "Ensure that swap Token-STX works",
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
        const STX_LIQ = 100
        const TOKEN_LIQ = 1000
        block = chain.mineBlock([
            // provide liquidity 
            Tx.contractCall(dexContract, 'provide-liquidity', [types.uint(STX_LIQ), types.uint(TOKEN_LIQ)], wallet1.address),
        ]);
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 3);
        assertEquals(chain.callReadOnlyFn(dexContract, 'get-stx-balance', [], deployer.address).result, types.uint(STX_LIQ));
        assertEquals(chain.callReadOnlyFn(dexContract, 'get-token-balance', [], wallet1.address).result, types.uint(TOKEN_LIQ));
        assertEquals(chain.callReadOnlyFn(lpTokenContract, 'get-balance', [types.principal(wallet1.address)], wallet1.address).result, types.uint(STX_LIQ));

        //exchange: 1000 STX, 10000 token
        //wallet1: 1000 LP

        let assetsMaps = chain.getAssetsMaps();
        const stx_balance_before = assetsMaps.assets["STX"][wallet2.address];
        const token_balance_before = chain.callReadOnlyFn(tokenContract, 'get-balance', [types.principal(wallet2.address)], wallet2.address).result;

        // SWAP  1000 Token for x STX
        const SWAP_TOKEN = 1000
        block = chain.mineBlock([
            //swap 0 -> err
            Tx.contractCall(dexContract, 'token-to-stx-swap', [types.uint(0)], wallet2.address),
            //swap
            Tx.contractCall(dexContract, 'token-to-stx-swap', [types.uint(SWAP_TOKEN)], wallet2.address),
        ]);
        assertEquals(block.receipts.length, 2);
        assertEquals(block.height, 4);
        block.receipts[0].result.expectErr().expectUint(err_zero_tokens)
        block.receipts[1].result.expectOk()

        //constant = stx_ex*tokens_ex //constant on exchange
        //addi_token = token_swap - fee = token_swap - (token_swap*get-fee/10000) //    how much the user really provide (token - fee)
        //target_token_ex = constant / token_ex + addi_token    // how many stx we want to keep on exchange
        //stx_return = stx_ex - target_stx_ex   //how many we return
        const constant = STX_LIQ * TOKEN_LIQ

        const fee = chain.callReadOnlyFn(dexContract, 'get-fee', [], wallet2.address).result.expectOk()
        assertEquals(fee, types.uint(30))
        // console.log(fee)
        const addi_token = SWAP_TOKEN - (SWAP_TOKEN * 30 / 10000)
        // console.log(addi_token)
        const target_stx_ex = constant / (TOKEN_LIQ + addi_token)
        const stx_received = Math.ceil(STX_LIQ - target_stx_ex)
        // console.log(stx_received)


        // Exchange STX balance:
        assertEquals(chain.callReadOnlyFn(dexContract, 'get-stx-balance', [], deployer.address).result, types.uint(STX_LIQ - stx_received));
        // Exchange token balance:
        assertEquals(chain.callReadOnlyFn(dexContract, 'get-token-balance', [], deployer.address).result, types.uint(TOKEN_LIQ + SWAP_TOKEN));

    },
});

Clarinet.test({
    name: "Ensure that LP provider benefits from swaps",
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
        const STX_LIQ = 100
        const TOKEN_LIQ = 1000
        let liquidity_provider_token_balance = chain.callReadOnlyFn(tokenContract, 'get-balance', [types.principal(wallet1.address)], wallet2.address);
        liquidity_provider_token_balance.result.expectUint(1000);
        block = chain.mineBlock([
            // provide liquidity 
            Tx.contractCall(dexContract, 'provide-liquidity', [types.uint(STX_LIQ), types.uint(TOKEN_LIQ)], wallet1.address),
        ]);
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 3);
        assertEquals(chain.callReadOnlyFn(dexContract, 'get-stx-balance', [], deployer.address).result, types.uint(STX_LIQ));
        assertEquals(chain.callReadOnlyFn(dexContract, 'get-token-balance', [], wallet1.address).result, types.uint(TOKEN_LIQ));
        assertEquals(chain.callReadOnlyFn(lpTokenContract, 'get-balance', [types.principal(wallet1.address)], wallet1.address).result, types.uint(STX_LIQ));

        //exchange: 100 STX, 1000 token
        //wallet1: 100 LP

        // SWAP  100 STX for x Token
        // SWAP  1000 Token for Y Token
        const SWAP_STX = 10
        const TOKEN_SWAP = 100
        let assetsMaps = chain.getAssetsMaps();
        const stx_balance_1_before = assetsMaps.assets["STX"][wallet1.address];
        const stx_balance_before = assetsMaps.assets["STX"][wallet2.address];
        const token_balance_before = chain.callReadOnlyFn(tokenContract, 'get-balance', [types.principal(wallet2.address)], wallet2.address).result;

        block = chain.mineBlock([
            //set fee at 5%
            Tx.contractCall(dexContract, 'set-fee', [types.uint(500)], wallet1.address),
            //swap
            Tx.contractCall(dexContract, 'stx-to-token-swap', [types.uint(SWAP_STX)], wallet2.address),
            Tx.contractCall(dexContract, 'token-to-stx-swap', [types.uint(TOKEN_SWAP)], wallet2.address),
            //remove liquidity
            Tx.contractCall(dexContract, "remove-liquidity", [types.uint(STX_LIQ)], wallet1.address),
        ]);
        assertEquals(block.receipts.length, 4);
        assertEquals(block.height, 4);
        block.receipts[0].result.expectOk()
        block.receipts[1].result.expectOk()
        block.receipts[2].result.expectOk()
        block.receipts[2].result.expectOk()


        const stx_balance_after = assetsMaps.assets["STX"][wallet2.address];
        const token_balance_after = chain.callReadOnlyFn(tokenContract, 'get-balance', [types.principal(wallet2.address)], wallet2.address).result;

        //user who swapped lose funds due to fee
        assertEquals(stx_balance_before, stx_balance_after)
        assertNotStrictEquals(token_balance_before, token_balance_after)

        // Exchange STX balance:
        assertEquals(chain.callReadOnlyFn(dexContract, 'get-stx-balance', [], deployer.address).result, types.uint(0));
        // Exchange token balance:
        assertEquals(chain.callReadOnlyFn(dexContract, 'get-token-balance', [], deployer.address).result, types.uint(0));

        // provider gain token thanks to fee
        assertEquals(stx_balance_1_before, assetsMaps.assets["STX"][wallet1.address])
        liquidity_provider_token_balance = chain.callReadOnlyFn(tokenContract, 'get-balance', [types.principal(wallet1.address)], wallet1.address);
        liquidity_provider_token_balance.result.expectUint(1009);



    },
});