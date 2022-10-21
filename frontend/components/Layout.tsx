import { PropsWithChildren } from "react";
import Footer from "./Footer";
import Navbar from "./Navbar";
import Auth from "../components/Auth"

export default function Layout({ children }: PropsWithChildren<{}>) {
  return (
    <div className="flex flex-col min-h-screen gap-16">
      <Navbar />
      {/* <Auth /> */}
      <main className="mb-auto">
        {children}
      </main>
      <Footer />
    </div>
  )
}
