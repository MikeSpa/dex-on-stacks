import { AuthOptions } from "@stacks/connect";

export const appDetails: AuthOptions["appDetails"] = {
    name: "Beanstalk Exchange",
    icon: "https://freesvg.org/img/youk-k-Beanstalk.png",
}

export const contractOwnerAddress = "ST28AR7Q1DQ3Z7QG0A8GY9JZVDWJ4XSSXBA05S0C1"// testnet Acc2 "deployer"

// export const tokenName = "magic-beans-v1"
export const exchangeContractName = "beanstalk-exchange-v2"
export const microstacksPerSTX = 1_000_000