import ActionButton from "../components/ActionButton";
import Auth from "../components/Auth";
import NumberInput from "../components/NumberInput";
import PageHeading from "../components/PageHeading";

import { ContractCallRegularOptions, openContractCall } from "@stacks/connect";
import { StacksTestnet } from "@stacks/network";
import { useTransactionToasts } from "../providers/TransactionToastProvider";
import { microstacksPerSTX, contractOwnerAddress, exchangeContractName, appDetails } from "../lib/constants";
import { useEffect, useState } from "react";
import { AppConfig, showConnect, UserData, UserSession } from "@stacks/connect";

import { createAssetInfo, FungibleConditionCode, makeStandardFungiblePostCondition, makeStandardSTXPostCondition, uintCV } from "@stacks/transactions";
// import { useStacks } from "../providers/StacksProvider";
import fetchExchangeInfo from "../lib/fetchExchangeInfo";
import { ExchangeInfo } from "../lib/fetchExchangeInfo";



export default function LiquidityPage() {
    const { addTransactionToast } = useTransactionToasts()
    const [exchangeInfo, setExchangeInfo] = useState<ExchangeInfo | undefined>(undefined)
    // const { network, address } = useStacks()
    const network = new StacksTestnet()
    const [userData, setUserData] = useState<UserData | undefined>(undefined);
    const address = userData?.profile?.stxAddress?.testnet

    const appConfig = new AppConfig(['store_write'])
    const userSession = new UserSession({ appConfig });

    useEffect(() => {
        if (userSession.isSignInPending()) {
            userSession.handlePendingSignIn().then((userData) => {
                setUserData(userData);
            });
        } else if (userSession.isUserSignedIn()) {
            // setLoggedIn(true);
            setUserData(userSession.loadUserData());
        }
    }, []);


    const exchangeRatio = exchangeInfo && exchangeInfo.stxBalance ? exchangeInfo.tokenBalance / exchangeInfo.stxBalance : undefined

    const fetchExchangeInfoOnLoad = async () => {
        if (!address) {
            console.log("Can't fetch exchange info without sender address")
            return
        }

        const exchangeInfo = await fetchExchangeInfo(network, address)
        setExchangeInfo(exchangeInfo)
    }

    useEffect(() => {
        fetchExchangeInfoOnLoad()
    }, [address])

    const provideLiquidity = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!address) {
            console.error("Must be logged in to provide liquidity")
            return
        }

        console.log("Providing liquidity...")

        const network = new StacksTestnet()

        // (contract-call? .beanstalk-exchange provide-liquidity u1000 u2000)
        const stxAmount = (e.currentTarget.elements.namedItem("stx-amount") as HTMLInputElement).valueAsNumber
        const microstacksAmount = stxAmount * microstacksPerSTX

        const tokenAmount = (e.currentTarget.elements.namedItem("token-amount") as HTMLInputElement).valueAsNumber

        const stxPostCondition = makeStandardSTXPostCondition(
            address,
            FungibleConditionCode.Equal,
            microstacksAmount,
        )

        const tokenPostCondition = makeStandardFungiblePostCondition(
            address,
            FungibleConditionCode.Equal,
            tokenAmount,
            createAssetInfo(contractOwnerAddress, 'magic-beans', 'magic-beans')
        )

        const options: ContractCallRegularOptions = {
            contractAddress: contractOwnerAddress,
            contractName: exchangeContractName,
            functionName: 'provide-liquidity',
            functionArgs: [
                uintCV(microstacksAmount),
                uintCV(tokenAmount),
            ],
            postConditions: [stxPostCondition, tokenPostCondition],
            network,
            appDetails,
            onFinish: ({ txId }) => addTransactionToast(txId, `Providing liquidity (${stxAmount} STX)...`),
        }

        await openContractCall(options)
    }

    const makeExchangeRatioSection = () => {
        if (!exchangeInfo) {
            return <p>Fetching exchange data...</p>
        }
        if (!exchangeRatio) {
            return <p>No liquidity yet!</p>
        }

        // toFixed(6) rounds to 6 decimal places, the + removes trailing 0s. Eg. 0.050000 -> 0.05
        return <p>1 STX = <b>{+exchangeRatio.toFixed(6)}</b> Magic Beans</p>
    }

    return (
        <div className="flex flex-col items-stretch max-w-4xl gap-8 m-auto">
            <PageHeading>Provide Liquidity</PageHeading>

            <Auth />

            {makeExchangeRatioSection()}

            <form className="flex flex-row items-end gap-4" onSubmit={provideLiquidity}>
                <div>
                    <label htmlFor="stx-amount" className="block text-sm font-medium text-gray-700">
                        STX to provide
                    </label>
                    <div className="mt-1">
                        <NumberInput
                            name="stx-amount"
                            placeholder={123}
                            required={true}
                            decimals={6}
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="token" className="block text-sm font-medium text-gray-700">
                        Magic Beans to provide
                    </label>
                    <div className="mt-1">
                        <NumberInput
                            name="token-amount"
                            placeholder={456}
                            required={true}
                            decimals={0}
                        />
                    </div>
                </div>

                <ActionButton type="submit">
                    Provide Liquidity
                </ActionButton>
            </form>
        </div>
    )
}