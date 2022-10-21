import PageHeading from "../components/PageHeading";
import SecondaryButton from "../components/SecondaryButton";
import { AppConfig, showConnect, UserSession } from "@stacks/connect";
import { appDetails } from "../lib/constants";
import { useEffect, useState } from "react";


function Auth() {
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

    console.log({ userData, address })

    const handleLogIn = async () => {
        showConnect({
            appDetails,
            onFinish: () => window.location.reload(),
            userSession,
        });
    }

    const logUserOut = async () => {
        userSession.signUserOut();
        window.location.reload();
    }

    if (address) {
        return (
            <div className="flex flex-row items-center gap-4">
                <p>Logged in as: <b> {address}</b></p>
                <SecondaryButton type="button" onClick={handleLogIn}>Change Account</SecondaryButton>
                <SecondaryButton type="button" onClick={logUserOut}>Log Out</SecondaryButton>
            </div>
        )
    } else {
        return (
            <SecondaryButton type="button" onClick={handleLogIn}>Connect Wallet</SecondaryButton>
        )
    }

    return (
        <SecondaryButton type="button" onClick={handleLogIn}>Connect Wallet</SecondaryButton>
    )
}

export default function AdminPage() {
    return (
        <div className="flex flex-col items-stretch max-w-4xl gap-8 m-auto">
            <PageHeading>Admin</PageHeading>

            <Auth />
        </div>
    )
}