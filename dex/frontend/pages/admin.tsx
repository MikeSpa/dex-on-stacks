import { useState } from "react";

import { ContractCallRegularOptions, openContractCall, UserData } from "@stacks/connect";
import { StacksMocknet } from "@stacks/network";
import { standardPrincipalCV, uintCV } from "@stacks/transactions";


import ActionButton from "../components/ActionButton";
import Auth from "../components/Auth";
import NumberInput from "../components/NumberInput";
import PageHeading from "../components/PageHeading";

import { appDetails, contractOwnerAddress } from "../lib/constants";


export default function AdminPage() {
    const [exchangeToken, setExchangeToken] = useState<string>('');
    const [mintAmount, setMintAmount] = useState<number>(1_000_000)

    const mintTokens = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        console.log(`Minting ${mintAmount} of ${exchangeToken}`)

        const network = new StacksMocknet()

        // (contract-call? .magic-beans mint u1000000 tx-sender)
        const options: ContractCallRegularOptions = {
            contractAddress: contractOwnerAddress,
            contractName: exchangeToken,
            functionName: 'mint',
            functionArgs: [
                uintCV(mintAmount),
                standardPrincipalCV(contractOwnerAddress),
            ],
            network,
            appDetails,
            onFinish: ({ txId }) => console.log(txId)
        }

        await openContractCall(options)
    }

    return (
        <div className="flex flex-col items-stretch max-w-4xl gap-8 m-auto">
            <PageHeading>Admin</PageHeading>

            <Auth />

            <form className="flex flex-col gap-4">
                <div>
                    <label htmlFor="exchange-token" className="block text-sm font-medium text-gray-700">
                        Exchange Token
                    </label>
                    <div className="mt-1">
                        <input
                            type="text"
                            id="exchange-token"
                            onChange={(e) => setExchangeToken(e.target.value)}
                            className="block w-full p-2 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="some-token"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="mint-amount" className="block text-sm font-medium text-gray-700">
                        Mint Amount
                    </label>
                    <div className="mt-1">
                        <NumberInput
                            name="mint-amount"
                            decimals={0}
                            required={false}
                            defaultValue={mintAmount}
                            onChange={(e) => setMintAmount(e.target.valueAsNumber)}
                        />
                    </div>
                </div>

                <div className="flex flex-row gap-8">
                    <ActionButton
                        type="button"
                        disabled={!exchangeToken}
                        onClick={mintTokens}
                    >
                        Mint Tokens
                    </ActionButton>
                </div>
            </form>
        </div>
    )
}