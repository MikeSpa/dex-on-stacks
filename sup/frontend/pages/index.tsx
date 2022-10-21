import { useState, useEffect } from "react";
import Head from "next/head";
import { AppConfig, UserSession, showConnect } from "@stacks/connect";

export default function Home() {
  const appConfig = new AppConfig(["publish_data"]);
  const userSession = new UserSession({ appConfig });

  const [message, setMessage] = useState("");
  const [price, setPrice] = useState(10);
  const [userData, setUserData] = useState({});
  const [loggedIn, setLoggedIn] = useState(false);

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };

  const handlePriceChange = (e) => {
    setPrice(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Do Stacks things
  };

  function authenticate() {
    showConnect({
      appDetails: {
        name: "Sup",
        icon: "https://assets.website-files.com/618b0aafa4afde65f2fe38fe/618b0aafa4afde2ae1fe3a1f_icon-isotipo.svg",
      },
      redirectTo: "/",
      onFinish: () => {
        window.location.reload();
      },
      userSession,
    });
  }

  useEffect(() => {
    if (userSession.isSignInPending()) {
      userSession.handlePendingSignIn().then((userData) => {
        setUserData(userData);
      });
    } else if (userSession.isUserSignedIn()) {
      setLoggedIn(true);
      setUserData(userSession.loadUserData());
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <Head>
        <title>Sup</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <div className="flex flex-col w-full items-center justify-center">
          <h1 className="text-6xl font-bold mb-24">Sup</h1>

          {loggedIn ? ( // if login then form else connect button
            <form onSubmit={handleSubmit}>
              <p>
                Say
                <input
                  className="p-6 border rounded mx-2"
                  type="text"
                  value={message}
                  onChange={handleMessageChange}
                  placeholder="something"
                />
                for
                <input
                  className="p-6 border rounded mx-2"
                  type="number"
                  value={price}
                  onChange={handlePriceChange}
                />{" "}
                STX
              </p>
              <button
                type="submit"
                className="p-6 bg-green-500 text-white mt-8 rounded"
              >
                Post Message
              </button>
            </form>
          ) : (

            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-6"
              onClick={() => authenticate()}
            >
              Connect to Wallet
            </button>
          )}
        </div>
      </main>
    </div>
  );
}