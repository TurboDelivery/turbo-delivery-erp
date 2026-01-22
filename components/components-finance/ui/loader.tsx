
'use client'
import React from "react";
import { Loader2 } from "lucide-react";
import { siteConfig } from "@/config/site";
import { useMounted } from "@/hooks/use-mounted";
import Image from "next/image";
const Loader = () => {
    const mounted = useMounted()
    return (
        mounted ? null : <div className=" h-screen flex items-center justify-center flex-col space-y-2">

            <div className="flex gap-2 items-center ">
                <Image
                    src="/assets/images/logo_turbo.jpg"
                    alt="Logo"
                    width={100}
                    height={100}
                    className="h-10 w-10 rounded-lg" />
                <h1 className="text-xl font-semibold text-default-900 ">
                    {siteConfig.name}
                </h1>
            </div>
            <span className=" inline-flex gap-1  items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-red-500" />
                Loading...
            </span>
        </div>
    );
};

export default Loader;

