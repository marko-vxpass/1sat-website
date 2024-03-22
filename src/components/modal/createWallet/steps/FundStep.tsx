import { showDepositModal } from "@/signals/wallet";

interface Props {
  onClose: () => void;
}

export function FundStep({ onClose }: Props) {
  function handleFundWallet() {
    onClose();
    showDepositModal.value = true;
  }

  return (
    <>
      <div>You successfully created a wallet!</div>

      <div className="p-2 rounded my-2">
        You will need to fund your wallet in order to use it.
      </div>

      <div className="modal-action">
        <button className="btn" type="button" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={handleFundWallet}
        >
          Fund Wallet
        </button>
      </div>
    </>
  );
}
