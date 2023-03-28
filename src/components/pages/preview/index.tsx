import Tabs, { Tab } from "@/components/tabs";
import { useRates } from "@/context/rates";
import { useWallet } from "@/context/wallet";
import { MAPI_HOST } from "@/pages/_app";
import { useLocalStorage } from "@/utils/storage";
import { WithRouterProps } from "next/dist/client/with-router";
import Head from "next/head";
import Router from "next/router";
import { useCallback, useEffect, useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import toast from "react-hot-toast";
import { FiCopy } from "react-icons/fi";
import { RxReset } from "react-icons/rx";
import { TbBroadcast } from "react-icons/tb";
import { FetchStatus } from "../../pages";

type BroadcastResponse = {
  encoding: string;
  mimeType: string;
  payload: string;
  publicKey: string;
  signature: string;
};

type BroadcastResponsePayload = {
  apiVersion: string;
  currentHighestBlockHash: string;
  currentHighestBlockHeight: number;
  minerId: string;
  resultDescription: string;
  returnResult: string;
  timestamp: string;
  txSecondMempoolExpiry: number;
  txid: string;
};

interface PageProps extends WithRouterProps {}

const PreviewPage: React.FC<PageProps> = ({ router }) => {
  const {
    pendingTransaction,
    fundingUtxos,
    getUTXOs,
    changeAddress,
    setOrdUtxos,
    ordUtxos,
  } = useWallet();

  const [broadcastResponsePayload, setBroadcastResponsePayload] =
    useLocalStorage<BroadcastResponsePayload>("1satbrs", undefined);
  const [broadcastStatus, setBroadcastStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );

  const [usdRate, setUsdRate] = useState<number>(0);
  const { rates } = useRates();

  useEffect(() => {
    if (rates && rates.length > 0) {
      // Gives rate for 1 USD in satoshis
      let usdRate = rates.filter((r) => r.currency === "usd")[0]
        .price_in_satoshis;
      setUsdRate(usdRate);
    }
  }, [rates, usdRate]);

  useEffect(() => {
    const fire = async (a: string) => {
      await getUTXOs(a);
    };

    if (changeAddress && broadcastStatus === FetchStatus.Success) {
      setTimeout(() => fire(changeAddress), 3000);
    }
  }, [getUTXOs, broadcastStatus, changeAddress]);

  const handleClickBroadcast = useCallback(async () => {
    if (!fundingUtxos) {
      return;
    }
    console.log("click broadcast", pendingTransaction?.rawTx);
    if (!pendingTransaction?.rawTx) {
      return;
    }
    setBroadcastStatus(FetchStatus.Loading);
    const body = Buffer.from(pendingTransaction.rawTx, "hex");
    const response = await fetch(`${MAPI_HOST}/mapi/tx`, {
      method: "POST",
      headers: {
        "Content-type": "application/octet-stream",
      },
      body,
    });

    const data: BroadcastResponse = await response.json();
    console.log({ data });
    if (data && data.payload) {
      const respData = JSON.parse(
        data.payload || "{}"
      ) as BroadcastResponsePayload;
      if (respData?.returnResult === "success") {
        toast.success("Broadcasted", {
          style: {
            background: "#333",
            color: "#fff",
          },
        });
        setBroadcastStatus(FetchStatus.Success);
        setBroadcastResponsePayload(respData);

        // setOrdUtxos([...(ordUtxos || []), pendingOrdUtxo]);
        Router.push("/ordinals");
        return;
      } else {
        toast.error("Failed to broadcast " + respData.resultDescription, {
          style: {
            background: "#333",
            color: "#fff",
          },
        });
      }
      setBroadcastStatus(FetchStatus.Error);
    }
  }, [
    //pendingOrdUtxo,
    ordUtxos,
    pendingTransaction,
    setBroadcastResponsePayload,
    fundingUtxos,
  ]);

  return (
    <>
      <Head>
        <title>1SatOrdinals.com</title>
        <meta
          name="description"
          content="An Ordinals-compatible implementation on Bitcoin SV"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto+Mono&family=Roboto+Slab&family=Ubuntu:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Tabs currentTab={Tab.Ordinals} />

      {pendingTransaction && (
        <div>
          <h1 className="text-center text-2xl">
            {`${pendingTransaction.numOutputs === 1 ? "Refund" : "Ordinal"}
            Generated`}
          </h1>
          <div className="text-center text-[#aaa] my-2">
            You still need to broadcast this before it goes live.
          </div>
          <div className="w-[600px] w-full max-w-lg mx-auto p-2 h-[300px] whitespace-pre-wrap break-all font-mono rounded bg-[#111] text-xs text-ellipsis overflow-hidden p-2 text-teal-700 my-8 relative">
            {pendingTransaction.rawTx}
            <div className="p-4 absolute w-full text-white bg-black bg-opacity-75 bottom-0 left-0">
              <div className="flex justify-between border-b pb-2 mb-2 border-[#222]">
                <div>{pendingTransaction.numInputs} Inputs</div>
                <div>{pendingTransaction.numOutputs} Outputs</div>
              </div>
              <div className="flex justify-between">
                <div>Size</div>
                <div>{pendingTransaction.rawTx?.length / 2} Bytes</div>
              </div>
              <div className="flex justify-between">
                <div>Fee</div>
                <div>{pendingTransaction.fee} Satoshis</div>
              </div>
              <div className="flex justify-between">
                <div>Fee USD</div>
                <div>${(pendingTransaction.fee / usdRate).toFixed(2)}</div>
              </div>
              {pendingTransaction.fee && (
                <div className="flex justify-between">
                  <div>Fee Rate</div>
                  <div>
                    {(
                      pendingTransaction.fee /
                      (pendingTransaction.rawTx?.length / 2)
                    ).toFixed(5)}{" "}
                    sat/B
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="max-w-md mx-auto">
            <CopyToClipboard
              text={pendingTransaction?.rawTx}
              onCopy={() =>
                toast.success("Copied Raw Tx", {
                  style: {
                    background: "#333",
                    color: "#fff",
                  },
                })
              }
            >
              <button className="w-full p-2 text-lg bg-teal-400 rounded my-4 text-black font-semibold flex items-center">
                <div className="mx-auto flex items-center justify-center">
                  <FiCopy className="w-10" />
                  <div>Copy</div>
                </div>
              </button>
            </CopyToClipboard>

            <button
              onClick={handleClickBroadcast}
              className="w-full p-2 text-lg disabled:bg-[#333] text-[#aaa] bg-orange-400 rounded my-4 text-black font-semibold"
              disabled={broadcastStatus === FetchStatus.Loading}
            >
              <div className="mx-auto flex items-center justify-center">
                <TbBroadcast className="w-10" />
                <div>Broadcast</div>
              </div>
            </button>
            <button
              onClick={() => {
                // reset();
                // setShowInscribe(false);
                // // setShowWallet(false);
                Router.push("/inscribe");
              }}
              className="w-full p-2 text-lg bg-gray-400 rounded my-4 text-black font-semibold"
            >
              <div className="mx-auto flex items-center justify-center">
                <RxReset className="w-10" />
                <div>Start Over</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PreviewPage;
