"use client";
import Image from "next/image";
import { FetchSomeData } from "./action";

export default function Home() {
  return (
    <>
      <Image src="/globe.svg" alt="Logo" width={100} height={100} />
      <button
        onClick={async () => {
          const data = await FetchSomeData();
          console.log(data);
        }}
      >
        Test BUtton
      </button>
    </>
  );
}
