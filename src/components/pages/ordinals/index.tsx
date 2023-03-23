import Artifact from "@/components/artifact";
import Tabs, { Tab } from "@/components/tabs";
import { useWallet } from "@/context/wallet";
import { WithRouterProps } from "next/dist/client/with-router";
import Head from "next/head";
import Router from "next/router";
import { useEffect, useMemo } from "react";
import { LoaderIcon } from "react-hot-toast";
import { FetchStatus } from "..";

interface PageProps extends WithRouterProps {}

const OrdinalsPage: React.FC<PageProps> = ({ router }) => {
  const {
    ordAddress,
    fetchOrdinalUtxosStatus,
    setFetchOrdinalUtxosStatus,
    payPk,
    ordPk,
    ordUtxos,
    getOrdinalUTXOs,
  } = useWallet();

  useEffect(() => {
    const fire = async (a: string) => {
      await getOrdinalUTXOs(a);
    };
    if (ordAddress && fetchOrdinalUtxosStatus === FetchStatus.Idle) {
      fire(ordAddress);
    }
  }, [getOrdinalUTXOs, ordAddress, fetchOrdinalUtxosStatus]);

  const artifacts = useMemo(() => {
    {
      return (
        ordUtxos?.every((a) => !!a.type) &&
        ordUtxos?.map((a) => {
          return (
            <Artifact
              key={`${a.txid}_${a.vout}`}
              outPoint={`${a.txid}_${a.vout}`}
              contentType={a.type}
            />
          );
        })
      );
    }
  }, [ordUtxos]);

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

      <div>
        {fetchOrdinalUtxosStatus !== FetchStatus.Loading && (
          <div
            className="text-sm text-center mx-auto cursor-pointer text-blue-500 hover:text-blue-400"
            onClick={() => setFetchOrdinalUtxosStatus(FetchStatus.Idle)}
          >
            Refresh
          </div>
        )}

        {fetchOrdinalUtxosStatus === FetchStatus.Loading && (
          <div className="w-full my-12 max-w-4xl mx-auto text-center">
            <LoaderIcon className="mx-auto" />
          </div>
        )}

        {fetchOrdinalUtxosStatus !== FetchStatus.Loading &&
          (!payPk || !ordPk) && (
            <div
              className="max-w-md rounded my-8 bg-[#222] hover:bg-[#333] cursor-pointer mx-auto p-8"
              onClick={() => Router.push("./wallet")}
            >
              You need a wallet first.
            </div>
          )}
        {fetchOrdinalUtxosStatus === FetchStatus.Success &&
          ordUtxos?.length === 0 &&
          payPk &&
          ordPk && (
            <div className="max-w-md rounded bg-[#222] hover:bg-[#333] cursor-pointer mx-auto p-8 my-8">
              You, sadly, have no artifacts.
            </div>
          )}

        <div className="w-full my-12 grid grid-cols-2 gap-4 md:grid-cols-4 max-w-4xl mx-auto">
          {artifacts}
        </div>
      </div>
    </>
  );
};

export default OrdinalsPage;
